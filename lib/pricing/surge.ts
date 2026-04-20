/**
 * Demand-based surge multiplier for Standard/Airbnb unified pricing.
 * Same inputs always yield the same multiplier (pure, deterministic).
 */

const SAST_TZ = 'Africa/Johannesburg';

export type SurgeDemandInput = {
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm or HH:mm:ss */
  time_slot: string;
  /** Optional label for logging / future area weighting */
  area?: string;
  available_cleaners: number;
  active_bookings: number;
  /** Optional: rolling average bookings for this DOW+hour (improves demand ratio) */
  slot_average_bookings?: number | null;
  /** Optional: cleaners required (defaults from V4 team_size in unified pricing) */
  required_cleaners?: number;
};

/** @deprecated Legacy shape — real-time surge uses `calculateSurgeMultiplier` in `surgeEngine.ts`. */
export type SurgeMultiplierResult = {
  surge_multiplier: number;
  demand_ratio: number;
  base_tier: number;
  time_adjustment: number;
  weekend_adjustment: number;
  urgency_adjustment: number;
};

export function parseTimeToMinutes(timeSlot: string): number | null {
  const s = String(timeSlot).trim();
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(s);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  return h * 60 + min;
}

/** Morning peak 07:00–09:00 (start time inclusive of 07:00, exclusive of 09:00 end minute boundary uses [07:00, 09:00)). */
export function isPeakMorningSlot(timeSlot: string): boolean {
  const mins = parseTimeToMinutes(timeSlot);
  if (mins === null) return false;
  return mins >= 7 * 60 && mins < 9 * 60;
}

export function isWeekendSast(isoDate: string): boolean {
  const d = String(isoDate).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const [yy, mm, dd] = d.split('-').map(Number);
  const utcNoon = Date.UTC(yy, mm - 1, dd, 12, 0, 0);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: SAST_TZ,
    weekday: 'short',
  }).format(new Date(utcNoon));
  return weekday === 'Sat' || weekday === 'Sun';
}

/** Real-time surge: see `lib/pricing/surgeEngine.ts` — `calculateSurgeMultiplier`. */
