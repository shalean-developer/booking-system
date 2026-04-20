/**
 * Haversine distance (km) between two WGS84 points.
 * Used when PostGIS geography isn't available on the client bundle.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Normalize suburb/area labels for comparison (case + trim). */
export function normalizeAreaLabel(s: string | null | undefined): string {
  return (s || '').trim().toLowerCase();
}

/** True if any array entry matches the booking area (case-insensitive). */
export function listIncludesArea(list: string[] | null | undefined, area: string): boolean {
  const want = normalizeAreaLabel(area);
  if (!want) return false;
  const arr = list ?? [];
  return arr.some((x) => normalizeAreaLabel(x) === want);
}
