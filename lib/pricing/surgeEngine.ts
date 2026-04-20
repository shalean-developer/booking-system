/**
 * Demand / supply / time / forecast surge engine — multipliers applied to unified labour after V4 base.
 * Safe band: 0.8× … 2.0×. Does not mutate prices by itself; callers apply `multiplier` to totals.
 */

import { isWeekendSast, parseTimeToMinutes } from '@/lib/pricing/surge';

const SAST_TZ = 'Africa/Johannesburg';

const CLAMP_MIN = 0.8;
const CLAMP_MAX = 2.0;

export type SurgeEngineInput = {
  service_type: string;
  /** YYYY-MM-DD */
  date: string;
  /** HH:mm or HH:mm:ss */
  time: string;
  area?: string;
  active_bookings_count: number;
  available_cleaners_count: number;
  /** Rolling average bookings for this slot; if omitted, estimated from capacity */
  slot_average_bookings?: number | null;
  /** Cleaners required for the job (from V4 team_size) */
  required_cleaners?: number;
  /** Set when forecast layer predicts elevated demand */
  forecast_high_demand?: boolean;
  /** For same-day urgency bump */
  now?: Date;
};

export type SurgeBreakdown = {
  /** Fractional contribution to (multiplier − 1), scaled after clamp */
  demand: number;
  supply: number;
  time: number;
  forecast: number;
};

export type SurgeEngineResult = {
  multiplier: number;
  breakdown: SurgeBreakdown;
  /** active_bookings / max(available_cleaners, 1) — legacy compatibility */
  demand_ratio: number;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function ymdPartsSast(isoDate: string): { y: number; m: number; d: number } | null {
  const d = String(isoDate).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  const [yy, mm, dd] = d.split('-').map(Number);
  const utcNoon = Date.UTC(yy, mm - 1, dd, 12, 0, 0);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAST_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(new Date(utcNoon));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const y = get('year');
  const month = get('month');
  const day = get('day');
  if (!Number.isFinite(y) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return { y, m: month, d: day };
}

function isSameDayAsBookingSast(isoDate: string, now: Date): boolean {
  const bookingParts = ymdPartsSast(isoDate);
  if (!bookingParts) return false;
  const todayStr = now.toLocaleDateString('en-CA', { timeZone: SAST_TZ });
  const bookingStr = `${bookingParts.y}-${String(bookingParts.m).padStart(2, '0')}-${String(bookingParts.d).padStart(2, '0')}`;
  return bookingStr === todayStr;
}

function weekdayShortSast(ymd: string): string {
  const d = String(ymd).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
  const [yy, mm, dd] = d.split('-').map(Number);
  const utcNoon = Date.UTC(yy, mm - 1, dd, 12, 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: SAST_TZ,
    weekday: 'short',
  }).format(new Date(utcNoon));
}

function isFridayOrSaturdayMorning(ymd: string, time: string): boolean {
  const w = weekdayShortSast(ymd);
  if (w !== 'Fri' && w !== 'Sat') return false;
  const mins = parseTimeToMinutes(time);
  if (mins === null) return false;
  return mins >= 6 * 60 && mins < 12 * 60;
}

/** Last three calendar days of month (SAST calendar day from YMD string). */
function isEndOfMonthWindow(ymd: string): boolean {
  const d = String(ymd).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const [yy, mm, dd] = d.split('-').map(Number);
  const lastDay = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  return dd >= lastDay - 2;
}

function demandBoost(
  active: number,
  avg: number
): number {
  const a = Math.max(0, active);
  const denominator = Math.max(0.25, avg);
  const ratio = a / denominator;
  if (ratio > 3) return 0.3;
  if (ratio > 2) return 0.2;
  if (ratio > 1.5) return 0.1;
  if (ratio < 0.4) return -0.08;
  if (ratio < 0.65) return -0.04;
  return 0;
}

function supplyBoost(required: number, available: number): number {
  const req = Math.max(0.25, required);
  const avail = Math.max(0.25, available);
  if (avail >= req) return 0;
  const shortage = (req - avail) / req;
  return Math.min(0.5, 0.15 + shortage * 0.35);
}

function timeBoost(date: string, time: string, now?: Date): number {
  let t = 0;
  if (isWeekendSast(date)) t += 0.1;
  if (isFridayOrSaturdayMorning(date, time)) t += 0.15;
  if (isEndOfMonthWindow(date)) t += 0.1;
  if (now && isSameDayAsBookingSast(date, now)) t += 0.12;
  return Math.min(t, 0.35);
}

function forecastBoost(forecastHigh: boolean | undefined): number {
  if (!forecastHigh) return 0;
  return 0.15;
}

/**
 * Combined multiplier = clamp(1 + demand + supply + time + forecast, 0.8, 2.0).
 * Breakdown components are scaled so they sum to (multiplier − 1) after clamping.
 */
export function calculateSurgeMultiplier(input: SurgeEngineInput): SurgeEngineResult {
  const active = Math.max(0, Math.floor(Number(input.active_bookings_count) || 0));
  const availRaw = Math.floor(Number(input.available_cleaners_count) || 0);
  const avail = Math.max(0.25, availRaw);

  const impliedAvg =
    input.slot_average_bookings != null && Number.isFinite(Number(input.slot_average_bookings))
      ? Math.max(0.25, Number(input.slot_average_bookings))
      : Math.max(2, avail * 0.65);

  const d = demandBoost(active, impliedAvg);
  const req = Math.max(1, Math.floor(Number(input.required_cleaners) || 1));
  const s = supplyBoost(req, availRaw < 0.01 ? 0.25 : availRaw);

  const ti = timeBoost(input.date, input.time, input.now);
  const f = forecastBoost(input.forecast_high_demand);

  const rawDelta = d + s + ti + f;
  let mult = 1 + rawDelta;
  mult = clamp(mult, CLAMP_MIN, CLAMP_MAX);

  let breakdown: SurgeBreakdown;
  if (Math.abs(rawDelta) < 1e-9) {
    breakdown = { demand: 0, supply: 0, time: 0, forecast: 0 };
  } else {
    const targetDelta = mult - 1;
    const k = targetDelta / rawDelta;
    breakdown = {
      demand: d * k,
      supply: s * k,
      time: ti * k,
      forecast: f * k,
    };
  }

  const demand_ratio = active / Math.max(1, availRaw || 1);

  return {
    multiplier: Math.round(mult * 10000) / 10000,
    breakdown,
    demand_ratio,
  };
}

/**
 * Customer-safe copy — no numeric breakdown. Use at checkout / wizard.
 */
export function getPublicSurgePricingNote(multiplier: number): string | null {
  if (!Number.isFinite(multiplier)) return null;
  if (multiplier >= 1.003) {
    if (multiplier >= 1.35) return 'High demand — prices slightly increased.';
    return 'Busy period — prices slightly increased.';
  }
  if (multiplier <= 0.995) {
    return 'Lower demand — discounted price applied.';
  }
  return null;
}
