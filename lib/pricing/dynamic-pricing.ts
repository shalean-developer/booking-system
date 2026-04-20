/**
 * V6 / V6.1 dynamic pricing — demand & supply scores + time-slot + weekend; clamp 0.8–1.5.
 * Imports only shared constants here so Client Components never pull in `dynamic-data` (server-only).
 */

import { NEUTRAL_DYNAMIC_SIGNALS } from '@/lib/pricing/dynamic-signals-constants';

function dayOfWeekLocal(dateStr: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (!m) return new Date(dateStr).getDay();
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo - 1, d).getDay();
}

function clampMultiplier(multiplier: number): number {
  if (multiplier < 0.8) return 0.8;
  if (multiplier > 1.5) return 1.5;
  return multiplier;
}

/**
 * Pure multiplier from demand/supply ratios + time band + weekend.
 * @param demandScore bookings/capacity (or similar 0–∞ ratio)
 * @param supplyScore cleaners/required (or similar 0–∞ ratio)
 */
export function computeDynamicMultiplierFromSignals(
  demandScore: number,
  supplyScore: number,
  time: string,
  date: string
): { multiplier: number; demand_score: number; supply_score: number } {
  let multiplier = 1;

  if (demandScore > 0.8) multiplier += 0.3;
  else if (demandScore < 0.4) multiplier -= 0.1;

  if (supplyScore < 0.5) multiplier += 0.25;
  else if (supplyScore > 1.2) multiplier -= 0.1;

  const hour = parseInt(time.split(':')[0], 10);
  if (Number.isFinite(hour)) {
    if (hour >= 17) multiplier += 0.15;
    if (hour <= 9) multiplier -= 0.05;
  }

  const day = dayOfWeekLocal(date);
  if (day === 0 || day === 6) multiplier += 0.1;

  return {
    multiplier: clampMultiplier(multiplier),
    demand_score: demandScore,
    supply_score: supplyScore,
  };
}

export function getDynamicPricingMultiplierSync(input: {
  date: string;
  time: string;
  area?: string;
  serviceType: string;
  dynamic_signals?: { demand_score: number; supply_score: number };
}): { multiplier: number; demand_score: number; supply_score: number } {
  void input.area;
  void input.serviceType;
  const demand_score =
    input.dynamic_signals?.demand_score ?? NEUTRAL_DYNAMIC_SIGNALS.demand_score;
  const supply_score =
    input.dynamic_signals?.supply_score ?? NEUTRAL_DYNAMIC_SIGNALS.supply_score;
  return computeDynamicMultiplierFromSignals(demand_score, supply_score, input.time, input.date);
}
