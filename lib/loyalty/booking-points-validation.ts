import type { ServiceType } from '@/types/booking';

type UnifiedSnap = { loyalty_points_used?: number } | null | undefined;

/** Client `use_points` must match server-clamped `loyalty_points_used` on Standard/Airbnb. */
export function validateBookingUsePointsAgainstServer(
  service: ServiceType | null | undefined,
  claimedUsePoints: number | undefined,
  unified: UnifiedSnap,
): { ok: true } | { ok: false; message: string } {
  if (!unified || (service !== 'Standard' && service !== 'Airbnb')) {
    const raw = Math.max(0, Math.floor(Number(claimedUsePoints) || 0));
    if (raw !== 0) {
      return { ok: false, message: 'Loyalty points apply to Standard and Airbnb bookings only.' };
    }
    return { ok: true };
  }
  const claimed = Math.max(0, Math.floor(Number(claimedUsePoints) || 0));
  const expected = Math.max(0, Math.floor(Number(unified.loyalty_points_used) || 0));
  if (claimed !== expected) {
    return {
      ok: false,
      message: 'Points redemption does not match server pricing. Please refresh and try again.',
    };
  }
  return { ok: true };
}
