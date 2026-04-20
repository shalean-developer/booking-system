/**
 * Customer-facing ZAR amounts — nearest R10 (aligned with unified table pricing UX).
 * Do not use `Math.round(zar)` for final totals; use `roundPrice`.
 */
export function roundPrice(zar: number): number {
  if (!Number.isFinite(zar)) return 0;
  return Math.round(zar / 10) * 10;
}
