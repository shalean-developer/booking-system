/**
 * Canonical catalog pricing — DB `pricing_config` via `@/lib/pricing`.
 * UI layers must use `calculateBooking` here — authoritative totals come from `calculateFinalBookingPrice`.
 */

import type {
  BookingPriceFrequency,
  BookingPriceResult,
  CalculateBookingPriceInput,
  PricingData,
} from '@/lib/pricing';
import { calculateFinalBookingPrice } from '@/lib/pricing/final-pricing';
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
import {
  isBasicEligible,
  type PricingMode,
} from '@/lib/pricing-mode';
import { calculateBookingV4 } from '@/lib/pricing/v4/calculateBookingV4';
import { bookingFormDataToV4Input } from '@/lib/pricing/v4/booking-form-to-v4';

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
  /** Standard / Airbnb unified pricing — defaults to premium */
  pricingMode?: PricingMode;
};

function defaultQuantities(ids: string[]): Record<string, number> {
  const q: Record<string, number> = {};
  ids.forEach((id) => {
    q[id] = (q[id] || 0) + 1;
  });
  return q;
}

/** Line total (ZAR) from configured pricing — same path as server `computeAuthoritativeBookingPricing`. */
export function calculateBooking(input: BookingCalculateInput): BookingPriceResult {
  const byId = input.extrasQuantitiesById ?? defaultQuantities(input.selectedExtraIds);
  const extrasQuantities = aggregateExtraQuantitiesByName(
    input.selectedExtraIds,
    byId,
    input.catalogAllNames
  );
  return calculateFinalBookingPrice(
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
      pricingMode: input.pricingMode ?? 'premium',
    },
    input.frequency ?? 'one-time'
  ).breakdown.cart;
}

/**
 * Team size used by the wizard and by `computeLinePricingFromWizard` (single source of truth).
 */
export function resolveWizardNumberOfCleaners(wizard: WizardBookingState): number {
  if (
    wizard.service === 'standard' ||
    wizard.service === 'airbnb' ||
    wizard.service === 'deep' ||
    wizard.service === 'move' ||
    wizard.service === 'carpet'
  ) {
    const v4 = calculateBookingV4(bookingFormDataToV4Input(wizard));
    return Math.min(MAX_TEAM_SIZE, Math.max(MIN_TEAM_SIZE, v4.team_size));
  }
  const time = buildWizardTimeInput(wizard);
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
  const serviceFee =
    wizard.service === 'standard' || wizard.service === 'airbnb'
      ? 0
      : wizard.pricingMode === 'basic'
        ? 0
        : formData.pricing.serviceFee ?? 49;
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
