import type { SupabaseClient } from '@supabase/supabase-js';
import { getBookingFormData } from '@/lib/booking-form-data-server';
import {
  calculateBookingPrice,
  type BookingPriceResult,
  type CalculateBookingPriceInput,
} from '@/lib/pricing';
import type { BookingState } from '@/types/booking';
import { aggregateExtraQuantitiesByName } from '@/lib/booking-pricing-input';

export type BookingBodyForPricing = Pick<
  BookingState,
  | 'service'
  | 'bedrooms'
  | 'bathrooms'
  | 'extraRooms'
  | 'extras'
  | 'extrasQuantities'
  | 'frequency'
  | 'tipAmount'
  | 'discountAmount'
  | 'numberOfCleaners'
> & {
  provideEquipment?: boolean;
  carpetDetails?: CalculateBookingPriceInput['carpetDetails'];
};

/**
 * Recomputes pre-surge cart total (ZAR) from DB pricing — does not trust client-supplied totals.
 * Includes tip in pre-surge (matches checkout + surge pipeline).
 */
export async function computeServerPreSurgeTotalZar(
  _supabase: SupabaseClient,
  body: BookingBodyForPricing
): Promise<{
  preSurgeTotalZar: number;
  coreTotalZar: number;
  serviceFeeZar: number;
  frequencyDiscountZar: number;
  basePriceZar: number;
  extrasTotalZar: number;
  calc: BookingPriceResult;
}> {
  const form = await getBookingFormData();
  const pricing = form.pricing;
  if (!pricing) {
    throw new Error('Pricing configuration unavailable');
  }

  const catalog = form.extras.all;
  const extrasQuantities = aggregateExtraQuantitiesByName(
    body.extras || [],
    body.extrasQuantities,
    catalog
  );
  const extrasNames = Object.keys(extrasQuantities);

  const input: CalculateBookingPriceInput = {
    service: body.service,
    bedrooms: body.bedrooms ?? 0,
    bathrooms: body.bathrooms ?? 0,
    extraRooms: body.extraRooms ?? 0,
    extras: extrasNames,
    extrasQuantities,
    carpetDetails: body.carpetDetails ?? null,
    provideEquipment: body.provideEquipment ?? false,
    equipmentChargeOverride: form.equipment?.charge,
    numberOfCleaners: body.numberOfCleaners,
  };

  const freq = body.frequency || 'one-time';
  const calc = calculateBookingPrice(pricing, input, freq);
  const tip = body.tipAmount || 0;
  const discount = body.discountAmount || 0;
  const preSurge = Math.max(0, calc.total - discount) + tip;

  return {
    preSurgeTotalZar: Math.round(preSurge * 100) / 100,
    coreTotalZar: calc.total,
    serviceFeeZar: calc.serviceFee,
    frequencyDiscountZar: calc.frequencyDiscount,
    basePriceZar: calc.breakdown.base,
    extrasTotalZar: calc.breakdown.extrasTotal,
    calc,
  };
}
