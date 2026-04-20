/**
 * ⚠️ LEGACY MODULE — DO NOT USE FOR STANDARD/AIRBNB PRICING.
 * Only used for upsell tier helpers (`nextTierBedroomsForUpsell`) or non-unified paths.
 *
 * Quick Clean V4 — time-based pricing: tier sets baseHours only; price = hours × rate + min + rounding.
 */

import type { QuickCleanSettings } from '@/lib/quick-clean-settings';
import { countQuickCleanBillableExtras } from '@/lib/quick-clean-extras';

export type QuickCleanTierId = 'XS' | 'S' | 'M' | 'L';

/** Tier defines baseHours + maxExtras only (no fixed ZAR base). */
export type QuickCleanTierV4 = {
  id: QuickCleanTierId;
  baseHours: number;
  maxExtras: number;
};

/** Same caps as legacy V3 (time + tier both bound extras). */
export const QUICK_CLEAN_TIERS_V4: Record<QuickCleanTierId, QuickCleanTierV4> = {
  XS: { id: 'XS', baseHours: 2, maxExtras: 8 },
  S: { id: 'S', baseHours: 3, maxExtras: 6 },
  M: { id: 'M', baseHours: 4, maxExtras: 4 },
  L: { id: 'L', baseHours: 5, maxExtras: 2 },
};

export function resolveQuickCleanTierV4(bedrooms: number): QuickCleanTierV4 {
  const b = Math.max(0, Math.floor(Number(bedrooms) || 0));
  if (b <= 1) return QUICK_CLEAN_TIERS_V4.XS;
  if (b === 2) return QUICK_CLEAN_TIERS_V4.S;
  if (b === 3) return QUICK_CLEAN_TIERS_V4.M;
  return QUICK_CLEAN_TIERS_V4.L;
}

/**
 * Next bedroom count for tier-up upsell (full V4 reprice). Null = already largest Quick Clean band → Premium.
 */
export function nextTierBedroomsForUpsell(bedrooms: number): number | null {
  const b = Math.max(0, Math.floor(Number(bedrooms) || 0));
  if (b <= 1) return 2;
  if (b === 2) return 3;
  if (b === 3) return 4;
  return null;
}

export function roundToNearest(value: number, base: number): number {
  const b = Math.max(1, base);
  return Math.round(value / b) * b;
}

export function maxAllowedExtrasForTierV4(
  tier: QuickCleanTierV4,
  settings: QuickCleanSettings
): number {
  const maxByTime = Math.floor(
    (settings.maxTotalHours - tier.baseHours) / settings.extraTimeHours
  );
  return Math.max(0, Math.min(tier.maxExtras, maxByTime));
}

export type QuickCleanV4Input = {
  bedrooms: number;
  extrasIds: string[];
  extrasQuantities?: Record<string, number> | null;
};

export type QuickCleanV4Result = {
  tier: QuickCleanTierV4;
  tierId: QuickCleanTierId;
  totalHours: number;
  extrasRequested: number;
  allowedExtras: number;
  extrasCapped: boolean;
  finalPriceZar: number;
  finalPriceCents: number;
};

export function calculateQuickCleanV4(
  input: QuickCleanV4Input,
  settings: QuickCleanSettings
): QuickCleanV4Result {
  const tier = resolveQuickCleanTierV4(input.bedrooms);
  const extrasRequested = countQuickCleanBillableExtras(
    input.extrasIds,
    input.extrasQuantities
  );
  const cap = maxAllowedExtrasForTierV4(tier, settings);
  const allowedExtras = Math.min(extrasRequested, cap);
  const extrasCapped = extrasRequested > allowedExtras;

  let totalHours =
    tier.baseHours + allowedExtras * settings.extraTimeHours;
  totalHours = Math.min(totalHours, settings.maxTotalHours);

  const rawPriceZar = totalHours * settings.hourlyRateZar;
  const protectedPrice = Math.max(rawPriceZar, settings.minCalloutPrice);
  const finalPriceZar = roundToNearest(protectedPrice, settings.priceRounding);
  const finalPriceCents = Math.round(finalPriceZar * 100);

  return {
    tier,
    tierId: tier.id,
    totalHours,
    extrasRequested,
    allowedExtras,
    extrasCapped,
    finalPriceZar,
    finalPriceCents,
  };
}

export type QuickCleanUpsellV4 =
  | {
      type: 'price_close';
      message: string;
      gapZar: number;
      nextBedrooms: number;
    }
  | {
      type: 'limit_hit';
      message: string;
      nextBedrooms: number;
    }
  | {
      type: 'premium';
      message: string;
    }
  | null;

const PRICE_CONVERGENCE_ZAR = 40;

export function buildQuickCleanUpsell(
  input: QuickCleanV4Input,
  result: QuickCleanV4Result,
  settings: QuickCleanSettings
): QuickCleanUpsellV4 {
  const nextB = nextTierBedroomsForUpsell(input.bedrooms);

  if (nextB === null) {
    if (result.extrasCapped) {
      return {
        type: 'premium',
        message:
          'You have reached the maximum add-ons for this package. Switch to Premium Clean for larger homes, more tasks, and flexible scheduling.',
      };
    }
    return null;
  }

  const nextResult = calculateQuickCleanV4(
    {
      bedrooms: nextB,
      extrasIds: input.extrasIds,
      extrasQuantities: input.extrasQuantities,
    },
    settings
  );

  const gapZar = nextResult.finalPriceZar - result.finalPriceZar;

  if (result.extrasCapped) {
    return {
      type: 'limit_hit',
      message:
        'Upgrade to the next home size band to fit more add-ons and cleaning time.',
      nextBedrooms: nextB,
    };
  }

  if (gapZar > 0 && gapZar <= PRICE_CONVERGENCE_ZAR) {
    return {
      type: 'price_close',
      message: `Upgrade for just R${Math.round(gapZar)} more`,
      gapZar,
      nextBedrooms: nextB,
    };
  }

  return null;
}
