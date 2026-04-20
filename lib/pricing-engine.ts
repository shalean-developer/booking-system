/**
 * Single pipeline: time → labour (HOURLY_RATE_CENTS × hours × team) → margin on labour → fees → R50 round → min floor.
 * No catalogue room money. No earnings-based margin boost (payout checks live in `earnings-v2` separately if needed).
 */

import {
  calculateJobHours,
  getRecommendedTeamSize,
  validateTimeDrivenHours,
  type TimeInput,
} from '@/lib/time-estimation';
import {
  SERVICE_CONFIG,
  SERVICE_MIN_BOOKING_CENTS,
  getMarginRateForEngineService,
  getEquipmentCentsForEngineService,
  getMinBookingCentsForEngineService,
  type WizardServiceKey,
} from '@/lib/pricing-service-config';
import {
  timeInputFromBookingSnapshot,
  type PricingMode,
} from '@/lib/pricing-mode';
import {
  applyV2FeesToPremiumEngineBase,
  type PricingResult as PricingEngineV2Result,
} from '@/lib/pricing-engine-v2';
import { calculateBookingUnified } from '@/lib/pricing/calculateBookingUnified';
import { calculateBookingV4 } from '@/lib/pricing/v4/calculateBookingV4';
import type { QuickCleanSettings } from '@/lib/quick-clean-settings';

export type { PricingMode } from '@/lib/pricing-mode';

export { TARGET_HOURLY_RATE } from '@/lib/earnings-config';

/** Customer billing (cents/h per cleaner). Configurable baseline — not `TARGET_HOURLY_RATE` (payout pool). */
export const HOURLY_RATE_CENTS = 8000;

export const PRICING_LABOUR_RATE_CENTS = HOURLY_RATE_CENTS;

export { getRecommendedTeamSize } from '@/lib/time-estimation';
export type { TimeInput } from '@/lib/time-estimation';

/** Legacy alias: lowest tier minimum (standard). Prefer `getMinBookingCentsForEngineService`. */
export const MIN_BOOKING_PRICE_CENTS = SERVICE_MIN_BOOKING_CENTS.standard;

const ROUND_STEP_CENTS = 5_000;

export type PricingInput = {
  serviceType: 'Standard' | 'Airbnb' | 'Deep' | 'Move' | 'MoveOut' | 'Carpet';
  totalHours: number;
  teamSize: number;
  /** Company-only lines (cents). Engine does not model extra-cleaner commission splits. */
  equipmentCost?: number;
  serviceFee?: number;
};

/**
 * R50-aligning floor used by premium labour totals and Basic V2 totals + equipment.
 */
export function applyServiceMinBookingFloorCents(
  rawTotalCents: number,
  serviceType: PricingInput['serviceType']
): { finalCents: number; minUpliftCents: number } {
  const minBookingCents = getMinBookingCentsForEngineService(serviceType);
  if (rawTotalCents >= minBookingCents) {
    return { finalCents: rawTotalCents, minUpliftCents: 0 };
  }
  const bumped = Math.ceil(minBookingCents / ROUND_STEP_CENTS) * ROUND_STEP_CENTS;
  return {
    finalCents: bumped,
    minUpliftCents: bumped - rawTotalCents,
  };
}

export function mapWizardServiceToPricingEngineService(
  id: 'standard' | 'airbnb' | 'deep' | 'move' | 'carpet'
): PricingInput['serviceType'] {
  const m: Record<
    'standard' | 'airbnb' | 'deep' | 'move' | 'carpet',
    PricingInput['serviceType']
  > = {
    standard: 'Standard',
    airbnb: 'Airbnb',
    deep: 'Deep',
    move: 'Move',
    carpet: 'Carpet',
  };
  return m[id];
}

export type PricingEngineResult = {
  finalPrice: number;
  costFloor: number;
  margin: number;
  marginRate: number;
  jobHours: number;
  hoursPerCleaner: number;
  basePriceBeforeCompanyLines: number;
  /** R50 rounding delta only (before min floor). */
  roundingAdjustmentCents: number;
  minBookingUpliftCents: number;
  rawTotalBeforeMinCents: number;
  marginRateBoostApplied: 0;
};

function clampTeamSize(n: number): number {
  return Math.max(1, Math.floor(Number.isFinite(n) ? n : 1));
}

