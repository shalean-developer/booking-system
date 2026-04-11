/**
 * Zoho Books — create invoice (minimal).
 * Docs: https://www.zoho.com/books/api/v3/invoices/#create-an-invoice
 */

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

export async function createZohoBooksInvoice(params: {
  customerName: string;
  customerEmail?: string | null;
  serviceName: string;
  amountZar: number;
  bookingId: string;
}): Promise<string | null> {
  const orgId = Deno.env.get('ZOHO_BOOKS_ORGANIZATION_ID')?.trim();
  if (!orgId) {
    console.warn('[zoho] ZOHO_BOOKS_ORGANIZATION_ID not set — skipping invoice');
    return null;
  }

  const token = await getAccessToken();
  const today = new Date().toISOString().slice(0, 10);

  const lineTotal = Math.round(params.amountZar * 100) / 100;

  const payload = {
    customer_name: params.customerName,
    customer_email: params.customerEmail || undefined,
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

  const data = await res.json();
  const okCode = data.code === 0 || data.code === '0';
  if (!res.ok || !okCode) {
    console.error('[zoho] create invoice failed', data);
    throw new Error(data.message || 'Zoho invoice creation failed');
  }

  const invoiceId = data?.invoice?.invoice_id ?? data?.invoice_id;
  return invoiceId ? String(invoiceId) : null;
}
