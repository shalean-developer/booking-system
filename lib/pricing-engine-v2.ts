/**
 * Pricing Engine V2 — Basic: tier rates, R250 min for ≤3h, R10 labour round, cover + fixed fee,
 * then monotonic total (2h→5h never decreases, ≥ +R20 vs previous hour).
 * Premium: wraps existing labour engine + V2 fee layer.
 */

export type PricingMode = 'basic' | 'premium';

export interface PricingResult {
  /** Labour (rounded) + booking cover — headline “Estimated Price” before service fee. */
  cleaningCents: number;
  serviceFeeCents: number;
  /** Kept 0 — cover is folded into `cleaningCents` for display. */
  coverFeeCents: number;
  totalCents: number;
  hours: number;
  rateUsed?: number;
  isMinimumApplied?: boolean;
  hoursPerCleaner?: number;
  /** Basic, hours > 3: savings vs R65/h reference (cents). */
  savingsCents?: number;
  /** Basic + extras: fixed 8h full-day bundle (R450 all-in incl. fee). */
  isExtrasFullDayBundle?: boolean;
}

export type CalculateBasicV2Options = {
  /** When true, use 8h fixed bundle (R411 est. + R39 fee = R450). Overrides tier math. */
  hasExtras?: boolean;
};

/** Planned hours when extras require full-day bundle pricing. */
export const BASIC_EXTRAS_FULL_DAY_HOURS = 8;

/** All-in total (labour + cover in cleaning line + service fee). */
export const BASIC_EXTRAS_BUNDLE_TOTAL_CENTS = 45_000;

export const BASIC_MIN_PRICE = 25_000;
export const SERVICE_FEE_CENTS = 3_900;
export const COVER_PERCENT = 0.06;
export const BASIC_SAVINGS_REFERENCE_RATE_CENTS = 6_500;

/** Basic labour: nearest R10 (avoids R50 bands collapsing different bases). */
export const BASIC_LABOUR_ROUND_STEP_CENTS = 1_000;

/** Minimum increase vs previous hour tier (2000¢ = R20) so totals never go backwards. */
export const BASIC_MONOTONIC_MIN_INCREMENT_CENTS = 2_000;

/**
 * Marketplace-style clean totals (premium path only).
 */
export function roundToPsychologicalPrice(cents: number): number {
  const rands = cents / 100;
  if (rands <= 260) return 25_000;
  if (rands <= 320) return 30_000;
  if (rands <= 370) return 35_000;
  if (rands <= 420) return 39_000;
  if (rands <= 470) return 45_000;
  return Math.round(cents / 5_000) * 5_000;
}

/** Tiered ZAR-cent hourly rates — smoother drops so 4h+ does not undercut shorter bookings before monotonic pass. */
export function getBasicHourlyRate(hours: number): number {
  if (hours <= 3) return 6_500;
  if (hours === 4) return 6_200;
  if (hours === 5) return 6_000;
  return 5_800;
}

export function computeBasicTierSavingsZar(hours: number, rateUsedCents: number): number {
  if (hours <= 3) return 0;
  const savingsPerHour = BASIC_SAVINGS_REFERENCE_RATE_CENTS - rateUsedCents;
  if (savingsPerHour <= 0) return 0;
  return Math.round((savingsPerHour * hours) / 100);
}

export function computeBasicTierSavingsCents(hours: number, rateUsedCents: number): number {
  if (hours <= 3) return 0;
  const savingsPerHour = BASIC_SAVINGS_REFERENCE_RATE_CENTS - rateUsedCents;
  if (savingsPerHour <= 0) return 0;
  return Math.round(savingsPerHour * hours);
}

function mergeCoverIntoCleaning(cleaningSubtotalCents: number): number {
  return cleaningSubtotalCents + Math.round(cleaningSubtotalCents * COVER_PERCENT);
}

function totalCentsFromRoundedLabour(roundedLabourCents: number): number {
  const cover = Math.round(roundedLabourCents * COVER_PERCENT);
  return roundedLabourCents + cover + SERVICE_FEE_CENTS;
}

/** Raise rounded labour (R10 steps) until total ≥ minTotalCents. */
function bumpRoundedLabourToMinTotal(
  roundedLabourCents: number,
  minTotalCents: number
): number {
  let r = roundedLabourCents;
  const step = BASIC_LABOUR_ROUND_STEP_CENTS;
  let guard = 0;
  while (totalCentsFromRoundedLabour(r) < minTotalCents && guard < 50_000) {
    r += step;
    guard += step;
  }
  return r;
}

