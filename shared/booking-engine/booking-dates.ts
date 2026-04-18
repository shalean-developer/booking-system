/**
 * Booking calendar rules — aligned with `components/booking-step2-schedule.tsx`
 * (single source for dashboard + public wizard).
 */

export const MAX_BOOKING_DAYS_FROM_TODAY = 365;

export const DAYS_OF_WEEK = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

function getTodayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateStr(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [y, mo, d] = dateStr.split('-').map(Number);
  if (!y || !mo || !d) return null;
  return new Date(y, mo - 1, d);
}

export function daysFromTodayStart(d: Date): number {
  const today = getTodayStart();
  const b = new Date(d);
  b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

export function isAllowedBookingDate(parsed: Date): boolean {
  const n = daysFromTodayStart(parsed);
  return n >= 0 && n <= MAX_BOOKING_DAYS_FROM_TODAY;
}

/** First day index (0 = today) of a 7-day row that contains `parsed`. */
export function offsetForDateToBeVisible(parsed: Date): number {
  const n = daysFromTodayStart(parsed);
  if (n < 0) return 0;
  return Math.floor(n / 7) * 7;
}

/** Seven consecutive days starting `offset` days after today (offset is multiple of 7). */
export function getSevenDaysStartingOffset(offsetFromToday: number): Date[] {
  const today = getTodayStart();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetFromToday + i);
    return d;
  });
}

export function formatWeekRangeLabel(dates: Date[]): string {
  if (dates.length === 0) return '';
  const a = dates[0];
  const b = dates[dates.length - 1];
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    return `${a.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return `${a.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

export function formatSelectedDateLong(date: Date): string {
  return date.toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
