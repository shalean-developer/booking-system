/**
 * Canonical catalog pricing — DB `pricing_config` via `@/lib/pricing`.
 * UI layers must not call `calculateBookingPrice` from `@/lib/pricing` directly; use `calculateBooking` here.
 */

import {
  calculateBookingPrice,
  type BookingPriceFrequency,
  type BookingPriceResult,
  type CalculateBookingPriceInput,
  type PricingData,
} from '@/lib/pricing';
import type { ServiceType } from '@/types/booking';
import { aggregateExtraQuantitiesByName } from '@/lib/booking-pricing-input';
import type { BookingFormData as ApiFormData } from '@/lib/useBookingFormData';
import type { BookingFormData as WizardBookingState } from '@/components/booking-system-types';
import {
  buildWizardTimeInput,
  calculateJobHours,
  getTeamSizeForJobHours,
  mapWizardServiceToTimeServiceType,
} from '@/lib/time-estimation';
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from '@/lib/team-optimizer';
import { isBasicEligible, isBasicPlannedPathExtrasValid } from '@/lib/pricing-mode';

export type BookingCalculateInput = {
  pricing: PricingData;
  catalogAllNames: string[];
  service: ServiceType;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  selectedExtraIds: string[];
  extrasQuantitiesById?: Record<string, number>;
  frequency?: BookingPriceFrequency;
  carpetDetails?: CalculateBookingPriceInput['carpetDetails'];
  provideEquipment?: boolean;
  equipmentChargeOverride?: number;
  numberOfCleaners?: number;
};

function defaultQuantities(ids: string[]): Record<string, number> {
  const q: Record<string, number> = {};
  ids.forEach((id) => {
    q[id] = (q[id] || 0) + 1;
  });
  return q;
}

/** Line total (ZAR) from configured pricing — same path as server `computeServerPreSurgeTotalZar`. */
export function calculateBooking(input: BookingCalculateInput): BookingPriceResult {
  const byId = input.extrasQuantitiesById ?? defaultQuantities(input.selectedExtraIds);
  const extrasQuantities = aggregateExtraQuantitiesByName(
    input.selectedExtraIds,
    byId,
    input.catalogAllNames
  );
  return calculateBookingPrice(
    input.pricing,
    {
      service: input.service,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      extraRooms: input.extraRooms,
      extras: Object.keys(extrasQuantities),
      extrasQuantities,
      carpetDetails: input.carpetDetails ?? null,
      provideEquipment: input.provideEquipment,
      equipmentChargeOverride: input.equipmentChargeOverride,
      numberOfCleaners: input.numberOfCleaners ?? 1,
    },
    input.frequency ?? 'one-time'
  );
}

/**
 * Team size used by the wizard and by `computeLinePricingFromWizard` (single source of truth).
 */
export function resolveWizardNumberOfCleaners(wizard: WizardBookingState): number {
  const time = buildWizardTimeInput(wizard);
  if (
    wizard.pricingMode === 'basic' &&
    wizard.basicPlannedHours != null &&
    isBasicPlannedPathExtrasValid(time, wizard.extras)
  ) {
    return 1;
  }
  if (wizard.pricingMode === 'basic' && isBasicEligible(time, wizard.extras)) {
    return 1;
  }
  const hours = calculateJobHours(time);
  const team = getTeamSizeForJobHours(
    hours,
    wizard.numberOfCleaners,
    mapWizardServiceToTimeServiceType(wizard.service)
  );
  return Math.min(MAX_TEAM_SIZE, Math.max(MIN_TEAM_SIZE, team));
}

/**
 * Wizard fee shell only — **no catalogue labour**. Totals come from `computeWizardEnginePricingRow`.
 */
export function computeLinePricingFromWizard(
  wizard: WizardBookingState,
  formData: ApiFormData | null
): BookingPriceResult | null {
  if (!formData?.pricing) return null;
  const numberOfCleaners = resolveWizardNumberOfCleaners(wizard);
  const serviceFee = formData.pricing.serviceFee ?? 49;
  return {
    subtotal: 0,
    serviceFee,
    frequencyDiscount: 0,
    frequencyDiscountPercent: 0,
    total: serviceFee,
    minimumApplied: 0,
    breakdown: {
      base: 0,
      bedrooms: 0,
      bathrooms: 0,
      extraRooms: 0,
      carpetFitted: 0,
      carpetLoose: 0,
      carpetOccupiedFee: 0,
      extrasTotal: 0,
      equipmentCharge: 0,
      laborSubtotalOneCleaner: 0,
      numberOfCleaners,
    },
  };
}

export type { BookingPriceResult };
