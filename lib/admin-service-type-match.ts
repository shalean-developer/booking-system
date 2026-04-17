/**
 * Map raw `bookings.service_type` values onto active catalog keys from `services.service_type`.
 */

export interface ServiceCatalogRow {
  service_type: string;
  display_name: string;
  display_order: number;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Returns the catalog `service_type` key for a booking row, or null if it should be counted as "Other".
 */
export function matchBookingServiceToCatalog(
  raw: string | null | undefined,
  catalogTypes: string[]
): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  const lower = t.toLowerCase();
  const normalizedInput = norm(t);

  if (catalogTypes.length === 0) return t;

  for (const key of catalogTypes) {
    if (norm(key) === normalizedInput) return key;
  }

  if (lower.includes('standard') && lower.includes('home')) {
    const st = catalogTypes.find((k) => norm(k) === 'standard');
    if (st) return st;
  }
  if (normalizedInput === 'standard home cleaning') {
    const st = catalogTypes.find((k) => norm(k) === 'standard');
    if (st) return st;
  }

  const has = (sub: string) => lower.includes(sub);
  if (has('carpet')) {
    const k = catalogTypes.find((c) => c.toLowerCase().includes('carpet'));
    if (k) return k;
  }
  if (has('airbnb')) {
    const k = catalogTypes.find((c) => c.toLowerCase().includes('airbnb'));
    if (k) return k;
  }
  if (has('move') && (has('in') || has('out') || has('/'))) {
    const k = catalogTypes.find((c) => c.toLowerCase().includes('move'));
    if (k) return k;
  }
  if (has('deep')) {
    const k = catalogTypes.find((c) => c.toLowerCase().includes('deep'));
    if (k) return k;
  }
  if (has('standard') || normalizedInput === 'standard') {
    const k = catalogTypes.find((c) => norm(c) === 'standard');
    if (k) return k;
  }

  return null;
}
