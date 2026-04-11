const PAYSTACK_BASE = 'https://api.paystack.co';

export async function paystackInitialize(params: {
  secretKey: string;
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, string>;
}): Promise<{ authorization_url: string; reference: string }> {
  const meta: Record<string, string> = {
    booking_id: params.metadata?.booking_id ?? '',
    ...(params.metadata ?? {}),
  };

  const body: Record<string, unknown> = {
    email: params.email,
    amount: params.amountKobo,
    reference: params.reference,
    metadata: meta,
  };
  if (params.callbackUrl) {
    body.callback_url = params.callbackUrl;
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok || !data?.status) {
    throw new Error(data?.message || 'Paystack initialize failed');
  }
  return {
    authorization_url: data.data.authorization_url,
    reference: data.data.reference,
  };
}

export async function paystackVerify(secretKey: string, reference: string): Promise<{
  ok: boolean;
  amount: number;
  currency: string;
  status: string;
  customer?: { email?: string };
  metadata?: Record<string, unknown>;
}> {
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await res.json();
  if (!res.ok || !data?.data) {
    return { ok: false, amount: 0, currency: 'ZAR', status: 'failed' };
  }
  const d = data.data;
  return {
    ok: d.status === 'success',
    amount: Number(d.amount),
    currency: d.currency || 'ZAR',
    status: d.status,
    customer: d.customer,
    metadata: d.metadata,
  };
}

export async function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string,
): Promise<boolean> {
  if (!signature) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign'],
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
    const hex = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hex === signature;
  } catch {
    return false;
  }
}
