/**
 * Rule schedule window (no server imports — safe for unit tests).
 */

export function isPricingRuleInScheduleWindow(
  rule: { starts_at?: string | null; ends_at?: string | null },
  now: Date
): boolean {
  if (rule.starts_at && now < new Date(rule.starts_at)) return false;
  if (rule.ends_at && now > new Date(rule.ends_at)) return false;
  return true;
}

/**
 * Hour-of-day (0–23) within optional [start, end]. When start > end, treats as overnight (e.g. 22 → 2).
 */
export function isHourInWindow(
  hour: number,
  start: number | null | undefined,
  end: number | null | undefined
): boolean {
  if (start == null && end == null) return true;

  if (start != null && end != null) {
    if (start <= end) {
      return hour >= start && hour <= end;
    }
    return hour >= start || hour <= end;
  }

  if (start != null) return hour >= start;
  if (end != null) return hour <= end;

  return true;
}
