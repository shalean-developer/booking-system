/**
 * Invoke Supabase Edge Functions for Paystack + Zoho + Resend (server-side only).
 */

const FUNCTIONS_BASE = () => {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!base) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  }
  return `${base}/functions/v1`;
};

function edgeAuthHeaders(): Record<string, string> {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }
  return {
    Authorization: `Bearer ${key}`,
    apikey: key,
    'Content-Type': 'application/json',
  };
}

export async function edgeInitializePayment(body: { booking_id: string }) {
  const res = await fetch(`${FUNCTIONS_BASE()}/initialize-payment`, {
    method: 'POST',
    headers: edgeAuthHeaders(),
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as {
    ok: boolean;
    authorization_url?: string;
    reference?: string;
    error?: string;
  };
  if (!res.ok && !data.error) {
    return { ok: false as const, error: 'Paystack init failed' };
  }
  return data;
}

/**
 * Forward verified webhook body to Supabase Edge Function (Zoho + Resend + idempotency).
 * Call only after verifying x-paystack-signature locally.
 */
export async function edgeForwardPaystackWebhook(rawBody: string, signature: string | null) {
  if (!signature) {
    return { ok: false as const, error: 'Missing signature' };
  }
  const res = await fetch(`${FUNCTIONS_BASE()}/paystack-webhook`, {
    method: 'POST',
    headers: {
      ...edgeAuthHeaders(),
      'x-paystack-signature': signature,
    },
    body: rawBody,
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    return {
      ok: false as const,
      error: typeof data.error === 'string' ? data.error : `Edge webhook failed (${res.status})`,
      ...data,
    };
  }
  return data as { ok: boolean; duplicate?: boolean; booking_id?: string; zoho_invoice_id?: string | null; message?: string };
}

export async function edgeVerifyPayment(body: { reference: string; booking_id: string }) {
  const res = await fetch(`${FUNCTIONS_BASE()}/verify-payment`, {
    method: 'POST',
    headers: edgeAuthHeaders(),
    body: JSON.stringify(body),
  });
  return res.json() as Promise<{
    ok: boolean;
    duplicate?: boolean;
    booking_id?: string;
    zoho_invoice_id?: string | null;
    amount_zar?: number;
    service_type?: string | null;
    customer_name?: string | null;
    error?: string;
  }>;
}