function buildBasicResult(
  h: number,
  rate: number,
  raw: number,
  roundedLabourCents: number
): PricingResult {
  const cover = Math.round(roundedLabourCents * COVER_PERCENT);
  const cleaningCents = roundedLabourCents + cover;
  const totalCents = cleaningCents + SERVICE_FEE_CENTS;
  const savingsCentsRaw = computeBasicTierSavingsCents(h, rate);
  const savingsCents = savingsCentsRaw > 0 ? savingsCentsRaw : undefined;
  const minFloorUsed =
    h <= 3 ? Math.max(raw, BASIC_MIN_PRICE) : raw;
  const isMinimumApplied =
    h <= 3 && minFloorUsed > raw;

  return {
    cleaningCents,
    serviceFeeCents: SERVICE_FEE_CENTS,
    coverFeeCents: 0,
    totalCents,
    hours: h,
    rateUsed: rate,
    isMinimumApplied,
    hoursPerCleaner: h,
    savingsCents,
  };
}

function basicExtrasFullDayBundle(): PricingResult {
  const h = BASIC_EXTRAS_FULL_DAY_HOURS;
  const cleaningCents = BASIC_EXTRAS_BUNDLE_TOTAL_CENTS - SERVICE_FEE_CENTS;
  const impliedLabour = Math.round(cleaningCents / (1 + COVER_PERCENT));
  const rateUsed = Math.round(impliedLabour / h);

  return {
    cleaningCents,
    serviceFeeCents: SERVICE_FEE_CENTS,
    coverFeeCents: 0,
    totalCents: BASIC_EXTRAS_BUNDLE_TOTAL_CENTS,
    hours: h,
    hoursPerCleaner: h,
    rateUsed,
    isMinimumApplied: false,
    isExtrasFullDayBundle: true,
    savingsCents: undefined,
  };
}

/**
 * Unadjusted Basic V2: min R250 for 1–3h only; 4h+ use raw tier labour; R10 round; cover + fee.
 */
function calculateBasicV2Unadjusted(hours: number): PricingResult {
  const h = Math.min(5, Math.max(0.5, hours));
  const rate = getBasicHourlyRate(h);
  const raw = h * rate;
  const base = h <= 3 ? Math.max(raw, BASIC_MIN_PRICE) : raw;
  const step = BASIC_LABOUR_ROUND_STEP_CENTS;
  const roundedLabour = Math.round(base / step) * step;
  return buildBasicResult(h, rate, raw, roundedLabour);
}

/**
 * Basic: tier rates → R250 minimum for ≤3h only → R10 labour round → 6% cover → R39 fee.
 * Totals strictly increase 2h→5h (≥ +R20 vs previous hour).
 * With `hasExtras`, 8h fixed R450 all-in (R411 estimated + R39 fee) — no tier table.
 */
export function calculateBasicV2(
  hours: number,
  options?: CalculateBasicV2Options
): PricingResult {
  if (options?.hasExtras) {
    return basicExtrasFullDayBundle();
  }

  const h = Math.min(5, Math.max(2, Math.round(Number(hours))));
  const u = calculateBasicV2Unadjusted(h);
  if (h <= 2) {
    return u;
  }
  const prev = calculateBasicV2(h - 1);
  const minTotal = prev.totalCents + BASIC_MONOTONIC_MIN_INCREMENT_CENTS;
  if (u.totalCents >= minTotal) {
    return u;
  }
  const rate = getBasicHourlyRate(h);
  const raw = h * rate;
  const base = h <= 3 ? Math.max(raw, BASIC_MIN_PRICE) : raw;
  const step = BASIC_LABOUR_ROUND_STEP_CENTS;
  const rounded0 = Math.round(base / step) * step;
  const rounded1 = bumpRoundedLabourToMinTotal(rounded0, minTotal);
  return buildBasicResult(h, rate, raw, rounded1);
}

export type PremiumEngineBaseForV2 = {
  finalPrice: number;
  jobHours: number;
  hoursPerCleaner: number;
  minBookingUpliftCents: number;
};

export function applyV2FeesToPremiumEngineBase(base: PremiumEngineBaseForV2): PricingResult {
  const mergedBeforePsych = mergeCoverIntoCleaning(base.finalPrice);
  const cleaningAdjusted = roundToPsychologicalPrice(mergedBeforePsych);
  const serviceFee = SERVICE_FEE_CENTS;

  return {
    cleaningCents: cleaningAdjusted,
    serviceFeeCents: serviceFee,
    coverFeeCents: 0,
    totalCents: cleaningAdjusted + serviceFee,
    hours: base.jobHours,
    hoursPerCleaner: base.hoursPerCleaner,
    isMinimumApplied: base.minBookingUpliftCents > 0,
  };
}

export function calculatePriceV2(
  mode: PricingMode,
  input: { hours: number; hasExtras?: boolean } | { premiumBase: PremiumEngineBaseForV2 }
): PricingResult {
  if (mode === 'basic') {
    const b = input as { hours: number; hasExtras?: boolean };
    return calculateBasicV2(b.hours, { hasExtras: b.hasExtras });
  }
  return applyV2FeesToPremiumEngineBase((input as { premiumBase: PremiumEngineBaseForV2 }).premiumBase);
}
