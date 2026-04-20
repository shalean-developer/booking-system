import type { PricingEngineResult } from '@/lib/pricing-engine';
import { mapWizardServiceToPricingEngineService } from '@/lib/pricing-engine';
import type { PricingResult } from '@/lib/pricing-engine-v2';
import { calculateBookingUnified } from '@/lib/pricing/calculateBookingUnified';
import type { QuickCleanSettings } from '@/lib/quick-clean-settings';
import { getEquipmentCentsForEngineService } from '@/lib/pricing-service-config';
import { assertSinglePricingSource } from '@/lib/pricing-single-source';
import type { BookingFormData } from '@/components/booking-system-types';
import type { BookingPriceResult } from './calculate';
import { applyPromoDiscount } from './promo-codes';

/** Wizard pricing for UI — totals and `dbPricingRows` come from the engine only (no catalog line leakage). */
export type WizardDisplayPricing = {
  tipAmount: number;
  discountAmount: number;
  /** Catalog labour subtotal before fee/discount — internal / analytics only; do not render as line items. */
  subtotal: number;
  total: number;
  serviceFee: number;
  frequencyDiscount: number;
  dbPricingRows: { id: string; label: string; value: number }[];
  engineFinalCents: number | null;
  /** Engine snapshot — aligns with unified + legacy fee display */
  v2Breakdown: PricingResult | null;
  engineMeta: {
    /** Wall-clock hours (time model) — same as `estimatedJobHours`. */
    estimatedHours: number;
    hoursPerCleaner: number;
    marginRateBoostApplied: number;
    teamSize: number;
    estimatedJobHours: number;
  } | null;
};

function buildV2LineItems(
  engineRow: PricingEngineResult,
  options: {
    equipmentZar: number;
    pricingMode: 'basic' | 'premium';
    /** Override cleaning line (cents) for display alignment. */
    cleaningCentsOverride?: number;
    /** Standard/Airbnb unified tables are all-in (no separate service fee row). */
    allInPricing?: boolean;
  }
): { id: string; label: string; value: number }[] {
  const cleaningCents =
    options.cleaningCentsOverride ?? engineRow.costFloor;
  const equipmentCents = Math.round(Math.max(0, options.equipmentZar) * 100);

  const rows: { id: string; label: string; value: number }[] = [
    { id: 'v2_estimated', label: 'Estimated Price', value: cleaningCents / 100 },
  ];

  if (options.pricingMode === 'basic' && equipmentCents > 0) {
    rows.push({
      id: 'equipment',
      label: 'Equipment & supplies',
      value: equipmentCents / 100,
    });
  }

  if (options.pricingMode !== 'basic' && engineRow.minBookingUpliftCents > 0) {
    rows.push({
      id: 'minimum_booking',
      label: 'Minimum booking',
      value: engineRow.minBookingUpliftCents / 100,
    });
  }

  return rows.filter((r) => r.value !== 0);
}

