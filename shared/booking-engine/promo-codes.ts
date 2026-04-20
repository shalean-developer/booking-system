import {
  LEGACY_PROMO_CODES,
  applyDiscount,
  legacyCodeToPromo,
} from '@/lib/pricing/discounts';

/** @deprecated Use `LEGACY_PROMO_CODES` from `@/lib/pricing/discounts` */
export const BOOKING_PROMO_CODES = LEGACY_PROMO_CODES;

/**
 * Discount ZAR for a legacy promo code against a subtotal (approximation; authoritative totals come from the server pricing engine).
 */
export function applyPromoDiscount(baseZar: number, promoCode: string | undefined | null): number {
  if (!promoCode?.trim()) return 0;
  const promo = legacyCodeToPromo(promoCode.toUpperCase().trim(), LEGACY_PROMO_CODES);
  if (!promo) return 0;
  const r = applyDiscount({
    price_zar: Math.max(0, baseZar),
    promo,
    booking: {
      date: '1970-01-01',
      time_slot: '12:00',
      service: 'Standard',
    },
  });
  return r.discount_amount_zar;
}
