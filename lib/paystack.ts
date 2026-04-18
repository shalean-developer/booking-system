/**
 * Paystack Transfers API — cleaner payouts (ZAR cents → Paystack smallest unit).
 * @see https://paystack.com/docs/api/transfer
 * @see https://paystack.com/docs/api/transfer-recipient
 */

const PAYSTACK_BASE = 'https://api.paystack.co';

function requireSecret(): string {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) {
    throw new Error('PAYSTACK_SECRET_KEY is not set');
  }
  return key;
}

export type PaystackTransferRecipientBody = {
  /** e.g. nuban (NG), basa (ZA) — depends on Paystack dashboard country */
  type: string;
  name: string;
  currency: string;
  account_number: string;
  bank_code: string;
  /** Optional metadata Paystack may accept on recipient create */
  metadata?: Record<string, string>;
};

export type CreateTransferRecipientResult = {
  ok: true;
  recipient_code: string;
  raw: unknown;
};

export type PaystackErrorResult = {
  ok: false;
  message: string;
  raw: unknown;
};

/**
 * POST /transferrecipient — register a cleaner bank account; store `recipient_code` in payout_recipients.
 */
export async function createPaystackTransferRecipient(
  body: PaystackTransferRecipientBody
): Promise<CreateTransferRecipientResult | PaystackErrorResult> {
  const secret = requireSecret();
  const res = await fetch(`${PAYSTACK_BASE}/transferrecipient`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok || raw?.status !== true) {
    return {
      ok: false,
      message: typeof raw?.message === 'string' ? raw.message : `HTTP ${res.status}`,
      raw,
    };
  }
  const code = raw?.data?.recipient_code;
  if (typeof code !== 'string' || !code.length) {
    return { ok: false, message: 'Missing recipient_code in Paystack response', raw };
  }
  return { ok: true, recipient_code: code, raw };
}

export type SendPaystackTransferParams = {
  /** Amount in cents (ZAR). Paystack expects smallest currency unit for ZAR. */
  amountCents: number;
  /** Paystack transfer recipient code */
  recipientCode: string;
  /**
   * Unique transfer reference (idempotency / webhook correlation).
   * Must match wallet_transactions.idempotency_key for webhook reconciliation.
   */
  reference?: string;
  reason?: string;
  /** Default ZAR */
  currency?: string;
  /** Paystack dashboard balance */
  source?: 'balance' | 'merchant_balance';
};

export type SendPaystackTransferResult =
  | { ok: true; reference: string; transferCode?: string; raw: unknown }
  | PaystackErrorResult;

/**
 * POST /transfer — send money to a registered recipient from Paystack balance.
 */
export async function sendPaystackTransfer(
  params: SendPaystackTransferParams
): Promise<SendPaystackTransferResult> {
  const secret = requireSecret();
  const currency = (params.currency || process.env.PAYSTACK_PAYOUT_CURRENCY || 'ZAR').trim();
  const source = params.source || 'balance';
  const amount = Math.round(params.amountCents);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, message: 'Invalid transfer amount', raw: null };
  }

  const body: Record<string, unknown> = {
    source,
    amount,
    recipient: params.recipientCode,
    currency,
    reason: params.reason || 'Shalean cleaner payout',
  };

  const ref = params.reference?.trim();
  if (ref) {
    body.reference = ref;
  }

  const res = await fetch(`${PAYSTACK_BASE}/transfer`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const raw = await res.json().catch(() => ({}));
  if (!res.ok || raw?.status !== true) {
    return {
      ok: false,
      message: typeof raw?.message === 'string' ? raw.message : `HTTP ${res.status}`,
      raw,
    };
  }
  const reference = raw?.data?.reference;
  const transferCode = raw?.data?.transfer_code;
  if (typeof reference !== 'string' || !reference.length) {
    return { ok: false, message: 'Missing transfer reference in Paystack response', raw };
  }
  return {
    ok: true,
    reference,
    transferCode: typeof transferCode === 'string' ? transferCode : undefined,
    raw,
  };
}
