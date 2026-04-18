/**
 * Verify Paystack webhook `x-paystack-signature` (HMAC SHA512 of raw body).
 * @see https://paystack.com/docs/payments/webhooks
 */

import crypto from 'crypto';

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!secret || !signatureHeader) {
    return false;
  }
  const hash = crypto.createHmac('sha512', secret).update(rawBody, 'utf8').digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(signatureHeader.trim(), 'hex'));
  } catch {
    return hash === signatureHeader.trim();
  }
}
