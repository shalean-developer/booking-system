/**
 * Zoho Books — contacts + invoices (Node / Next.js).
 * Invoices must use customer_id; inline customer_name/email often returns code 3008.
 */

import {
  buildZohoInvoicePayloadParts,
  type ZohoInvoiceBookingInput,
} from '../supabase/functions/_shared/zoho-invoice-payload';
import { fetchActivePricing, type PricingData } from './pricing-db';
import { PRICING } from './pricing';

async function loadPricingForZohoInvoice(): Promise<PricingData> {
  try {
    return await fetchActivePricing();
  } catch (e) {
    console.warn(
      '[zoho-server] fetchActivePricing failed — using PRICING catalog fallback for invoice lines',
      e instanceof Error ? e.message : e,
    );
    return PRICING;
  }
}

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

/**
 * Deep link to open an invoice in Zoho Books (browser). Uses org id from env.
 * Set ZOHO_BOOKS_WEB_HOST for EU (e.g. https://books.zoho.eu) if needed.
 */
export function buildZohoBooksInvoiceWebUrl(zohoInvoiceId: string | null | undefined): string | null {
  const id = zohoInvoiceId?.trim();
  const orgId = process.env.ZOHO_BOOKS_ORGANIZATION_ID?.trim();
  if (!id || !orgId) return null;
  const webHost =
    process.env.ZOHO_BOOKS_WEB_HOST?.trim() ||
    (() => {
      const api = process.env.ZOHO_BOOKS_API_HOST?.trim() || '';
      if (/zohoapis\.eu/i.test(api)) return 'https://books.zoho.eu';
      if (/zohoapis\.in/i.test(api)) return 'https://books.zoho.in';
      return 'https://books.zoho.com';
    })();
  return `${webHost.replace(/\/$/, '')}/app/${encodeURIComponent(orgId)}#/invoices/${encodeURIComponent(id)}`;
}

/** True only when org id is set and at least one auth path exists (static token or OAuth refresh trio). */
export function isZohoBooksConfigured(): boolean {
  return getZohoBooksConfigGaps().length === 0;
}

/**
 * Human-readable list of missing Zoho env vars (for logs and diagnostics).
 * Empty array means `isZohoBooksConfigured()` would be true.
 */
export function getZohoBooksConfigGaps(): string[] {
  const gaps: string[] = [];
  if (!process.env.ZOHO_BOOKS_ORGANIZATION_ID?.trim()) {
    gaps.push('ZOHO_BOOKS_ORGANIZATION_ID');
  }
  const staticToken = process.env.ZOHO_ACCESS_TOKEN?.trim();
  const refresh = process.env.ZOHO_REFRESH_TOKEN?.trim();
  const clientId = process.env.ZOHO_CLIENT_ID?.trim();
  const clientSecret = process.env.ZOHO_CLIENT_SECRET?.trim();
  const hasOAuthTrio = Boolean(refresh && clientId && clientSecret);
  if (!staticToken && !hasOAuthTrio) {
    gaps.push('ZOHO_ACCESS_TOKEN or (ZOHO_REFRESH_TOKEN + ZOHO_CLIENT_ID + ZOHO_CLIENT_SECRET)');
  }
  return gaps;
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

function truncateForZoho(value: string, max = 100): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1).trimEnd() + '…';
}