/** @deprecated Legacy hourly margin path — prefer `calculateBookingV4` for Deep/Move/Carpet. */
function mapEngineServiceToV4(
  st: PricingInput['serviceType']
): 'deep' | 'move' | 'carpet' | null {
  if (st === 'Deep') return 'deep';
  if (st === 'Move' || st === 'MoveOut') return 'move';
  if (st === 'Carpet') return 'carpet';
  return null;
}

export function mapPricingInputServiceToEarningsService(
  serviceType: PricingInput['serviceType']
): string {
  if (serviceType === 'Move' || serviceType === 'MoveOut') return 'Move In/Out';
  return serviceType;
}

export function requiresTeamForPricingInput(input: PricingInput): boolean {
  const s = input.serviceType;
  const team = clampTeamSize(input.teamSize);
  if (s === 'Deep' || s === 'Move' || s === 'MoveOut') return true;
  if ((s === 'Standard' || s === 'Airbnb') && team > 1) return true;
  return false;
}

function unifiedEngineResultForStandardAirbnb(input: {
  mode: PricingMode;
  time: TimeInput;
  serviceType: 'Standard' | 'Airbnb';
  equipmentCents: number;
  extrasIds: string[];
  extrasQuantities?: Record<string, number> | null;
}): PricingEngineResult {
  const hasExtraCleaner = input.extrasIds.some(
    (id) => id === 'extra_cleaner' || id.includes('extra_cleaner')
  );
  const uni = calculateBookingUnified({
    service_type: input.serviceType === 'Standard' ? 'standard' : 'airbnb',
    pricing_mode: input.mode === 'basic' ? 'quick' : 'premium',
    bedrooms: Math.max(1, input.time.bedrooms),
    bathrooms: Math.max(0, input.time.bathrooms),
    extra_rooms: Math.max(0, input.time.extraRooms),
    extras: input.extrasIds,
    extrasQuantities: input.extrasQuantities,
    has_extra_cleaner: input.mode !== 'basic' && hasExtraCleaner,
  });
  const cleaningCents = Math.round(uni.final_price_zar * 100);
  const finalPrice = cleaningCents + input.equipmentCents;
  return {
    finalPrice,
    costFloor: cleaningCents,
    margin: 0,
    marginRate: 0,
    jobHours: uni.hours,
    hoursPerCleaner: uni.duration,
    basePriceBeforeCompanyLines: cleaningCents,
    roundingAdjustmentCents: 0,
    minBookingUpliftCents: 0,
    rawTotalBeforeMinCents: finalPrice,
    marginRateBoostApplied: 0,
  };
}

/**
 * Single pricing function: labour × (1 + margin) + fees, R50 round, guardrails.
 */
export function calculateFinalPriceCents(params: {
  hours: number;
  teamSize: number;
  margin: number;
  serviceFeeCents: number;
  equipmentCents?: number;
}): {
  labourCents: number;
  subtotalAfterMarginCents: number;
  rawTotalCents: number;
  roundedTotalCents: number;
  roundingAdjustmentCents: number;
} {
  const { hours, teamSize, margin, serviceFeeCents, equipmentCents = 0 } = params;

  if (!hours || hours <= 0 || !Number.isFinite(hours)) {
    throw new Error('Invalid totalHours');
  }
  if (!teamSize || teamSize <= 0 || !Number.isFinite(teamSize)) {
    throw new Error('Invalid teamSize');
  }

  const labourCents = HOURLY_RATE_CENTS * hours * teamSize;

  if (labourCents < hours * teamSize * 5000) {
    throw new Error('Labour too low — pricing bug');
  }

  const subtotalAfterMarginCents = Math.round(labourCents * (1 + margin));
  const rawTotalCents = subtotalAfterMarginCents + serviceFeeCents + equipmentCents;

  const roundedTotalCents =
    Math.round(rawTotalCents / ROUND_STEP_CENTS) * ROUND_STEP_CENTS;
  const roundingAdjustmentCents = roundedTotalCents - rawTotalCents;

  if (Math.abs(roundingAdjustmentCents) > rawTotalCents * 0.05) {
    throw new Error('Adjustment too large — pricing bug');
  }

  return {
    labourCents,
    subtotalAfterMarginCents,
    rawTotalCents,
    roundedTotalCents,
    roundingAdjustmentCents,
  };
}

