/**
 * Client-only trace for checkout → confirmation.
 * Set `NEXT_PUBLIC_DEBUG_BOOKING_FLOW=true` in `.env.local` and watch the browser console.
 */
export function logBookingFlowClient(stage: string, detail?: Record<string, unknown>): void {
  if (process.env.NEXT_PUBLIC_DEBUG_BOOKING_FLOW !== 'true') return;
  if (detail && Object.keys(detail).length > 0) {
    console.log(`[booking-flow] ${stage}`, detail);
  } else {
    console.log(`[booking-flow] ${stage}`);
  }
}
