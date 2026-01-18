export type PaystackChargeAuthorizationResponse = {
  status: boolean;
  message?: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    currency?: string;
    authorization?: {
      authorization_code?: string;
      reusable?: boolean;
      signature?: string;
    };
  };
};

export async function chargePaystackAuthorization(params: {
  authorizationCode: string;
  email: string;
  amountCents: number;
  reference: string;
  currency?: string;
  metadata?: Record<string, any>;
}): Promise<PaystackChargeAuthorizationResponse> {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    throw new Error('PAYSTACK_SECRET_KEY not configured');
  }

  const res = await fetch('https://api.paystack.co/transaction/charge_authorization', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authorization_code: params.authorizationCode,
      email: params.email,
      amount: params.amountCents,
      reference: params.reference,
      currency: params.currency || 'ZAR',
      metadata: params.metadata || {},
    }),
  });

  const data = (await res.json()) as PaystackChargeAuthorizationResponse;
  if (!res.ok) {
    throw new Error(data?.message || 'Paystack charge_authorization failed');
  }
  return data;
}