function assertServicePricingHierarchy(timeBase: Pick<TimeInput, 'bedrooms' | 'bathrooms' | 'extraRooms' | 'addOns'>): void {
  const keys: WizardServiceKey[] = ['standard', 'airbnb', 'carpet', 'deep', 'move'];
  const DEFAULT_FEE = 4000;
  const totals = keys.map((serviceType) => {
    const hours = calculateJobHours({ ...timeBase, serviceType });
    const team = getRecommendedTeamSize(hours, serviceType);
    const margin = SERVICE_CONFIG[serviceType].margin;
    const eq = SERVICE_CONFIG[serviceType].equipmentCents ?? 0;
    const { roundedTotalCents } = calculateFinalPriceCents({
      hours,
      teamSize: team,
      margin,
      serviceFeeCents: DEFAULT_FEE,
      equipmentCents: eq,
    });
    const minCents = SERVICE_MIN_BOOKING_CENTS[serviceType];
    let final = roundedTotalCents;
    if (final < minCents) {
      final = minCents;
      final = Math.ceil(final / ROUND_STEP_CENTS) * ROUND_STEP_CENTS;
    }
    return final;
  });

  const ok =
    totals[0] < totals[1] &&
    totals[1] < totals[2] &&
    totals[2] < totals[3] &&
    totals[2] < totals[4];

  if (!ok) {
    const payload = {
      timeBase,
      cents: {
        standard: totals[0],
        airbnb: totals[1],
        carpet: totals[2],
        deep: totals[3],
        move: totals[4],
      },
    };
    // Advisory only — config drift must not break booking UI in dev; tune `SERVICE_CONFIG` when this fires.
    console.warn(
      '[pricing-engine] Tier ordering check failed (expected standard < airbnb < carpet; carpet < deep & carpet < move — deep vs move order not required)',
      JSON.stringify(payload, null, 2)
    );
  }
}

export function calculatePricingEngine(input: PricingInput): PricingEngineResult {
  const teamSize = clampTeamSize(input.teamSize);
  const jobHours = Number(input.totalHours) || 0;

  if (!jobHours || jobHours <= 0 || !Number.isFinite(jobHours)) {
    throw new Error('Invalid totalHours');
  }

  const marginRate = getMarginRateForEngineService(input.serviceType);
  const equipmentCents = Math.max(
    0,
    Math.round(input.equipmentCost ?? getEquipmentCentsForEngineService(input.serviceType))
  );
  const serviceFeeCents = Math.max(0, Math.round(input.serviceFee ?? 0));

  const fp = calculateFinalPriceCents({
    hours: jobHours,
    teamSize,
    margin: marginRate,
    serviceFeeCents,
    equipmentCents,
  });

  const { finalCents: finalPrice, minUpliftCents: minUplift } =
    applyServiceMinBookingFloorCents(fp.roundedTotalCents, input.serviceType);

  const marginAmount = fp.subtotalAfterMarginCents - fp.labourCents;

  const shouldLog =
    process.env.NODE_ENV === 'development' || process.env.PRICING_DEBUG === '1';
  if (shouldLog) {
    console.log({
      service: input.serviceType,
      hours: jobHours,
      teamSize,
      hourlyRate: HOURLY_RATE_CENTS / 100,
      labour: fp.labourCents / 100,
      margin: marginRate,
      total: finalPrice / 100,
    });
  }

  return {
    finalPrice,
    costFloor: fp.labourCents,
    margin: marginAmount,
    marginRate,
    jobHours,
    hoursPerCleaner: jobHours,
    basePriceBeforeCompanyLines: fp.subtotalAfterMarginCents,
    roundingAdjustmentCents: fp.roundingAdjustmentCents,
    minBookingUpliftCents: minUplift,
    rawTotalBeforeMinCents: fp.roundedTotalCents,
    marginRateBoostApplied: 0,
  };
}

/** No legacy “safe” margin loop — one pass only. */
export function calculateSafePrice(input: PricingInput): PricingEngineResult {
  return calculatePricingEngine(input);
}

/** Deep/Move/Carpet time×rate engine — Standard/Airbnb use `calculateFinalBookingPrice` / unified cart instead. */
export const calculateEnginePrice = calculateSafePrice;

export function calculateSafePriceFromJobTime(
  params: Omit<PricingInput, 'totalHours' | 'teamSize'> & {
    time: TimeInput;
    teamSize?: number;
  }
): PricingEngineResult {
  const hours = calculateJobHours(params.time);
  validateTimeDrivenHours(params.time, hours);
  if (process.env.NODE_ENV !== 'production') {
    assertServicePricingHierarchy({
      bedrooms: params.time.bedrooms,
      bathrooms: params.time.bathrooms,
      extraRooms: params.time.extraRooms,
      addOns: params.time.addOns,
    });
  }

  const teamSize = clampTeamSize(
    params.teamSize ?? getRecommendedTeamSize(hours, params.time.serviceType)
  );

  return calculateSafePrice({
    serviceType: params.serviceType,
    totalHours: hours,
    teamSize,
    equipmentCost: getEquipmentCentsForEngineService(params.serviceType),
    serviceFee: params.serviceFee,
  });
}