function buildQuickCleanDisplayFallback(
  data: Pick<
    BookingFormData,
    | 'service'
    | 'bedrooms'
    | 'bathrooms'
    | 'extraRooms'
    | 'tipAmount'
    | 'promoCode'
    | 'pricingMode'
    | 'scheduleEquipmentPref'
    | 'extras'
    | 'extrasQuantities'
  >,
  lineCalc: BookingPriceResult | null
): WizardDisplayPricing {
  const hasExtraCleaner = (data.extras ?? []).some(
    (id) => id === 'extra_cleaner' || id.includes('extra_cleaner')
  );
  const uni = calculateBookingUnified({
    service_type: data.service === 'standard' ? 'standard' : 'airbnb',
    pricing_mode: 'quick',
    bedrooms: Math.max(1, data.bedrooms),
    bathrooms: Math.max(0, data.bathrooms ?? 0),
    extra_rooms: Math.max(0, data.extraRooms ?? 0),
    extras: data.extras ?? [],
    extrasQuantities: data.extrasQuantities,
    has_extra_cleaner: false,
  });
  const st = mapWizardServiceToPricingEngineService(data.service);
  const equipmentZar =
    data.scheduleEquipmentPref === 'bring'
      ? getEquipmentCentsForEngineService(st) / 100
      : 0;
  const equipmentCents = Math.round(Math.max(0, equipmentZar) * 100);
  const cleaningCents = Math.round(uni.final_price_zar * 100);
  const rawCombined = cleaningCents + equipmentCents;

  const v2: PricingResult = {
    cleaningCents,
    serviceFeeCents: 0,
    coverFeeCents: 0,
    totalCents: cleaningCents,
    hours: uni.hours,
    hoursPerCleaner: uni.duration,
  };

  const dummyEngine: PricingEngineResult = {
    finalPrice: rawCombined,
    costFloor: cleaningCents,
    margin: 0,
    marginRate: 0,
    jobHours: uni.hours,
    hoursPerCleaner: uni.duration,
    basePriceBeforeCompanyLines: cleaningCents,
    roundingAdjustmentCents: 0,
    minBookingUpliftCents: 0,
    rawTotalBeforeMinCents: rawCombined,
    marginRateBoostApplied: 0,
  };

  const dbPricingRows = buildV2LineItems(dummyEngine, {
    equipmentZar,
    pricingMode: 'basic',
    cleaningCentsOverride: cleaningCents,
  });

  const baseForPromoZar = rawCombined / 100;
  const discountAmount = applyPromoDiscount(baseForPromoZar, data.promoCode);
  const total =
    Math.max(0, baseForPromoZar - discountAmount) + data.tipAmount;

  return {
    tipAmount: data.tipAmount,
    discountAmount,
    subtotal: lineCalc?.subtotal ?? 0,
    total,
    serviceFee: 0,
    frequencyDiscount: lineCalc?.frequencyDiscount ?? 0,
    dbPricingRows,
    engineFinalCents: rawCombined,
    v2Breakdown: v2,
    engineMeta: {
      estimatedHours: uni.hours,
      hoursPerCleaner: uni.duration,
      marginRateBoostApplied: 0,
      teamSize: uni.team_size,
      estimatedJobHours: uni.hours,
    },
  };
}

/**
 * Step 1 Quick Clean: unified table pricing when API pricing not loaded.
 */
export function getBasicPlannedWizardPricing(
  data: Pick<
    BookingFormData,
    | 'service'
    | 'bedrooms'
    | 'bathrooms'
    | 'extraRooms'
    | 'tipAmount'
    | 'promoCode'
    | 'pricingMode'
    | 'scheduleEquipmentPref'
    | 'extras'
    | 'extrasQuantities'
  >,
  _quickCleanSettings?: QuickCleanSettings
): WizardDisplayPricing | null {
  void _quickCleanSettings;
  if (data.pricingMode !== 'basic') return null;
  if (data.service !== 'standard' && data.service !== 'airbnb') return null;
  return buildQuickCleanDisplayFallback(data, null);
}

/**
 * Step-4 summary rows + totals for the public wizard (promo, tip). Breakdown rows = engine only.
 */
