/**
 * Billable extras for Quick Clean (equipment / extra cleaner excluded).
 */

const INTERNAL_EXTRA_IDS = new Set(['equipment', 'extra_cleaner']);

/**
 * Each catalog extra line counts toward time (and V4 uses count for caps).
 * Sums quantities (e.g. per-item add-ons).
 */
export function countQuickCleanBillableExtras(
  extrasIds: string[],
  extrasQuantities?: Record<string, number> | null
): number {
  if (!Array.isArray(extrasIds) || extrasIds.length === 0) return 0;
  let n = 0;
  const seen = new Set<string>();
  for (const id of extrasIds) {
    if (!id || INTERNAL_EXTRA_IDS.has(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    const q = Math.max(1, Math.round(extrasQuantities?.[id] ?? 1));
    n += q;
  }
  return n;
}