/**
 * Wizard / snapshot pricing: Standard & Airbnb use unified V4 + `calculateBookingUnified`; Deep/Move/Carpet use `calculateBookingV4` only.
 */
export function calculatePrice(
  mode: PricingMode,
  params: {
    time: TimeInput;
    serviceType: PricingInput['serviceType'];
    teamSize?: number;
    serviceFeeCents?: number;
    equipmentCents?: number;
    extrasIds?: string[];
    extrasQuantities?: Record<string, number> | null;
    quickCleanSettings?: QuickCleanSettings;
  }
): PricingEngineResult {
  const equipmentCents =
    params.equipmentCents ??
    getEquipmentCentsForEngineService(params.serviceType);
  if (params.serviceType === 'Standard' || params.serviceType === 'Airbnb') {
    return unifiedEngineResultForStandardAirbnb({
      mode,
      time: params.time,
      serviceType: params.serviceType,
      equipmentCents,
      extrasIds: params.extrasIds ?? [],
      extrasQuantities: params.extrasQuantities,
    });
  }

  const v4Service = mapEngineServiceToV4(params.serviceType);
  if (!v4Service) {
    throw new Error(`calculatePrice: unsupported service ${params.serviceType}`);
  }
  const v4 = calculateBookingV4({
    service_type: v4Service,
    bedrooms: Math.max(1, params.time.bedrooms),
    bathrooms: v4Service === 'carpet' ? 0 : Math.max(0, params.time.bathrooms),
    extra_rooms: 0,
    carpets: v4Service === 'carpet' ? Math.max(1, params.time.bedrooms) : undefined,
    rugs: v4Service === 'carpet' ? Math.max(0, params.time.bathrooms) : 0,
    extras: params.extrasIds ?? [],
    extrasQuantities: params.extrasQuantities,
  });
  const cleaningCents = Math.round(v4.price_zar * 100);
  const finalPrice = cleaningCents + equipmentCents;
  return {
    finalPrice,
    costFloor: cleaningCents,
    margin: 0,
    marginRate: 0,
    jobHours: v4.hours,
    hoursPerCleaner: v4.duration,
    basePriceBeforeCompanyLines: cleaningCents,
    roundingAdjustmentCents: 0,
    minBookingUpliftCents: 0,
    rawTotalBeforeMinCents: finalPrice,
    marginRateBoostApplied: 0,
  };
}

/** @deprecated Prefer `calculateBookingV4` — legacy job-time × margin + V2 fee layer. */
export function calculatePremiumV2(
  job: Parameters<typeof calculateSafePriceFromJobTime>[0]
): PricingEngineV2Result {
  const baseEngine = calculateSafePriceFromJobTime({ ...job, serviceFee: 0 });
  return applyV2FeesToPremiumEngineBase(baseEngine);
}

export function mapApiServiceToPricingEngineService(
  s: string | null | undefined
): PricingInput['serviceType'] {
  const v = (s || '').trim();
  if (v === 'Move In/Out') return 'Move';
  if (v === 'Standard' || v === 'Airbnb' || v === 'Deep' || v === 'Carpet') {
    return v as PricingInput['serviceType'];
  }
  return 'Standard';
}