function normalizeZohoText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function buildZohoAddress(address?: {
  line1?: string | null;
  suburb?: string | null;
  city?: string | null;
}): { address?: string; city?: string; country?: string } | undefined {
  const rawLine = normalizeZohoText([address?.line1, address?.suburb].filter(Boolean).join(', '));
  const rawCity = normalizeZohoText(address?.city || '');
  if (!rawLine && !rawCity) return undefined;

  // Keep safely below Zoho's billing_address threshold.
  const shortLine = rawLine ? truncateForZoho(rawLine, 80) : undefined;
  const shortCity = rawCity ? truncateForZoho(rawCity, 40) : undefined;
  const compactAddress = [shortLine, shortCity].filter(Boolean).join(', ');

  return {
    address: compactAddress ? truncateForZoho(compactAddress, 90) : undefined,
    city: shortCity,
    country: 'ZA',
  };
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
  phone?: string | null,
  address?: {
    line1?: string | null;
    suburb?: string | null;
    city?: string | null;
  },
): Promise<string> {
  const { first, last } = splitDisplayName(displayName);
  const payload = {
    contact_name: displayName.trim() || `Booking ${email}`,
    contact_type: 'customer',
    customer_sub_type: 'individual',
    phone: phone?.trim() || undefined,
    billing_address: buildZohoAddress(address),
    contact_persons: [
      {
        first_name: first,
        last_name: last,
        email,
        phone: phone?.trim() || undefined,
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
  customerPhone?: string | null;
  customerAddress?: {
    line1?: string | null;
    suburb?: string | null;
    city?: string | null;
  };
  bookingId: string;
}): Promise<string> {
  const email = emailForZoho(params.customerEmail, params.bookingId);
  const existing = await findContactIdByEmail(params.token, params.orgId, email);
  if (existing) return existing;

  try {
    return await createContact(
      params.token,
      params.orgId,
      params.customerName,
      email,
      params.customerPhone,
      params.customerAddress,
    );
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
  booking: ZohoInvoiceBookingInput;
  /** Paystack transaction reference — stored on Zoho payment and must match settlement amount context. */
  paystackReference?: string | null;
}): Promise<string | null> {
  const orgId = process.env.ZOHO_BOOKS_ORGANIZATION_ID?.trim();
  if (!orgId) {
    console.warn('[zoho-server] ZOHO_BOOKS_ORGANIZATION_ID not set — skipping invoice');
    return null;
  }

  const b = params.booking;
  const bookingId = b.id;
  const customerAddress = {
    line1: b.address_line1,
    suburb: b.address_suburb,
    city: b.address_city,
  };

  const token = await getAccessToken();
  const pricing = await loadPricingForZohoInvoice();
  const { line_items, notes } = buildZohoInvoicePayloadParts({ booking: b, pricing });

  const bookingCf = process.env.ZOHO_BOOKS_CUSTOM_FIELD_BOOKING_ID?.trim();
  const custom_fields = bookingCf ? [{ customfield_id: bookingCf, value: bookingId }] : undefined;

  const customerId = await getOrCreateCustomerContactId({
    token,
    orgId,
    customerName: b.customer_name?.trim() || 'Customer',
    customerEmail: b.customer_email,
    customerPhone: b.customer_phone,
    customerAddress,
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
    billing_address: buildZohoAddress(customerAddress),
  };

  const url = `${booksApiHost()}/books/v3/invoices?organization_id=${encodeURIComponent(orgId)}`;
  const createInvoice = async (bodyPayload: Record<string, unknown>) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });
    const data = (await res.json()) as Record<string, unknown>;
    return { res, data };
  };

  let { res, data } = await createInvoice(payload as Record<string, unknown>);
  let okCode = data.code === 0 || data.code === '0';
  if (!res.ok || !okCode) {
    const msg = String((data as { message?: string }).message || '').toLowerCase();
    const billingAddressRejected = msg.includes('billing_address');
    if (billingAddressRejected) {
      const fallbackPayload = { ...payload, billing_address: undefined };
      ({ res, data } = await createInvoice(fallbackPayload as Record<string, unknown>));
      okCode = data.code === 0 || data.code === '0';
    }
  }
  if (!res.ok || !okCode) {
    const msg = String((data as { message?: string }).message || '').toLowerCase();
    const customFieldRejected =
      custom_fields && (msg.includes('custom_field') || msg.includes('customfield'));
    if (customFieldRejected) {
      const fallbackPayload = { ...payload, custom_fields: undefined };
      ({ res, data } = await createInvoice(fallbackPayload as Record<string, unknown>));
      okCode = data.code === 0 || data.code === '0';
    }
  }
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
    bookingId,
    paystackReference: params.paystackReference,
  });

  return invoiceId;
}

type ZohoInvoiceDetails = {
  invoice_id?: string;
  /** Human-readable number printed on the PDF (e.g. INV-00001) — differs from invoice_id. */
  invoice_number?: string;
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

/**
 * Human-readable invoice number as printed on the Zoho PDF (not the internal `invoice_id`).
 */
export async function fetchZohoInvoiceNumber(zohoInvoiceId: string): Promise<string | null> {
  const orgId = process.env.ZOHO_BOOKS_ORGANIZATION_ID?.trim();
  if (!orgId) return null;
  const id = zohoInvoiceId.trim();
  if (!id) return null;
  try {
    const token = await getAccessToken();
    const details = await getInvoiceDetails(token, orgId, id);
    const normalized = normalizeZohoInvoiceNumber(details.invoice_number);
    if (!normalized && details.invoice_number != null) {
      console.warn('[zoho-server] Ignoring unexpected invoice_number shape', {
        zohoInvoiceId: id,
        invoice_number: String(details.invoice_number).trim(),
      });
    }
    return normalized;
  } catch (e) {
    console.warn('[zoho-server] fetchZohoInvoiceNumber', e);
    return null;
  }
}

/** Download invoice PDF (Zoho Books v3 `accept=pdf` query parameter). */
export async function fetchZohoInvoicePdfBuffer(zohoInvoiceId: string): Promise<Buffer | null> {
  const orgId = process.env.ZOHO_BOOKS_ORGANIZATION_ID?.trim();
  if (!orgId) {
    console.warn('[zoho-server] ZOHO_BOOKS_ORGANIZATION_ID not set — cannot fetch invoice PDF');
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
      console.error('[zoho-server] invoice PDF HTTP', res.status, errText.slice(0, 400));
      return null;
    }
    if (!ct.includes('pdf') && !ct.includes('octet-stream')) {
      const errText = await res.text().catch(() => '');
      console.error('[zoho-server] invoice PDF unexpected content-type', ct, errText.slice(0, 200));
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.byteLength > 0 ? buf : null;
  } catch (e) {
    console.error('[zoho-server] fetchZohoInvoicePdfBuffer failed', e);
    return null;
  }
}
