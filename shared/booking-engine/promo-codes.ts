/** Promo codes — percentages (≤1) or fixed ZAR; validated server-side in `validateBookingDiscountAmount`. */
export const BOOKING_PROMO_CODES: Record<string, number> = {
  SHALEAN10: 0.1,
  SAVE20: 0.2,
  SAVE50: 50,
  NEWCLIENT: 100,
  FIRSTCLEAN: 100,
};

export function applyPromoDiscount(baseZar: number, promoCode: string | undefined | null): number {
  if (!promoCode) return 0;
  const discount = BOOKING_PROMO_CODES[promoCode.toUpperCase()];
  if (!discount) return 0;
  return discount <= 1 ? Math.round(baseZar * discount) : Math.min(baseZar, discount);
}
