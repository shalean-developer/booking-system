/**
 * Predictive demand multiplier from forecast bookings vs supply (before real-time surge).
 */

import { isPeakMorningSlot, isWeekendSast } from '@/lib/pricing/surge';

export type ForecastSurgeInput = {
  /** YYYY-MM-DD */
  date: string;
  /** Reserved for future area weighting */
  area?: string;
  /** Moving-average predicted daily paid bookings; null/invalid → no forecast layer */
  forecastBookings: number | null;
  availableCleaners: number;
  /** HH:mm — optional peak-morning boost */
  time_slot?: string;
};

export type ForecastSurgeResult = {
  multiplier: number;
  demand_ratio: number;
  base_multiplier: number;
  weekend_boost: number;
  peak_morning_boost: number;
};

const MAX_MULT = 1.5;

function baseMultiplierFromDemandRatio(demandRatio: number): number {
  if (demandRatio < 0.7) return 1.0;
  if (demandRatio < 1.0) return 1.05;
  if (demandRatio < 1.3) return 1.1;
  if (demandRatio < 1.6) return 1.2;
  return 1.3;
}

/**
 * Deterministic forecast surge. If `forecastBookings` is missing or invalid, returns multiplier 1.
 */
export function getForecastSurgeMultiplier(input: ForecastSurgeInput): ForecastSurgeResult {
  const raw = input.forecastBookings;
  if (raw == null || !Number.isFinite(Number(raw)) || Number(raw) < 0) {
    return {
      multiplier: 1,
      demand_ratio: 0,
      base_multiplier: 1,
      weekend_boost: 0,
      peak_morning_boost: 0,
    };
  }

  const ac = Math.max(1, Math.floor(Number(input.availableCleaners) || 0));
  const demand_ratio = Number(raw) / ac;

  let base = baseMultiplierFromDemandRatio(demand_ratio);
  const weekend_boost = isWeekendSast(input.date) ? 0.05 : 0;
  const peak_morning_boost =
    input.time_slot && isPeakMorningSlot(input.time_slot) ? 0.05 : 0;

  let multiplier = base + weekend_boost + peak_morning_boost;
  multiplier = Math.min(MAX_MULT, multiplier);

  return {
    multiplier,
    demand_ratio,
    base_multiplier: base,
    weekend_boost,
    peak_morning_boost,
  };
}
