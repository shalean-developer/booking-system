import { createHmac, timingSafeEqual } from 'crypto';

function getSecret(): string | null {
  const s = process.env.BOOKING_CONFIRMATION_SECRET?.trim();
  return s || null;
}

/**
 * HMAC token so confirmation/receipt URLs are not guessable from id alone.
 * When `BOOKING_CONFIRMATION_SECRET` is unset, returns null (legacy URLs without token still work on the server).
 */
export function createBookingLookupToken(bookingLookupId: string): string | null {
  const secret = getSecret();
  if (!secret || !bookingLookupId) return null;
  return createHmac('sha256', secret).update(bookingLookupId).digest('base64url');
}

export function isBookingLookupTokenConfigured(): boolean {
  return Boolean(getSecret());
}

export function verifyBookingLookupToken(bookingLookupId: string, token: string | null | undefined): boolean {
  const secret = getSecret();
  if (!secret) return true;
  if (!token || !bookingLookupId) return false;
  const expected = createHmac('sha256', secret).update(bookingLookupId).digest('base64url');
  if (expected.length !== token.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}
