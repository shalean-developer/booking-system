/**
 * Zoho Books — contacts + invoices (Node / Next.js).
 * Invoices must use customer_id; inline customer_name/email often returns code 3008.
 */

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const staticToken = process.env.ZOHO_ACCESS_TOKEN?.trim();
  const refresh = process.env.ZOHO_REFRESH_TOKEN?.trim();
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();

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

  const accountsHost = process.env.ZOHO_ACCOUNTS_HOST?.trim() || 'https://accounts.zoho.com';
  const res = await fetch(`${accountsHost}/oauth/v2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok || !data.access_token) {
    throw new Error(String(data.error || data.message || 'Zoho token refresh failed'));
  }

  const expiresIn = Number(data.expires_in_sec || data.expires_in || 3600);
  cachedToken = {
    token: data.access_token as string,
    expiresAt: now + expiresIn * 1000,
  };
  return cachedToken.token;
}

function booksApiHost(): string {
  return process.env.ZOHO_BOOKS_API_HOST?.trim() || 'https://www.zohoapis.com';
}

/** True only when org id is set and at least one auth path exists (static token or OAuth refresh trio). */
export function isZohoBooksConfigured(): boolean {
  const orgId = process.env.ZOHO_BOOKS_ORGANIZATION_ID?.trim();
  if (!orgId) return false;
  const staticToken = process.env.ZOHO_ACCESS_TOKEN?.trim();
  const refresh = process.env.ZOHO_REFRESH_TOKEN?.trim();
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
  if (staticToken) return true;
  if (refresh && clientId && clientSecret) return true;
  return false;
}

function zohoErrorDetail(data: { code?: number | string; message?: string }, status: number): string {
  return [data.code != null ? `code ${data.code}` : null, data.message]
    .filter(Boolean)
    .join(': ') || `Zoho request failed (HTTP ${status})`;
}

/** Valid email for Zoho; synthesize from booking id if missing. */
function emailForZoho(customerEmail: string | null | undefined, bookingId: string): string {
  const e = customerEmail?.trim().toLowerCase();
  if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return e;
  const domain = process.env.SENDER_EMAIL?.split('@')[1]?.trim() || 'shalean.co.za';
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
    console.warn('[zoho-server] list contacts', zohoErrorDetail(data, res.status));
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
    console.error('[zoho-server] create contact failed', res.status, data);
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

/** Zoho rejects invoices for inactive customers (code 3021). Reactivate via API. */
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

/** Zoho Books v3 usually returns `invoice.invoice_id`; tolerate minor shape differences. */
function extractInvoiceIdFromCreateResponse(data: Record<string, unknown>): string | null {
  const inv = data.invoice;
  if (inv && typeof inv === 'object' && inv !== null && 'invoice_id' in inv) {
    const id = (inv as { invoice_id?: string }).invoice_id;
    if (id != null && String(id)) return String(id);
  }
  if (typeof data.invoice_id === 'string' && data.invoice_id) return data.invoice_id;
  return null;
}

/**
 * Create invoice, mark as sent (not left in draft), record customer payment linked to the invoice
 * with payment_mode Paystack (falls back to API-allowed `others` if Zoho rejects the label).
 */
export async function createZohoBooksInvoiceServer(params: {
  customerName: string;
  customerEmail?: string | null;
  serviceName: string;
  amountZar: number;
  bookingId: string;
  /** Paystack transaction reference — stored on Zoho payment and must match settlement amount context. */
  paystackReference?: string | null;
}): Promise<string | null> {
  const orgId = process.env.ZOHO_BOOKS_ORGANIZATION_ID?.trim();
  if (!orgId) {
    console.warn('[zoho-server] ZOHO_BOOKS_ORGANIZATION_ID not set — skipping invoice');
    return null;
  }

  const token = await getAccessToken();
  const customerId = await getOrCreateCustomerContactId({
    token,
    orgId,
    customerName: params.customerName,
    customerEmail: params.customerEmail,
    bookingId: params.bookingId,
  });

  await ensureContactActive(token, orgId, customerId);

  const today = new Date().toISOString().slice(0, 10);
  const lineTotal = Math.round(params.amountZar * 100) / 100;

  const payload = {
    customer_id: customerId,
    date: today,
    due_date: today,
    is_inclusive_tax: false,
    line_items: [
      {
        name: `${params.serviceName} (Booking ${params.bookingId})`,
        description: `Cleaning service — ${params.serviceName}`,
        rate: lineTotal,
        quantity: 1,
      },
    ],
    reference_number: params.bookingId,
    notes: `Booking ID: ${params.bookingId}`,
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

  const data = (await res.json()) as Record<string, unknown>;
  const okCode = data.code === 0 || data.code === '0';
  if (!res.ok || !okCode) {
    console.error('[zoho-server] create invoice failed', res.status, data);
    throw new Error(zohoErrorDetail(data as { code?: number | string; message?: string }, res.status));
  }

  const invoiceId = extractInvoiceIdFromCreateResponse(data);
  if (!invoiceId) {
    console.error('[zoho-server] create invoice success but no invoice_id in body', data);
    return null;
  }

  await markInvoiceAsSent(token, orgId, invoiceId);

  const details = await getInvoiceDetails(token, orgId, invoiceId);
  const st = (details.status || '').toLowerCase();
  if (st === 'draft') {
    throw new Error('[zoho-server] Invoice is still in draft after mark sent');
  }

  const balance = num(details.balance);
  const total = num(details.total);
  const payAmount = balance > 0 ? balance : total;
  if (payAmount <= 0) {
    console.warn('[zoho-server] Invoice has zero balance/total; skipping customer payment');
    return invoiceId;
  }

  const payCustomerId = String(details.customer_id || customerId);
  await createCustomerPaymentLinkedToInvoice({
    token,
    orgId,
    customerId: payCustomerId,
    invoiceId,
    amount: payAmount,
    bookingId: params.bookingId,
    paystackReference: params.paystackReference,
  });

  return invoiceId;
}

type ZohoInvoiceDetails = {
  invoice_id?: string;
  customer_id?: string;
  status?: string;
  total?: number | string;
  balance?: number | string;
};

async function markInvoiceAsSent(token: string, orgId: string, invoiceId: string): Promise<void> {
  const url = `${booksApiHost()}/books/v3/invoices/${encodeURIComponent(invoiceId)}/status/sent?organization_id=${encodeURIComponent(orgId)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  const data = (await res.json()) as { code?: number | string; message?: string };
  const okCode = data.code === 0 || data.code === '0';
  if (okCode) return;
  const msg = (data.message || '').toLowerCase();
  if (
    msg.includes('not') &&
    (msg.includes('draft') || msg.includes('only') || msg.includes('mark'))
  ) {
    return;
  }
  if (msg.includes('already') || msg.includes('sent')) {
    return;
  }
  console.warn('[zoho-server] mark sent non-success (continuing if invoice not draft)', res.status, data);
}

async function getInvoiceDetails(
  token: string,
  orgId: string,
  invoiceId: string,
): Promise<ZohoInvoiceDetails> {
  const url = `${booksApiHost()}/books/v3/invoices/${encodeURIComponent(invoiceId)}?organization_id=${encodeURIComponent(orgId)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Zoho-oauthtoken ${token}` },
  });
  const data = (await res.json()) as {
    code?: number | string;
    message?: string;
    invoice?: ZohoInvoiceDetails;
  };
  const okCode = data.code === 0 || data.code === '0';
  if (!res.ok || !okCode || !data.invoice) {
    throw new Error(zohoErrorDetail(data as { code?: number | string; message?: string }, res.status));
  }
  return data.invoice;
}

