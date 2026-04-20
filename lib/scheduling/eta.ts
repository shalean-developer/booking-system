import { calculateDistanceKm } from '@/lib/scheduling/distance';

export type EtaResult = {
  eta_minutes: number;
  /** ISO-8601 arrival estimate (current time + travel time). */
  eta_time: string;
};

/**
 * Travel time ≈ 2 minutes per km (same heuristic as {@link estimateTravelMinutes} in distance.ts).
 */
export function estimateETA(
  cleanerLocation: { latitude: number; longitude: number },
  bookingLocation: { latitude: number; longitude: number }
): EtaResult {
  const distance = calculateDistanceKm(
    cleanerLocation.latitude,
    cleanerLocation.longitude,
    bookingLocation.latitude,
    bookingLocation.longitude
  );
  const eta_minutes = Math.max(1, Math.ceil(distance * 2));
  const eta_time = new Date(Date.now() + eta_minutes * 60_000).toISOString();
  return { eta_minutes, eta_time };
}
