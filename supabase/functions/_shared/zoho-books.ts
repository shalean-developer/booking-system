/**
 * Zoho Books — contacts + invoices (Edge).
 * Invoices must use customer_id; inline customer_name/email often returns code 3008.
 */

import {
  buildZohoInvoicePayloadPartsWithStaticPricing,
  type ZohoInvoiceBookingInput,
} from './zoho-invoice-payload.ts';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const staticToken = Deno.env.get('ZOHO_ACCESS_TOKEN')?.trim();
  const refresh = Deno.env.get('ZOHO_REFRESH_TOKEN')?.trim();
  const clientId = Deno.env.get('ZOHO_CLIENT_ID')?.trim();
  const clientSecret = Deno.env.get('ZOHO_CLIENT_SECRET')?.trim();

  if (staticToken && !refresh) {
    return staticToken;
  }

  if (!refresh || !clientId || !clientSecret) {
    if (staticToken) return staticToken;
    throw new Error('Zoho is not configured (ZOHO_ACCESS_TOKEN or refresh client trio)');
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.token;
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refresh,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const accountsHost = Deno.env.get('ZOHO_ACCOUNTS_HOST')?.trim() || 'https://accounts.zoho.com';
  const res = await fetch(`${accountsHost}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || data.message || 'Zoho token refresh failed');
  }

  const expiresIn = Number(data.expires_in_sec || data.expires_in || 3600);
  cachedToken = {
    token: data.access_token as string,
    expiresAt: now + expiresIn * 1000,
  };
  return cachedToken.token;
}

function booksApiHost(): string {
  return Deno.env.get('ZOHO_BOOKS_API_HOST')?.trim() || 'https://www.zohoapis.com';
}

function zohoErrorDetail(data: { code?: number | string; message?: string }, status: number): string {
  return [data.code != null ? `code ${data.code}` : null, data.message]
    .filter(Boolean)
    .join(': ') || `Zoho request failed (HTTP ${status})`;
}

/**
 * Guard customer-facing invoice number. We only accept canonical invoice patterns
 * and explicitly reject booking/order refs such as SC19961999 / booking-uuid.
 */
function normalizeZohoInvoiceNumber(value: unknown): string | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (/^SC\d{6,}$/i.test(raw) || /^booking-/i.test(raw)) return null;
  if (!/^[A-Z]{2,10}-\d{2,}$/i.test(raw)) return null;
  return raw;
}

function emailForZoho(customerEmail: string | null | undefined, bookingId: string): string {
  const e = customerEmail?.trim().toLowerCase();
  if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return e;
  const domain = Deno.env.get('SENDER_EMAIL')?.split('@')[1]?.trim() || 'shalean.co.za';
  const safe = bookingId.replace(/[^a-zA-Z0-9]/g, '') || 'guest';
  return `guest+${safe}@${domain}`;
}

function splitDisplayName(name: string): { first: string; last: string } {
  const t = name.trim() || 'Customer';
  const parts = t.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: '-' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

async function findContactIdByEmail(
  token: string,
  orgId: string,
  email: string,
): Promise<string | null> {
  const url = `${booksApiHost()}/books/v3/contacts?organization_id=${encodeURIComponent(orgId)}&contact_type=customer&email=${encodeURIComponent(email)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  const data = (await res.json()) as {
    code?: number | string;
    contacts?: Array<{ contact_id?: string }>;
    message?: string;
  };
  const okCode = data.code === 0 || data.code === '0';
  if (!res.ok || !okCode) {
    console.warn('[zoho] list contacts', zohoErrorDetail(data, res.status));
    return null;
  }
  const id = data.contacts?.[0]?.contact_id;
  return id ? String(id) : null;
}

async function createContact(
  token: string,
  orgId: string,
  displayName: string,
  email: string,
): Promise<string> {
  const { first, last } = splitDisplayName(displayName);
  const payload = {
    contact_name: displayName.trim() || `Booking ${email}`,
    contact_type: 'customer',
    customer_sub_type: 'individual',
    contact_persons: [
      {
        first_name: first,
        last_name: last,
        email,
        is_primary_contact: true,
      },
    ],
  };

  const url = `${booksApiHost()}/books/v3/contacts?organization_id=${encodeURIComponent(orgId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as {
    code?: number | string;
    message?: string;
    contact?: { contact_id?: string };
  };
  const okCode = data.code === 0 || data.code === '0';
  if (!res.ok || !okCode) {
    console.error('[zoho] create contact failed', res.status, data);
    throw new Error(zohoErrorDetail(data, res.status));
  }
  const id = data.contact?.contact_id;
  if (!id) throw new Error('Zoho create contact returned no contact_id');
  return String(id);
}

async function getOrCreateCustomerContactId(params: {
  token: string;
  orgId: string;
  customerName: string;
  customerEmail: string | null | undefined;
  bookingId: string;
}): Promise<string> {
  const email = emailForZoho(params.customerEmail, params.bookingId);
  const existing = await findContactIdByEmail(params.token, params.orgId, email);
  if (existing) return existing;

  try {
    return await createContact(params.token, params.orgId, params.customerName, email);
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (msg.includes('3063') || /duplicate|already exists/i.test(msg)) {
      const again = await findContactIdByEmail(params.token, params.orgId, email);
      if (again) return again;
    }
    throw e;
  }
}

async function ensureContactActive(token: string, orgId: string, contactId: string): Promise<void> {
  const url = `${booksApiHost()}/books/v3/contacts/${encodeURIComponent(contactId)}/active?organization_id=${encodeURIComponent(orgId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  const data = (await res.json()) as { code?: number | string; message?: string };
  const okCode = data.code === 0 || data.code === '0';
  if (okCode) return;
  const msg = (data.message || '').toLowerCase();
  if (msg.includes('already') && (msg.includes('active') || msg.includes('activated'))) return;
  throw new Error(zohoErrorDetail(data, res.status));
}

export async function createZohoBooksInvoice(params: {
  booking: ZohoInvoiceBookingInput;
}): Promise<string | null> {
  const orgId = Deno.env.get('ZOHO_BOOKS_ORGANIZATION_ID')?.trim();
  if (!orgId) {
    console.warn('[zoho] ZOHO_BOOKS_ORGANIZATION_ID not set — skipping invoice');
    return null;
  }

  const b = params.booking;
  const bookingId = b.id;
  const token = await getAccessToken();
  const { line_items, notes } = buildZohoInvoicePayloadPartsWithStaticPricing(b);

  const bookingCf = Deno.env.get('ZOHO_BOOKS_CUSTOM_FIELD_BOOKING_ID')?.trim();
  const custom_fields = bookingCf ? [{ customfield_id: bookingCf, value: bookingId }] : undefined;

  const customerId = await getOrCreateCustomerContactId({
    token,
    orgId,
    customerName: b.customer_name?.trim() || 'Customer',
    customerEmail: b.customer_email,
    bookingId,
  });

  await ensureContactActive(token, orgId, customerId);

  const today = new Date().toISOString().slice(0, 10);

  const payload = {
    customer_id: customerId,
    date: today,
    due_date: today,
    is_inclusive_tax: false,
    line_items: line_items.map((li) => ({
      name: li.name,
      ...(li.description ? { description: li.description } : {}),
      rate: li.rate,
      quantity: li.quantity,
    })),
    reference_number: bookingId,
    notes,
    ...(custom_fields ? { custom_fields } : {}),
  };

  const url = `${booksApiHost()}/books/v3/invoices?organization_id=${encodeURIComponent(orgId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  const okCode = data.code === 0 || data.code === '0';
  if (!res.ok || !okCode) {
    console.error('[zoho] create invoice failed', data);
    throw new Error(data.message || 'Zoho invoice creation failed');
  }

  const invoiceId = data?.invoice?.invoice_id ?? data?.invoice_id;
  return invoiceId ? String(invoiceId) : null;
}

/**
 * Human-readable invoice number as on the Zoho PDF (e.g. INV-00001), not the internal invoice_id.
 */
export async function fetchZohoInvoiceNumber(zohoInvoiceId: string): Promise<string | null> {
  const orgId = Deno.env.get('ZOHO_BOOKS_ORGANIZATION_ID')?.trim();
  if (!orgId) return null;
  const id = zohoInvoiceId.trim();
  if (!id) return null;
  try {
    const token = await getAccessToken();
    const url = `${booksApiHost()}/books/v3/invoices/${encodeURIComponent(id)}?organization_id=${encodeURIComponent(
      orgId,
    )}`;
    const res = await fetch(url, {
      headers: { Authorization: `Zoho-oauthtoken ${token}` },
    });
    const data = (await res.json()) as {
      code?: number | string;
      message?: string;
      invoice?: { invoice_number?: string };
    };
    const okCode = data.code === 0 || data.code === '0';
    if (!res.ok || !okCode || !data.invoice) {
      console.warn('[zoho] fetchZohoInvoiceNumber failed', res.status, data?.message);
      return null;
    }
    const normalized = normalizeZohoInvoiceNumber(data.invoice.invoice_number);
    if (!normalized && data.invoice.invoice_number != null) {
      console.warn('[zoho] Ignoring unexpected invoice_number shape', {
        zohoInvoiceId: id,
        invoice_number: String(data.invoice.invoice_number).trim(),
      });
    }
    return normalized;
  } catch (e) {
    console.warn('[zoho] fetchZohoInvoiceNumber', e);
    return null;
  }
}

/**
 * Download invoice PDF (Zoho Books v3: `accept` query = pdf).
 * @see https://www.zoho.com/books/api/v3/invoices/#get-an-invoice
 */
export async function fetchZohoInvoicePdf(zohoInvoiceId: string): Promise<Uint8Array | null> {
  const orgId = Deno.env.get('ZOHO_BOOKS_ORGANIZATION_ID')?.trim();
  if (!orgId) {
    console.warn('[zoho] ZOHO_BOOKS_ORGANIZATION_ID not set — cannot fetch invoice PDF');
    return null;
  }
  const id = zohoInvoiceId.trim();
  if (!id) return null;

  try {
    const token = await getAccessToken();
    const url = `${booksApiHost()}/books/v3/invoices/${encodeURIComponent(id)}?organization_id=${encodeURIComponent(
      orgId,
    )}&accept=pdf`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        Accept: 'application/pdf',
      },
    });
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error('[zoho] invoice PDF HTTP', res.status, errText.slice(0, 400));
      return null;
    }
    if (!ct.includes('pdf') && !ct.includes('octet-stream')) {
      const errText = await res.text().catch(() => '');
      console.error('[zoho] invoice PDF unexpected content-type', ct, errText.slice(0, 200));
      return null;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return buf.byteLength > 0 ? buf : null;
  } catch (e) {
    console.error('[zoho] fetchZohoInvoicePdf failed', e);
    return null;
  }
}
