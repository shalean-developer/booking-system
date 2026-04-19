/**
 * Dual pricing: BASIC (volume / competitive) vs PREMIUM (time-based engine).
 * Eligibility + basic math live here — `lib/pricing-engine` composes with the premium pipeline.
 */

import {
  calculateJobHours,
  parseAddOnsFromWizardExtras,
  type TimeInput,
} from '@/lib/time-estimation';
import type { WizardServiceKey } from '@/lib/pricing-service-config';

export type PricingMode = 'basic' | 'premium';

/** Quick Clean: estimated job hours cap (time model). */
export const BASIC_MAX_JOB_HOURS = 5;

/** Extras / add-ons allowed on Basic (planned-hours) path. */
export function isBasicPlannedPathExtrasValid(
  time: TimeInput,
  extrasIds: string[]
): boolean {
  if (time.serviceType !== 'standard' && time.serviceType !== 'airbnb') {
    return false;
  }
  if (wizardHasExtraCleaner(extrasIds)) return false;
  if (hasHeavyTimeAddOns(time)) return false;
  return true;
}

export function hasHeavyTimeAddOns(time: TimeInput): boolean {
  const a = time.addOns;
  return !!(
    a.garageCleaning ||
    a.outsideWindows ||
    a.laundry ||
    (a.mattressCount ?? 0) > 0 ||
    (a.ironingItems ?? 0) > 0
  );
}

export function wizardHasExtraCleaner(extrasIds: string[]): boolean {
  return extrasIds.some(
    (id) => id === 'extra_cleaner' || id.includes('extra_cleaner')
  );
}

/**
 * Quick Clean: Standard/Airbnb only, ≤5h, single cleaner, no heavy add-ons / extra cleaner.
 */
export function isBasicEligible(
  time: TimeInput,
  extrasIds: string[] = []
): boolean {
  if (!isBasicPlannedPathExtrasValid(time, extrasIds)) return false;
  const hours = calculateJobHours(time);
  if (hours > BASIC_MAX_JOB_HOURS) return false;
  return true;
}

/** Rebuild `TimeInput` from API/booking payload (server validation). */
export function timeInputFromBookingSnapshot(body: {
  service?: string | null;
  bedrooms?: number;
  bathrooms?: number;
  extraRooms?: number;
  extras?: string[];
  extrasQuantities?: Record<string, number>;
}): TimeInput {
  return {
    serviceType: mapApiServiceToWizardServiceKey(body.service),
    bedrooms: Math.max(0, Number(body.bedrooms) || 0),
    bathrooms: Math.max(0, Number(body.bathrooms) || 0),
    extraRooms: Math.max(0, Number(body.extraRooms) || 0),
    addOns: parseAddOnsFromWizardExtras(
      body.extras ?? [],
      body.extrasQuantities,
      undefined
    ),
  };
}

function mapApiServiceToWizardServiceKey(
  s: string | null | undefined
): WizardServiceKey {
  const v = (s || '').trim();
  if (v === 'Airbnb') return 'airbnb';
  if (v === 'Deep') return 'deep';
  if (v === 'Move In/Out') return 'move';
  if (v === 'Carpet') return 'carpet';
  return 'standard';
}
