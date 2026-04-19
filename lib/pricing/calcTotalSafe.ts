import {
  calcTotalAsync,
  type BookingPriceFrequency,
  type BookingPriceResult,
} from '@/lib/pricing';
import { normalizePricingInput, type RawBookingLikePricing } from '@/lib/pricing/normalizePricingInput';

/**
 * Catalog total (ZAR) via DB pricing_config — always normalizes raw booking-like input first.
 * Use this instead of calling `calcTotalAsync` with hand-built objects.
 */
export async function calcTotalSafe(
  raw: RawBookingLikePricing,
  frequency: BookingPriceFrequency = 'one-time'
): Promise<BookingPriceResult> {
  const normalized = normalizePricingInput(raw);
  if (process.env.NODE_ENV === 'development') {
    console.log('[calcTotalSafe] normalized catalog input', normalized, { frequency });
  }
  return calcTotalAsync(normalized, frequency);
}