export function buildCustomerPriceBreakdownZar(
  engine: PricingEngineResult,
  serviceFeeZar: number,
  equipmentZar: number,
  teamSize: number
): { id: string; label: string; value: number }[] {
  const laborCents = engine.costFloor;
  const marginCents = engine.margin;
  const feeCents = Math.max(0, Math.round(serviceFeeZar * 100));
  const eqCents = Math.max(0, Math.round(equipmentZar * 100));

  const n = Math.max(1, Math.floor(Number.isFinite(teamSize) ? teamSize : 1));
  const laborLabel = n > 1 ? `Cleaning Labour (${n} cleaners)` : 'Cleaning Labour';

  const rows: { id: string; label: string; value: number }[] = [
    { id: 'cleaner_labor', label: laborLabel, value: laborCents / 100 },
    { id: 'platform_fee', label: 'Platform Fee', value: marginCents / 100 },
  ];
  if (feeCents > 0) {
    rows.push({ id: 'service_fee', label: 'Service Fee', value: feeCents / 100 });
  }
  if (eqCents > 0) {
    rows.push({ id: 'equipment', label: 'Equipment & Supplies', value: eqCents / 100 });
  }
  if (engine.roundingAdjustmentCents !== 0) {
    rows.push({
      id: 'rounding',
      label: 'Rounding (R50)',
      value: engine.roundingAdjustmentCents / 100,
    });
  }
  if (engine.minBookingUpliftCents > 0) {
    rows.push({
      id: 'minimum_booking',
      label: 'Minimum booking',
      value: engine.minBookingUpliftCents / 100,
    });
  }

  const sumCents =
    laborCents +
    marginCents +
    feeCents +
    eqCents +
    engine.roundingAdjustmentCents +
    engine.minBookingUpliftCents;
  if (sumCents !== engine.finalPrice) {
    console.error('[pricing-engine] Breakdown sum mismatch', {
      sumCents,
      finalCents: engine.finalPrice,
    });
  }

  return rows;
}

function engineFromBookingSnapshotBody(
  body: {
    service?: string | null;
    pricingMode?: PricingMode;
    pricingTotalHours?: number;
    pricingTeamSize?: number;
    equipmentCostCents?: number;
    serviceFee?: number;
    bedrooms?: number;
    bathrooms?: number;
    extraRooms?: number;
    extras?: string[];
    extrasQuantities?: Record<string, number>;
    basicPlannedHours?: number | null;
    scheduleEquipmentPref?: 'bring' | 'own';
  },
  _quickCleanSettings?: QuickCleanSettings
): PricingEngineResult | null {
  if (body.service == null) return null;
  if (
    typeof body.bedrooms !== 'number' ||
    typeof body.bathrooms !== 'number' ||
    !Array.isArray(body.extras)
  ) {
    return null;
  }
  const time = timeInputFromBookingSnapshot(body);
  const st = mapApiServiceToPricingEngineService(body.service);
  const eqConfigured =
    Math.max(0, Math.round(Number(body.equipmentCostCents) || 0)) ||
    getEquipmentCentsForEngineService(st);
  const equipmentCents =
    body.pricingMode === 'basic' && body.scheduleEquipmentPref !== 'bring'
      ? Math.max(0, Math.round(Number(body.equipmentCostCents) || 0))
      : eqConfigured;
  const mode: PricingMode = body.pricingMode === 'basic' ? 'basic' : 'premium';

  if (st === 'Standard' || st === 'Airbnb') {
    return unifiedEngineResultForStandardAirbnb({
      mode,
      time,
      serviceType: st,
      equipmentCents,
      extrasIds: body.extras,
      extrasQuantities: body.extrasQuantities,
    });
  }

  const v4Service = mapEngineServiceToV4(st);
  if (!v4Service) return null;

  const v4 = calculateBookingV4({
    service_type: v4Service,
    bedrooms: Math.max(1, body.bedrooms || 1),
    bathrooms: v4Service === 'carpet' ? 0 : Math.max(0, body.bathrooms || 0),
    extra_rooms: 0,
    rugs: v4Service === 'carpet' ? Math.max(0, body.bathrooms || 0) : 0,
    extras: body.extras ?? [],
    extrasQuantities: body.extrasQuantities,
  });
  const cleaningCents = Math.round(v4.price_zar * 100);
  const finalPrice = cleaningCents + equipmentCents;
  return {
    finalPrice,
    costFloor: cleaningCents,
    margin: 0,
    marginRate: 0,
    jobHours: v4.hours,
    hoursPerCleaner: v4.duration,
    basePriceBeforeCompanyLines: cleaningCents,
    roundingAdjustmentCents: 0,
    minBookingUpliftCents: 0,
    rawTotalBeforeMinCents: finalPrice,
    marginRateBoostApplied: 0,
  };
}

