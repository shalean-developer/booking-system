/**
 * V5.2 — **non-monetary** job metadata only. All ZAR lives in `calculateFinalBookingPrice`.
 */

import type { PricingData } from '@/lib/pricing-db';
import type {
  BookingPriceFrequency,
  CalculateBookingPriceInput,
} from '@/lib/pricing/booking-price-types';
import { estimateUnifiedJobShape } from '@/lib/pricing/unified-job-shape';

export type BookingCartMeta = {
  serviceType: string | null;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  extras: string[];
  extrasQuantities?: Record<string, number> | null;
  estimated_hours: number;
  team_size: number;
  base_hours: number;
};

const EMPTY_META: BookingCartMeta = {
  serviceType: null,
  bedrooms: 0,
  bathrooms: 0,
  extraRooms: 0,
  extras: [],
  estimated_hours: 0,
  team_size: 1,
  base_hours: 0,
};

/**
 * Structural fields for audits / UI — **no prices, totals, or cents.**
 */
export function buildBookingCart(
  _pricing: PricingData,
  input: CalculateBookingPriceInput,
  _frequency: BookingPriceFrequency
): BookingCartMeta {
  if (!input.service) return { ...EMPTY_META };

  if (input.service === 'Standard' || input.service === 'Airbnb') {
    const hasExtraCleaner = (input.extras ?? []).some(
      (id) => id === 'extra_cleaner' || id.includes('extra_cleaner')
    );
    const shape = estimateUnifiedJobShape({
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      extraRooms: input.extraRooms ?? 0,
      extras: input.extras ?? [],
      extrasQuantities: input.extrasQuantities,
      pricingMode: input.pricingMode,
      hasExtraCleaner: input.pricingMode === 'premium' && hasExtraCleaner,
    });
    return {
      serviceType: input.service,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      extraRooms: input.extraRooms ?? 0,
      extras: input.extras ?? [],
      extrasQuantities: input.extrasQuantities,
      estimated_hours: shape.estimated_hours,
      team_size: shape.team_size,
      base_hours: shape.base_hours,
    };
  }

  return {
    serviceType: input.service,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    extraRooms: input.extraRooms ?? 0,
    extras: input.extras ?? [],
    extrasQuantities: input.extrasQuantities,
    estimated_hours: 0,
    team_size: Math.max(1, Math.round(input.numberOfCleaners ?? 1)),
    base_hours: 0,
  };
}
