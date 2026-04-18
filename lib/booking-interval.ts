/** Parse "H:MM" / "HH:MM:SS" to minutes from midnight (same calendar day). */
export function timeHmToMinutes(value: string | null | undefined): number {
  if (value == null || value === '') return 0;
  const m = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 0;
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return h * 60 + min;
}

export function minutesToTimeHm(totalMinutes: number): string {
  const m = Math.floor(((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function addMinutesToTimeHm(startHm: string, addMinutes: number): string {
  return minutesToTimeHm(timeHmToMinutes(startHm) + addMinutes);
}

/** Half-open [start, end) overlap in minutes. */
export function intervalsOverlapMinutes(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/** Travel / prep buffer applied when checking a *new* booking window against existing jobs (minutes). */
export const DISPATCH_TRAVEL_BUFFER_MINUTES = 30;
/** @alias DISPATCH_TRAVEL_BUFFER_MINUTES */
export const BUFFER_MINUTES = DISPATCH_TRAVEL_BUFFER_MINUTES;

/**
 * Whether a new booking [newStart, newEnd) conflicts with [existingStart, existingEnd)
 * when the new interval is expanded by `bufferMinutes` before and after (clamped to the day).
 */
export function intervalsOverlapWithTravelBuffer(
  newStartMin: number,
  newEndMin: number,
  existingStartMin: number,
  existingEndMin: number,
  bufferMinutes: number = DISPATCH_TRAVEL_BUFFER_MINUTES
): boolean {
  const dayCap = 24 * 60;
  const bs = Math.max(0, newStartMin - bufferMinutes);
  const be = Math.min(dayCap, newEndMin + bufferMinutes);
  return intervalsOverlapMinutes(bs, be, existingStartMin, existingEndMin);
}
