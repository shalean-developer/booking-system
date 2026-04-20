/**
 * Single ops-friendly line for verifying stored `price` ↔ `total_amount` at booking insert time.
 */
export function logFinalPriceCheck(payload: {
  route: string;
  bookingId?: string;
  price_zar: number;
  total_amount_cents: number;
}): void {
  console.log('[FINAL PRICE CHECK]', {
    route: payload.route,
    booking_id: payload.bookingId ?? null,
    price_zar: payload.price_zar,
    total_amount_cents: payload.total_amount_cents,
  });
}
