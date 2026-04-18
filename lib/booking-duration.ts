/**
 * Estimated job length for dispatch (overlap checks, expected end time).
 * Formula: bedrooms×30 + bathrooms×20 + extras×15 (minutes).
 */
export function extrasUnitCount(extras: string[], extrasQuantities: Record<string, number> | undefined): number {
  let n = 0;
  for (const id of extras) {
    const q = extrasQuantities?.[id];
    n += typeof q === 'number' && q > 0 ? q : 1;
  }
  return n;
}

export function computeBookingDurationMinutes(input: {
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  extrasQuantities?: Record<string, number>;
}): number {
  const b = Math.max(0, Math.round(input.bedrooms));
  const bath = Math.max(0, Math.round(input.bathrooms));
  const ext = extrasUnitCount(input.extras, input.extrasQuantities);
  const raw = b * 30 + bath * 20 + ext * 15;
  return Math.max(60, raw);
}
