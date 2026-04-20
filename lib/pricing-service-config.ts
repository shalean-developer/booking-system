/**
 * Strict service config: time bases, default team, margin, optional fixed equipment (cents).
 * Room adders (hours) — only used by `calculateJobHours`; not catalogue money.
 */

import type { PricingInput } from '@/lib/pricing-engine';

export type WizardServiceKey = 'standard' | 'airbnb' | 'carpet' | 'deep' | 'move';

/** Room duration adders (hours), not currency. */
export type RoomTimeRates = {
  bedroom: number;
  bathroom: number;
  extraRoom: number;
};

/**
 * Minimum job totals (cents) per service — **floors only** (quotes already above stay unchanged).
 *
 * Used by the premium labour engine and, after Basic V2 totals, by `applyServiceMinBookingFloorCents`.
 * **Quick Clean (Basic)** headline prices are driven mainly by `lib/pricing-engine-v2` tier rates;
 * use `BASIC_TIER_RATE_MULTIPLIER` there to lower typical large-home estimates.
 */
export const SERVICE_MIN_BOOKING_CENTS: Record<WizardServiceKey, number> = {
  standard: 25_000,
  airbnb: 28_000,
  carpet: 30_000,
  deep: 120_000,
  move: 98_000,
};

export const SERVICE_CONFIG: Record<
  WizardServiceKey,
  {
    baseTime: number;
    teamSize: number;
    margin: number;
    equipmentCents?: number;
    timeRates: RoomTimeRates;
  }
> = {
  standard: {
    baseTime: 2.5,
    teamSize: 1,
    margin: 0.3,
    timeRates: { bedroom: 0.5, bathroom: 0.75, extraRoom: 0.5 },
  },
  airbnb: {
    baseTime: 3.0,
    teamSize: 1,
    margin: 0.35,
    timeRates: { bedroom: 0.6, bathroom: 0.9, extraRoom: 0.6 },
  },
  carpet: {
    baseTime: 3.5,
    teamSize: 1,
    margin: 0.4,
    equipmentCents: 50_000,
    /** Must track bath-heavy jobs; 0.3 vs airbnb 0.9 made carpet cheaper than airbnb. */
    timeRates: { bedroom: 0.5, bathroom: 0.85, extraRoom: 0.5 },
  },
  deep: {
    /** Higher margin vs carpet so deep stays above carpet + equipment when hours are close (same time-driven model). */
    /** Slightly higher base than 4.5h so small homes (e.g. 1 bed / 1 bath) still price above carpet + equipment. */
    baseTime: 5.0,
    /** Minimum cleaners for heuristics; `getRecommendedTeamSize` can still suggest 2+ from job hours. */
    teamSize: 1,
    margin: 0.48,
    timeRates: { bedroom: 0.75, bathroom: 1.25, extraRoom: 0.75 },
  },
  move: {
    baseTime: 5.0,
    teamSize: 1,
    margin: 0.45,
    timeRates: { bedroom: 1.0, bathroom: 1.5, extraRoom: 1.0 },
  },
};

export function mapEngineServiceTypeToWizardKey(
  st: PricingInput['serviceType']
): WizardServiceKey {
  switch (st) {
    case 'Standard':
      return 'standard';
    case 'Airbnb':
      return 'airbnb';
    case 'Carpet':
      return 'carpet';
    case 'Deep':
      return 'deep';
    case 'Move':
    case 'MoveOut':
      return 'move';
    default:
      return 'standard';
  }
}

export function getMarginRateForEngineService(
  serviceType: PricingInput['serviceType']
): number {
  return SERVICE_CONFIG[mapEngineServiceTypeToWizardKey(serviceType)].margin;
}

export function getEquipmentCentsForEngineService(
  serviceType: PricingInput['serviceType']
): number {
  const k = mapEngineServiceTypeToWizardKey(serviceType);
  return SERVICE_CONFIG[k].equipmentCents ?? 0;
}

export function getMinBookingCentsForEngineService(
  serviceType: PricingInput['serviceType']
): number {
  return SERVICE_MIN_BOOKING_CENTS[mapEngineServiceTypeToWizardKey(serviceType)];
}