export function recomputeEngineFinalCentsFromBookingBody(
  body: {
    service?: string | null;
    pricingTotalHours?: number;
    pricingTeamSize?: number;
    equipmentCostCents?: number;
    extraCleanerFeeCents?: number;
    serviceFee?: number;
    pricingMode?: PricingMode;
    bedrooms?: number;
    bathrooms?: number;
    extraRooms?: number;
    extras?: string[];
    extrasQuantities?: Record<string, number>;
    basicPlannedHours?: number | null;
    scheduleEquipmentPref?: 'bring' | 'own';
  },
  _quickCleanSettings?: QuickCleanSettings
): number | null {
  const stEarly = mapApiServiceToPricingEngineService(body.service);
  if (stEarly === 'Standard' || stEarly === 'Airbnb') {
    return null;
  }

  const fromSnapshot = engineFromBookingSnapshotBody(body, _quickCleanSettings);
  if (fromSnapshot != null) {
    return fromSnapshot.finalPrice;
  }
  const st = mapApiServiceToPricingEngineService(body.service);
  const v4s = mapEngineServiceToV4(st);
  if (
    v4s &&
    typeof body.bedrooms === 'number' &&
    typeof body.bathrooms === 'number' &&
    Array.isArray(body.extras)
  ) {
    const v4 = calculateBookingV4({
      service_type: v4s,
      bedrooms: Math.max(1, body.bedrooms || 1),
      bathrooms: v4s === 'carpet' ? 0 : Math.max(0, body.bathrooms || 0),
      extra_rooms: 0,
      rugs: v4s === 'carpet' ? Math.max(0, body.bathrooms || 0) : 0,
      extras: body.extras ?? [],
      extrasQuantities: body.extrasQuantities,
    });
    const eqBody = Math.max(0, Math.round(Number(body.equipmentCostCents) || 0));
    return (
      Math.round(v4.price_zar * 100) +
      (eqBody > 0 ? eqBody : getEquipmentCentsForEngineService(st))
    );
  }
  return null;
}

export function validatePricingEngineRequest(
  body: {
    service?: string | null;
    pricingEngineFinalCents?: number;
    pricingTotalHours?: number;
    pricingTeamSize?: number;
    equipmentCostCents?: number;
    extraCleanerFeeCents?: number;
    serviceFee?: number;
    pricingMode?: PricingMode;
    bedrooms?: number;
    bathrooms?: number;
    extraRooms?: number;
    extras?: string[];
    extrasQuantities?: Record<string, number>;
    basicPlannedHours?: number | null;
    scheduleEquipmentPref?: 'bring' | 'own';
  },
  _quickCleanSettings?: QuickCleanSettings
): { ok: true } | { ok: false; error: string } {
  const st = mapApiServiceToPricingEngineService(body.service);
  if (st === 'Standard' || st === 'Airbnb') {
    return { ok: true };
  }

  if (
    body.pricingEngineFinalCents == null ||
    !Number.isFinite(body.pricingEngineFinalCents)
  ) {
    return { ok: true };
  }
  const th = Number(body.pricingTotalHours);
  if (!Number.isFinite(th) || th <= 0) {
    return { ok: false, error: 'Invalid or missing pricing hours' };
  }

  if (
    typeof body.bedrooms === 'number' &&
    typeof body.bathrooms === 'number' &&
    Array.isArray(body.extras)
  ) {
    const v4Service = mapEngineServiceToV4(st);
    const hoursExpected =
      v4Service != null
        ? calculateBookingV4({
            service_type: v4Service,
            bedrooms: Math.max(1, body.bedrooms || 1),
            bathrooms: v4Service === 'carpet' ? 0 : Math.max(0, body.bathrooms || 0),
            extra_rooms: 0,
            rugs: v4Service === 'carpet' ? Math.max(0, body.bathrooms || 0) : 0,
            extras: body.extras ?? [],
            extrasQuantities: body.extrasQuantities,
          }).hours
        : calculateJobHours(timeInputFromBookingSnapshot(body));
    if (Math.abs(hoursExpected - th) > 0.51) {
      return { ok: false, error: 'Pricing hours mismatch' };
    }
    const serverEngine = engineFromBookingSnapshotBody(body, _quickCleanSettings);
    if (serverEngine != null) {
      if (
        Math.abs(
          serverEngine.finalPrice - Math.round(body.pricingEngineFinalCents)
        ) > 5000
      ) {
        return { ok: false, error: 'Price mismatch detected' };
      }
      return { ok: true };
    }
  }

  const serverEngine = calculateEnginePrice({
    serviceType: st,
    totalHours: th,
    teamSize: Math.max(1, Math.round(Number(body.pricingTeamSize) || 1)),
    equipmentCost: Math.max(
      0,
      Math.round(Number(body.equipmentCostCents) || 0) || getEquipmentCentsForEngineService(st)
    ),
    serviceFee: 0,
  });
  if (
    Math.abs(serverEngine.finalPrice - Math.round(body.pricingEngineFinalCents)) > 5000
  ) {
    return { ok: false, error: 'Price mismatch detected' };
  }
  return { ok: true };
}