export function computeWizardDisplayPricing(input: {
  data: Pick<
    BookingFormData,
    | 'service'
    | 'bedrooms'
    | 'bathrooms'
    | 'extraRooms'
    | 'tipAmount'
    | 'promoCode'
    | 'pricingMode'
    | 'scheduleEquipmentPref'
    | 'extras'
    | 'extrasQuantities'
  >;
  lineCalc: BookingPriceResult | null;
  enginePricing: PricingEngineResult | null;
  quickCleanSettings?: QuickCleanSettings;
}): WizardDisplayPricing {
  const { data, lineCalc, enginePricing, quickCleanSettings } = input;
  void quickCleanSettings;

  const isQuickCleanService =
    data.service === 'standard' || data.service === 'airbnb';
  const basicFallbackReady =
    data.pricingMode === 'basic' &&
    isQuickCleanService &&
    (!lineCalc || enginePricing == null);

  if (basicFallbackReady) {
    return buildQuickCleanDisplayFallback(data, lineCalc);
  }

  if (!lineCalc) {
    return {
      tipAmount: data.tipAmount,
      discountAmount: 0,
      subtotal: 0,
      total: 0,
      serviceFee: 0,
      frequencyDiscount: 0,
      dbPricingRows: [],
      engineFinalCents: null,
      v2Breakdown: null,
      engineMeta: null,
    };
  }

  assertSinglePricingSource({
    lineCalcPresent: true,
    enginePricing: enginePricing,
    context: 'computeWizardDisplayPricing',
  });

  const calc = lineCalc;
  const engineRow = enginePricing;
  const pricingMode = data.pricingMode ?? 'premium';

  const inferredTeamFromEngine =
    engineRow != null && engineRow.hoursPerCleaner > 0.01
      ? Math.max(
          1,
          Math.round(engineRow.jobHours / engineRow.hoursPerCleaner)
        )
      : 1;

  const teamSize =
    pricingMode === 'basic'
      ? 1
      : isQuickCleanService && engineRow != null
        ? inferredTeamFromEngine
        : Math.max(1, Math.round(calc.breakdown.numberOfCleaners ?? 1));

  const baseForPromoZar =
    engineRow != null ? engineRow.finalPrice / 100 : calc.total;
  const discountAmount = applyPromoDiscount(baseForPromoZar, data.promoCode);
  const total =
    engineRow != null
      ? Math.max(0, baseForPromoZar - discountAmount) + data.tipAmount
      : Math.max(0, calc.total - discountAmount) + data.tipAmount;

  let dbPricingRows: { id: string; label: string; value: number }[] = [];
  let v2Breakdown: PricingResult | null = null;

  if (engineRow != null) {
    const st = mapWizardServiceToPricingEngineService(data.service);
    const equipmentZar =
      data.scheduleEquipmentPref === 'bring'
        ? getEquipmentCentsForEngineService(st) / 100
        : 0;

    const mode = pricingMode;

    if (mode === 'basic' && isQuickCleanService) {
      v2Breakdown = {
        cleaningCents: engineRow.costFloor,
        serviceFeeCents: 0,
        coverFeeCents: 0,
        totalCents: engineRow.costFloor,
        hours: engineRow.jobHours,
        hoursPerCleaner: engineRow.hoursPerCleaner,
      };
      dbPricingRows = buildV2LineItems(engineRow, {
        equipmentZar,
        pricingMode: mode,
        cleaningCentsOverride: v2Breakdown.cleaningCents,
        allInPricing: true,
      });
    } else if (isQuickCleanService) {
      v2Breakdown = {
        cleaningCents: engineRow.costFloor,
        coverFeeCents: 0,
        serviceFeeCents: 0,
        totalCents: engineRow.finalPrice,
        hours: engineRow.jobHours,
        hoursPerCleaner: engineRow.hoursPerCleaner,
        isMinimumApplied: engineRow.minBookingUpliftCents > 0,
      };
      dbPricingRows = buildV2LineItems(engineRow, {
        equipmentZar,
        pricingMode: mode,
        allInPricing: true,
      });
    } else {
      v2Breakdown = {
        cleaningCents: engineRow.costFloor,
        coverFeeCents: 0,
        serviceFeeCents: 0,
        totalCents: engineRow.finalPrice,
        hours: engineRow.jobHours,
        hoursPerCleaner: engineRow.hoursPerCleaner,
        isMinimumApplied: engineRow.minBookingUpliftCents > 0,
      };
      dbPricingRows = buildV2LineItems(engineRow, {
        equipmentZar,
        pricingMode: mode,
      });
    }
  } else {
    dbPricingRows = [
      {
        id: 'estimate_total',
        label: 'Estimated service total',
        value: calc.total,
      },
    ];
  }

  const hoursPerCleaner = engineRow?.hoursPerCleaner ?? 0;
  const estimatedHours =
    engineRow != null ? engineRow.jobHours ?? hoursPerCleaner * teamSize : 0;

  return {
    tipAmount: data.tipAmount,
    discountAmount,
    subtotal: calc.subtotal,
    total,
    serviceFee: 0,
    frequencyDiscount: calc.frequencyDiscount,
    dbPricingRows,
    engineFinalCents: engineRow?.finalPrice ?? null,
    v2Breakdown,
    engineMeta: engineRow
      ? {
          estimatedHours,
          hoursPerCleaner: engineRow.hoursPerCleaner,
          marginRateBoostApplied: engineRow.marginRateBoostApplied,
          teamSize,
          estimatedJobHours: estimatedHours,
        }
      : null,
  };
}
