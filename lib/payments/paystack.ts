import 'server-only';

const PAYSTACK_BASE = 'https://api.paystack.co';

export type CreatePaymentLinkParams = {
  email: string;
  /** Amount in kobo (smallest currency unit for ZAR). */
  amountKobo: number;
  /** Paystack transaction reference (e.g. `booking-{uuid}`). */
  reference: string;
  callbackUrl: string;
  /** Flat string metadata (Paystack accepts nested objects; we keep strings for webhook parity). */
  metadata?: Record<string, string>;
};

export type CreatePaymentLinkResult =
  | { ok: true; authorization_url: string; reference: string }
  | { ok: false; error: string };

/**
 * Initialize a Paystack transaction and return the hosted payment URL.
 * @see https://paystack.com/docs/api/transaction/#initialize
 */
export async function createPaymentLink(params: CreatePaymentLinkParams): Promise<CreatePaymentLinkResult> {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret) {
    return { ok: false, error: 'PAYSTACK_SECRET_KEY is not configured' };
  }

  const email = params.email.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return { ok: false, error: 'Valid email is required' };
  }

  const amount = Math.round(params.amountKobo);
  if (!Number.isFinite(amount) || amount < 100) {
    return { ok: false, error: 'Invalid amount (kobo)' };
  }

  const ref = params.reference.trim();
  if (!ref) {
    return { ok: false, error: 'reference is required' };
  }

  try {
    const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount,
        reference: ref,
        callback_url: params.callbackUrl,
        metadata: params.metadata ?? {},
      }),
    });

    const data = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; reference?: string };
    };

    if (!res.ok || !data?.status || !data.data?.authorization_url) {
      return { ok: false, error: data?.message || `Paystack HTTP ${res.status}` };
    }

    return {
      ok: true,
      authorization_url: data.data.authorization_url,
      reference: String(data.data.reference ?? ref),
    };
  } catch (e) {
    console.error('[paystack] createPaymentLink', e);
    return { ok: false, error: e instanceof Error ? e.message : 'Initialize failed' };
  }
}
