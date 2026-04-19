import type { PricingEngineResult } from '@/lib/pricing-engine';
import {
  mapWizardServiceToPricingEngineService,
} from '@/lib/pricing-engine';
import {
  BASIC_EXTRAS_FULL_DAY_HOURS,
  calculateBasicV2,
  SERVICE_FEE_CENTS,
  type PricingResult,
} from '@/lib/pricing-engine-v2';
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
  /** Engine V2 snapshot — same math as checkout (`cleaningCents` includes merged cover). */
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
    /** Basic planned-hours UI: keep rows aligned with `calculateBasicV2` if engine ever diverged. */
    cleaningCentsOverride?: number;
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

  rows.push({
    id: 'v2_service',
    label: 'Service Fee',
    value: SERVICE_FEE_CENTS / 100,
  });

  return rows.filter((r) => r.value !== 0);
}

/**
 * When `formData.pricing` is still loading (`lineCalc` null) or the engine row failed to build,
 * the wizard used to show catalog “illustrative” totals that ignore `basicPlannedHours`.
 * This path keeps Step 1 aligned with **`lib/pricing-engine-v2`** (`calculateBasicV2`), not `lib/pricing.ts`.
 */
function buildBasicPlannedHoursFallback(
  data: Pick<
    BookingFormData,
    | 'service'
    | 'tipAmount'
    | 'promoCode'
    | 'pricingMode'
    | 'scheduleEquipmentPref'
    | 'basicPlannedHours'
    | 'extras'
  >,
  lineCalc: BookingPriceResult | null
): WizardDisplayPricing {
  const hasExtras = (data.extras?.length ?? 0) > 0;
  const hRaw = data.basicPlannedHours!;
  const h = hasExtras ? BASIC_EXTRAS_FULL_DAY_HOURS : hRaw;
  const v2 = calculateBasicV2(h, { hasExtras });
  const st = mapWizardServiceToPricingEngineService(data.service);
  const equipmentZar =
    data.scheduleEquipmentPref === 'bring'
      ? getEquipmentCentsForEngineService(st) / 100
      : 0;
  const equipmentCents = Math.round(Math.max(0, equipmentZar) * 100);
  const finalCents = v2.totalCents + equipmentCents;

  const dummyEngine: PricingEngineResult = {
    finalPrice: finalCents,
    costFloor: v2.cleaningCents,
    margin: 0,
    marginRate: 0,
    jobHours: h,
    hoursPerCleaner: h,
    basePriceBeforeCompanyLines: v2.cleaningCents,
    roundingAdjustmentCents: 0,
    minBookingUpliftCents: v2.isMinimumApplied ? 1 : 0,
    rawTotalBeforeMinCents: finalCents,
    marginRateBoostApplied: 0,
  };

  const dbPricingRows = buildV2LineItems(dummyEngine, {
    equipmentZar,
    pricingMode: 'basic',
    cleaningCentsOverride: v2.cleaningCents,
  });

  const baseForPromoZar = finalCents / 100;
  const discountAmount = applyPromoDiscount(baseForPromoZar, data.promoCode);
  const total =
    Math.max(0, baseForPromoZar - discountAmount) + data.tipAmount;

  return {
    tipAmount: data.tipAmount,
    discountAmount,
    subtotal: lineCalc?.subtotal ?? 0,
    total,
    serviceFee: lineCalc?.serviceFee ?? SERVICE_FEE_CENTS / 100,
    frequencyDiscount: lineCalc?.frequencyDiscount ?? 0,
    dbPricingRows,
    engineFinalCents: finalCents,
    v2Breakdown: v2,
    engineMeta: {
      estimatedHours: h,
      hoursPerCleaner: h,
      marginRateBoostApplied: 0,
      teamSize: 1,
      estimatedJobHours: h,
    },
  };
}

/**
 * Step 1 Basic: same math as `computeWizardDisplayPricing` fallback — always follows `basicPlannedHours`
 * (avoids catalog illustrative ZAR + parent memo edge cases).
 */
export function getBasicPlannedWizardPricing(
  data: Pick<
    BookingFormData,
    | 'service'
    | 'tipAmount'
    | 'promoCode'
    | 'pricingMode'
    | 'scheduleEquipmentPref'
    | 'basicPlannedHours'
    | 'extras'
  >
): WizardDisplayPricing | null {
  const hasExtras = (data.extras?.length ?? 0) > 0;
  const h = Number(data.basicPlannedHours);
  if (data.pricingMode !== 'basic' || !Number.isFinite(h) || h < 2) {
    return null;
  }
  if (!hasExtras && h > 5) return null;
  if (hasExtras && h > 8) return null;
  return buildBasicPlannedHoursFallback(data, null);
}

/**
 * Step-4 summary rows + totals for the public wizard (promo, tip). Breakdown rows = engine only.
 */
export function computeWizardDisplayPricing(input: {
  data: Pick<
    BookingFormData,
    | 'service'
    | 'tipAmount'
    | 'promoCode'
    | 'pricingMode'
    | 'scheduleEquipmentPref'
    | 'basicPlannedHours'
    | 'extras'
  >;
  lineCalc: BookingPriceResult | null;
  enginePricing: PricingEngineResult | null;
}): WizardDisplayPricing {
  const { data, lineCalc, enginePricing } = input;

  const hasExtras = (data.extras?.length ?? 0) > 0;
  const bh = data.basicPlannedHours;
  const basicPlannedReady =
    data.pricingMode === 'basic' &&
    bh != null &&
    bh >= 2 &&
    (hasExtras ? bh <= 8 : bh <= 5);

  if (basicPlannedReady && (!lineCalc || enginePricing == null)) {
    return buildBasicPlannedHoursFallback(data, lineCalc);
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
  const teamSize = Math.max(1, Math.round(calc.breakdown.numberOfCleaners ?? 1));

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

    const mode = data.pricingMode ?? 'premium';

    if (mode === 'basic' && data.basicPlannedHours != null) {
      v2Breakdown = calculateBasicV2(data.basicPlannedHours, {
        hasExtras: (data.extras?.length ?? 0) > 0,
      });
      dbPricingRows = buildV2LineItems(engineRow, {
        equipmentZar,
        pricingMode: mode,
        cleaningCentsOverride: v2Breakdown.cleaningCents,
      });
    } else {
      v2Breakdown = {
        cleaningCents: engineRow.costFloor,
        coverFeeCents: 0,
        serviceFeeCents: SERVICE_FEE_CENTS,
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
    serviceFee: calc.serviceFee,
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
