/**
 * Admin financial KPIs: calendar ranges in Africa/Johannesburg (business TZ).
 * Server runs in UTC on Vercel — do not use Date#getDate() in server local time.
 */

export const BUSINESS_TIMEZONE = 'Africa/Johannesburg';

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** en-CA yields YYYY-MM-DD */
export function ymdTodayInBusinessTz(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** ISO timestamp → YYYY-MM-DD in business TZ */
export function ymdFromInstantInBusinessTz(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function parseYmdToSastNoon(ymd: string): Date {
  const m = YMD_RE.exec(ymd.trim());
  if (!m) throw new Error(`Invalid YMD: ${ymd}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(
    `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}T12:00:00+02:00`
  );
}

/** Inclusive calendar-day count between two YMDs in business TZ (uses SAST noon anchors). */
export function inclusiveDayCount(startYmd: string, endYmd: string): number {
  const s = parseYmdToSastNoon(startYmd);
  const e = parseYmdToSastNoon(endYmd);
  return Math.floor((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

export function addCalendarDaysYmd(ymd: string, deltaDays: number): string {
  const dt = parseYmdToSastNoon(ymd);
  dt.setDate(dt.getDate() + deltaDays);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dt);
}

/**
 * Half-open UTC range for `created_at`: >= gte AND < lt.
 * Inclusive on calendar days [startYmd, endYmd] in Africa/Johannesburg.
 */
export function halfOpenCreatedAtRangeFromInclusiveYmd(
  startYmd: string,
  endYmd: string
): { gte: string; lt: string } {
  const gteLocal = `${startYmd.trim()}T00:00:00+02:00`;
  const ltYmd = addCalendarDaysYmd(endYmd, 1);
  const ltLocal = `${ltYmd}T00:00:00+02:00`;
  return {
    gte: new Date(gteLocal).toISOString(),
    lt: new Date(ltLocal).toISOString(),
  };
}

/**
 * Normalize query param: plain YYYY-MM-DD or any ISO string → YMD in business TZ.
 */
export function queryParamToYmd(s: string): string {
  const t = s.trim();
  if (YMD_RE.test(t)) return t;
  return ymdFromInstantInBusinessTz(t);
}

export type BusinessRangeDefaults = {
  currentStartYmd: string;
  currentEndYmd: string;
  previousStartYmd: string;
  previousEndYmd: string;
};

/** Last N inclusive calendar days in business TZ, and the prior block of N days (for growth). */
export function defaultRollingBusinessRanges(inclusiveDays: number): BusinessRangeDefaults {
  const endYmd = ymdTodayInBusinessTz();
  const startYmd = addCalendarDaysYmd(endYmd, -(inclusiveDays - 1));
  const previousEndYmd = addCalendarDaysYmd(startYmd, -1);
  const previousStartYmd = addCalendarDaysYmd(previousEndYmd, -(inclusiveDays - 1));
  return {
    currentStartYmd: startYmd,
    currentEndYmd: endYmd,
    previousStartYmd,
    previousEndYmd,
  };
}

/** Previous period of the same inclusive length, ending the day before currentStartYmd. */
export function previousBusinessRangeFromCurrent(
  currentStartYmd: string,
  currentEndYmd: string
): { previousStartYmd: string; previousEndYmd: string } {
  const n = inclusiveDayCount(currentStartYmd, currentEndYmd);
  const previousEndYmd = addCalendarDaysYmd(currentStartYmd, -1);
  const previousStartYmd = addCalendarDaysYmd(previousEndYmd, -(n - 1));
  return { previousStartYmd, previousEndYmd };
}
