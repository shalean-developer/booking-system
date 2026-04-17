/**
 * Optional Supabase Edge Function proxy (initialize-payment only).
 * Payment fulfillment runs in Next.js — see lib/payments/fulfillBooking.ts.
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
