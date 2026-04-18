import type { PricingEngineResult } from '@/lib/pricing-engine';
import type { BookingFormData } from '@/components/booking-system-types';
import type { BookingPriceResult } from './calculate';
import { applyPromoDiscount } from './promo-codes';

export type WizardDisplayPricing = {
  basePrice: number;
  bedroomAdd: number;
  bathroomAdd: number;
  extraRoomAdd: number;
  extrasTotal: number;
  tipAmount: number;
  discountAmount: number;
  subtotal: number;
  total: number;
  serviceFee: number;
  frequencyDiscount: number;
  dbPricingRows: { id: string; label: string; value: number }[];
  engineFinalCents: number | null;
};

/**
 * Step-4 summary rows + totals for the public wizard (promo, tip, optional pricing-engine row).
 */
export function computeWizardDisplayPricing(input: {
  data: Pick<BookingFormData, 'service' | 'tipAmount' | 'promoCode'>;
  lineCalc: BookingPriceResult | null;
  enginePricing: PricingEngineResult | null;
}): WizardDisplayPricing {
  const { data, lineCalc, enginePricing } = input;

  if (!lineCalc) {
    return {
      basePrice: 0,
      bedroomAdd: 0,
      bathroomAdd: 0,
      extraRoomAdd: 0,
      extrasTotal: 0,
      tipAmount: data.tipAmount,
      discountAmount: 0,
      subtotal: 0,
      total: 0,
      serviceFee: 0,
      frequencyDiscount: 0,
      dbPricingRows: [],
      engineFinalCents: null,
    };
  }

  const calc = lineCalc;
  const engineRow = enginePricing;
  const baseForPromoZar = engineRow != null ? engineRow.finalPrice / 100 : calc.total;
  const discountAmount = applyPromoDiscount(baseForPromoZar, data.promoCode);
  const total =
    engineRow != null
      ? Math.max(0, baseForPromoZar - discountAmount) + data.tipAmount
      : Math.max(0, calc.total - discountAmount) + data.tipAmount;

  const dbPricingRows: { id: string; label: string; value: number }[] = [
    { id: 'base', label: 'Base rate', value: calc.breakdown.base },
  ];
  if (calc.breakdown.bedrooms > 0) {
    dbPricingRows.push({
      id: 'bed',
      label: data.service === 'carpet' ? 'Fitted carpets' : 'Rooms / bedrooms',
      value: calc.breakdown.bedrooms,
    });
  }
  if (calc.breakdown.bathrooms > 0) {
    dbPricingRows.push({
      id: 'bath',
      label: data.service === 'carpet' ? 'Loose rugs / items' : 'Bathrooms',
      value: calc.breakdown.bathrooms,
    });
  }
  if (!['carpet'].includes(data.service) && calc.breakdown.extraRooms > 0) {
    dbPricingRows.push({
      id: 'xroom',
      label: 'Extra rooms',
      value: calc.breakdown.extraRooms,
    });
  }
  if (data.service === 'carpet' && (calc.breakdown.carpetOccupiedFee ?? 0) > 0) {
    dbPricingRows.push({
      id: 'occ',
      label: 'Occupied property',
      value: calc.breakdown.carpetOccupiedFee ?? 0,
    });
  }
  if (calc.breakdown.extrasTotal > 0) {
    dbPricingRows.push({ id: 'extras', label: 'Extras', value: calc.breakdown.extrasTotal });
  }
  if (calc.breakdown.equipmentCharge > 0) {
    dbPricingRows.push({
      id: 'eq',
      label: 'Equipment & supplies',
      value: calc.breakdown.equipmentCharge,
    });
  }
  if (calc.serviceFee > 0) {
    dbPricingRows.push({ id: 'fee', label: 'Service fee', value: calc.serviceFee });
  }
  if (calc.frequencyDiscount > 0) {
    dbPricingRows.push({
      id: 'fdisc',
      label: 'Frequency discount',
      value: -calc.frequencyDiscount,
    });
  }

  return {
    basePrice: calc.breakdown.base,
    bedroomAdd: calc.breakdown.bedrooms,
    bathroomAdd: calc.breakdown.bathrooms,
    extraRoomAdd: calc.breakdown.extraRooms,
    extrasTotal: calc.breakdown.extrasTotal,
    tipAmount: data.tipAmount,
    discountAmount,
    subtotal: calc.subtotal,
    total,
    serviceFee: calc.serviceFee,
    frequencyDiscount: calc.frequencyDiscount,
    dbPricingRows,
    engineFinalCents: engineRow?.finalPrice ?? null,
  };
}
