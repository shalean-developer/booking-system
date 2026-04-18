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
  buildCarpetDetailsForPricing,
  buildExtrasQuantitiesByIdFromWizard,
  formServiceToApi,
  getEffectiveRoomCounts,
} from '@/lib/booking-pricing-input';
import { estimateMaxWorkHoursFromWizard } from '@/lib/booking-work-hours';
import { calculateOptimalTeam, MAX_TEAM_SIZE, MIN_TEAM_SIZE } from '@/lib/team-optimizer';

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
  const totalWorkHours = estimateMaxWorkHoursFromWizard(wizard);
  const optimal = calculateOptimalTeam({
    totalWorkHours,
    serviceType: formServiceToApi(wizard.service),
  });
  const raw =
    typeof wizard.numberOfCleaners === 'number' && wizard.numberOfCleaners >= 1
      ? Math.round(wizard.numberOfCleaners)
      : optimal.teamSize;
  return Math.min(MAX_TEAM_SIZE, Math.max(MIN_TEAM_SIZE, raw));
}

/**
 * Public multi-step wizard — maps room rules + extras into the same engine as dashboard.
 */
export function computeLinePricingFromWizard(
  wizard: WizardBookingState,
  formData: ApiFormData | null
): BookingPriceResult | null {
  if (!formData?.pricing) return null;
  const eff = getEffectiveRoomCounts(wizard);
  const extrasQuantitiesById = buildExtrasQuantitiesByIdFromWizard(
    wizard.extras,
    wizard.extrasQuantities
  );
  const extrasQuantities = aggregateExtraQuantitiesByName(
    wizard.extras,
    extrasQuantitiesById,
    formData.extras.all
  );
  const apiService = formServiceToApi(wizard.service);
  const numberOfCleaners = resolveWizardNumberOfCleaners(wizard);
  return calculateBookingPrice(
    formData.pricing,
    {
      service: apiService,
      bedrooms: eff.bedrooms,
      bathrooms: eff.bathrooms,
      extraRooms: eff.extraRooms,
      extras: Object.keys(extrasQuantities),
      extrasQuantities,
      carpetDetails: buildCarpetDetailsForPricing(wizard),
      provideEquipment:
        (wizard.service === 'standard' || wizard.service === 'airbnb') &&
        wizard.scheduleEquipmentPref === 'bring',
      equipmentChargeOverride: formData.equipment?.charge,
      numberOfCleaners,
    },
    'one-time'
  );
}

export type { BookingPriceResult };
