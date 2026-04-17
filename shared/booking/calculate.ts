/**
 * Single pricing entry for all booking UIs — uses DB `pricing_config` via `@/lib/pricing`.
 * Do not add hardcoded per-room rates here.
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
  formServiceToApi,
  getEffectiveRoomCounts,
} from '@/lib/booking-pricing-input';

export type BookingCalculateInput = {
  pricing: PricingData;
  /** Full extras catalog from `/api/booking/form-data` */
  catalogAllNames: string[];
  service: ServiceType;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  selectedExtraIds: string[];
  /** Optional counts per extra id (defaults to 1 per occurrence in `selectedExtraIds`) */
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

/**
 * Line total (ZAR) from configured pricing — same path as server `computeServerPreSurgeTotalZar`.
 */
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
 * Public multi-step wizard — maps room rules + extras into the same engine as dashboard.
 */
export function computeLinePricingFromWizard(
  wizard: WizardBookingState,
  formData: ApiFormData | null
): BookingPriceResult | null {
  if (!formData?.pricing) return null;
  const eff = getEffectiveRoomCounts(wizard);
  const extrasQuantitiesById: Record<string, number> = {};
  wizard.extras.forEach((id) => {
    extrasQuantitiesById[id] = (extrasQuantitiesById[id] || 0) + 1;
  });
  const extrasQuantities = aggregateExtraQuantitiesByName(
    wizard.extras,
    extrasQuantitiesById,
    formData.extras.all
  );
  return calculateBookingPrice(
    formData.pricing,
    {
      service: formServiceToApi(wizard.service),
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
      numberOfCleaners: 1,
    },
    'one-time'
  );
}

export type { BookingPriceResult };
