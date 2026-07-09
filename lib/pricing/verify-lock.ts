import crypto from 'crypto';

/**
 * When `PRICING_INTEGRITY_SIGNING_KEY` is unset, `next dev` still needs a deterministic secret so
 * `/api/pricing/create-snapshot` can lock quotes. Production builds must set the real env var.
 */
const DEV_PRICING_LOCK_FALLBACK =
  'local-dev-only-pricing-integrity-key-not-for-production';

function resolvePricingIntegritySecret(): string {
  const key = process.env.PRICING_INTEGRITY_SIGNING_KEY?.trim();
  if (key) return key;
  if (process.env.NODE_ENV === 'development') {
    return DEV_PRICING_LOCK_FALLBACK;
  }
  throw new Error('Missing PRICING_INTEGRITY_SIGNING_KEY');
}

/** Legacy JWT lock verification — returns null if no secret (e.g. production misconfiguration). */
export function tryPricingIntegritySecret(): string | null {
  try {
    return resolvePricingIntegritySecret();
  } catch {
    return null;
  }
}

/**
 * HMAC-SHA256(hex) of `pricing_hash` — must match `pricing_lock_token` from DB / create-snapshot.
 */
export function createPricingLockSignature(pricingHash: string): string {
  const secret = resolvePricingIntegritySecret();
  return crypto.createHmac('sha256', secret).update(pricingHash).digest('hex');
}

export function verifyPricingLock({ hash, token }: { hash: string; token: string }): boolean {
  let secret: string;
  try {
    secret = resolvePricingIntegritySecret();
  } catch {
    return false;
  }
  if (!hash?.trim() || !token?.trim()) return false;
  const expected = crypto.createHmac('sha256', secret).update(hash.trim()).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(token.trim(), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
