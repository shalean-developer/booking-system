/**
 * Display / estimate cleaner labour earnings (ZAR per hour) by service type.
 * Used on job cards; actual payouts follow booking wallet + team split rules.
 */

export const CLEANER_HOURLY_RATE_ZAR: Record<string, number> = {
  Standard: 55,
  Deep: 65,
  'Move In/Out': 75,
  Carpet: 60,
  Airbnb: 55,
};

export function hourlyRateZarForService(serviceType: string | null | undefined): number {
  if (!serviceType) return CLEANER_HOURLY_RATE_ZAR.Standard;
  return CLEANER_HOURLY_RATE_ZAR[serviceType] ?? CLEANER_HOURLY_RATE_ZAR.Standard;
}

/**
 * Rough estimated gross labour for one cleaner (before company commission / tips).
 * teamSize splits wall-clock hours across cleaners.
 */
export function estimateCleanerEarningsZar(input: {
  serviceType: string | null | undefined;
  hours: number;
  teamSize: number;
}): number {
  const ts = Math.max(1, Math.floor(Number(input.teamSize) || 1));
  const h = Math.max(0, Number(input.hours) || 0);
  const perCleanerHours = h / ts;
  const rate = hourlyRateZarForService(input.serviceType);
  return Math.round(rate * perCleanerHours * 100) / 100;
}

export function hoursFromBookingSnapshot(row: {
  price_snapshot?: unknown;
  total_hours?: number | null;
  duration_minutes?: number | null;
}): number {
  const snap =
    row.price_snapshot && typeof row.price_snapshot === 'object'
      ? (row.price_snapshot as Record<string, unknown>)
      : {};
  const h = Number(snap.unified_hours ?? snap.hours ?? row.total_hours);
  if (Number.isFinite(h) && h > 0) return h;
  const dm = row.duration_minutes;
  if (typeof dm === 'number' && dm > 0) return dm / 60;
  return 3;
}

export function teamSizeFromBooking(row: {
  team_size?: number | null;
  price_snapshot?: unknown;
}): number {
  if (row.team_size != null && row.team_size > 0) {
    return Math.max(1, Math.floor(row.team_size));
  }
  const snap =
    row.price_snapshot && typeof row.price_snapshot === 'object'
      ? (row.price_snapshot as Record<string, unknown>)
      : {};
  const ts = Number(snap.team_size ?? snap.pricing_team_size);
  if (Number.isFinite(ts) && ts > 0) return Math.max(1, Math.floor(ts));
  return 1;
}