function num(v: number | string | undefined): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function createCustomerPaymentLinkedToInvoice(params: {
  token: string;
  orgId: string;
  customerId: string;
  invoiceId: string;
  /** Must match invoice balance / total exactly (Zoho). */
  amount: number;
  bookingId: string;
  paystackReference?: string | null;
}): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const ref =
    (params.paystackReference && String(params.paystackReference).trim()) ||
    `booking-${params.bookingId}`;
  const basePayload = {
    customer_id: params.customerId,
    amount: params.amount,
    date: today,
    reference_number: ref.slice(0, 100),
    description: `Paystack — booking ${params.bookingId}`,
    invoices: [
      {
        invoice_id: params.invoiceId,
        amount_applied: params.amount,
      },
    ],
  };
  const accountId = process.env.ZOHO_BOOKS_DEPOSIT_ACCOUNT_ID?.trim();
  const url = `${booksApiHost()}/books/v3/customerpayments?organization_id=${encodeURIComponent(params.orgId)}`;

  const tryModes = ['Paystack', 'others'] as const;
  let lastErr: Error | null = null;

  for (const payment_mode of tryModes) {
    const body: Record<string, unknown> = {
      ...basePayload,
      payment_mode,
    };
    if (payment_mode === 'others') {
      body.description = `Paystack — booking ${params.bookingId} (mode: others)`;
    }
    if (accountId) {
      body.account_id = accountId;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${params.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { code?: number | string; message?: string };
    const okCode = data.code === 0 || data.code === '0';
    if (res.ok && okCode) {
      return;
    }
    const msg = String(data.message || '');
    lastErr = new Error(zohoErrorDetail(data, res.status));
    const lower = msg.toLowerCase();
    if (payment_mode === 'Paystack' && (lower.includes('payment_mode') || lower.includes('mode'))) {
      continue;
    }
    throw lastErr;
  }
  throw lastErr ?? new Error('Zoho customer payment failed');
}
