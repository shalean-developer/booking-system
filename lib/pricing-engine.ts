/**
 * Production-oriented cost-plus pricing helper aligned with `earnings-v2` (same hourly baseline,
 * company-only lines excluded from the commission pool via `commissionSubtotalCents`).
 *
 * This module does not replace catalog pricing (`lib/pricing.ts`) — use for estimates and guards only.
 */

import { TARGET_HOURLY_RATE } from '@/lib/earnings-config';
import {
  calculateSoloEarnings,
  calculateTeamEarnings,
  commissionSubtotalCents,
} from '@/lib/earnings-v2';

export { TARGET_HOURLY_RATE };

/** R600 minimum job (cents). */
export const MIN_BOOKING_PRICE_CENTS = 60_000;

/** R50 in cents — price rounding step. */
const ROUND_STEP_CENTS = 5_000;

/** Minimum share of customer charge retained as company (after simulated cleaner payout). */
const MIN_COMPANY_PROFIT_RATIO = 0.3;

const MAX_MARGIN_BOOST_STEPS = 40;
const MARGIN_BOOST_STEP = 0.05;

export type PricingInput = {
  serviceType: 'Standard' | 'Airbnb' | 'Deep' | 'Move' | 'MoveOut' | 'Carpet';
  /** Total job hours (wall-clock / billed hours). */
  totalHours: number;
  teamSize: number;
  /** Company-only revenue (cents). */
  equipmentCost?: number;
  extraCleanerFee?: number;
  serviceFee?: number;
};

/** Wizard `data.service` slug → engine service (Move-In/Out maps to `Move`). */
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
  /** Final customer charge (cents), after min floor and R50 rounding. */
  finalPrice: number;
  costFloor: number;
  margin: number;
  marginRate: number;
  hoursPerCleaner: number;
  /** Labor + dynamic margin, before equipment / extra cleaner / service fee. */
  basePriceBeforeCompanyLines: number;
  /** Extra margin applied so `validatePricingAgainstEarnings` passes (safe price path). */
  marginRateBoostApplied: number;
};

function clampTeamSize(n: number): number {
  return Math.max(1, Math.floor(Number.isFinite(n) ? n : 1));
}

function tierMarginRate(costFloorCents: number): number {
  if (costFloorCents < 100_000) return 0.6;
  if (costFloorCents < 300_000) return 0.5;
  return 0.4;
}

/**
 * Maps engine service labels to earnings-v2 `serviceType` strings (pool rates, team rules).
 */
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

/**
 * Core engine: cost floor → dynamic margin → add company-only lines → minimum → round up to R50.
 *
 * @param marginRateBoost — added to the tier margin (for iterative tightening in `calculateSafePrice`).
 */
export function calculatePricingEngine(
  input: PricingInput,
  options?: { marginRateBoost?: number }
): PricingEngineResult {
  const teamSize = clampTeamSize(input.teamSize);
  const totalHours = Math.max(0, Number(input.totalHours) || 0);
  const hoursPerCleaner = teamSize > 0 ? totalHours / teamSize : 0;

  const costFloor = Math.round(teamSize * hoursPerCleaner * TARGET_HOURLY_RATE);

  let marginRate = tierMarginRate(costFloor);
  const boost = Math.max(0, options?.marginRateBoost ?? 0);
  marginRate = Math.min(0.95, marginRate + boost);

  const margin = Math.round(costFloor * marginRate);
  const basePriceBeforeCompanyLines = costFloor + margin;

  const eq = Math.max(0, Math.round(input.equipmentCost ?? 0));
  const ex = Math.max(0, Math.round(input.extraCleanerFee ?? 0));
  const fee = Math.max(0, Math.round(input.serviceFee ?? 0));

  let finalPrice = basePriceBeforeCompanyLines + eq + ex + fee;

  if (finalPrice < MIN_BOOKING_PRICE_CENTS) {
    finalPrice = MIN_BOOKING_PRICE_CENTS;
  }

  finalPrice = Math.ceil(finalPrice / ROUND_STEP_CENTS) * ROUND_STEP_CENTS;

  return {
    finalPrice,
    costFloor,
    margin,
    marginRate,
    hoursPerCleaner,
    basePriceBeforeCompanyLines,
    marginRateBoostApplied: boost,
  };
}

export type ValidatePricingAgainstEarningsResult = {
  ok: boolean;
  companyProfitCents: number;
  companyProfitRatio: number;
  cleanerPayoutCents: number;
  commissionSubtotalCents: number;
};

/**
 * Simulates earnings-v2 on the final price and company lines. Conservative defaults: no tip,
 * unknown hire date (60% commission tier for solo).
 */
export function validatePricingAgainstEarnings(params: {
  finalPriceCents: number;
  input: PricingInput;
  requiresTeam: boolean;
  /** Omit for worst-case solo commission (60%). */
  hireDate?: string | null;
  tipCents?: number;
}): ValidatePricingAgainstEarningsResult {
  const finalPriceCents = Math.max(0, Math.round(params.finalPriceCents));
  const tipCents = Math.max(0, Math.round(params.tipCents ?? 0));
  const pricingInput = params.input;
  const equipmentCostCents = Math.max(0, Math.round(pricingInput.equipmentCost ?? 0));
  const extraCleanerFeeCents = Math.max(0, Math.round(pricingInput.extraCleanerFee ?? 0));
  const serviceFeeCents = Math.max(0, Math.round(pricingInput.serviceFee ?? 0));

  const subtotal = commissionSubtotalCents({
    totalAmountCents: finalPriceCents,
    serviceFeeCents,
    tipCents,
    equipmentCostCents,
    extraCleanerFeeCents,
  });

  const earningsServiceType = mapPricingInputServiceToEarningsService(pricingInput.serviceType);
  const teamSize = clampTeamSize(pricingInput.teamSize);

  let cleanerPayoutCents: number;
  if (params.requiresTeam) {
    cleanerPayoutCents = calculateTeamEarnings({
      totalAmountCents: finalPriceCents,
      serviceFeeCents,
      tipCents,
      teamSize,
      serviceType: earningsServiceType,
      equipmentCostCents,
      extraCleanerFeeCents,
      timeContext: pricingInput.totalHours > 0 ? { totalHours: pricingInput.totalHours } : null,
    }).totalCleanerPayoutCents;
  } else {
    cleanerPayoutCents = calculateSoloEarnings({
      totalAmountCents: finalPriceCents,
      serviceFeeCents,
      tipCents,
      hireDate: params.hireDate ?? null,
      equipmentCostCents,
      extraCleanerFeeCents,
      timeContext: pricingInput.totalHours > 0 ? { totalHours: pricingInput.totalHours } : null,
    });
  }

  const companyProfitCents = finalPriceCents - cleanerPayoutCents;
  const companyProfitRatio =
    finalPriceCents > 0 ? companyProfitCents / finalPriceCents : companyProfitCents >= 0 ? 1 : 0;

  const payoutWithinSubtotal = cleanerPayoutCents <= subtotal + tipCents;

  const ok =
    companyProfitRatio >= MIN_COMPANY_PROFIT_RATIO &&
    companyProfitCents >= 0 &&
    payoutWithinSubtotal;

  return {
    ok,
    companyProfitCents,
    companyProfitRatio,
    cleanerPayoutCents,
    commissionSubtotalCents: subtotal,
  };
}

/**
 * Runs `calculatePricingEngine` then raises margin (in steps) until earnings validation passes
 * or a cap is hit. Use for “safe” quotes that stay aligned with `earnings-v2`.
 */
export function calculateSafePrice(input: PricingInput): PricingEngineResult {
  let boost = 0;
  let last = calculatePricingEngine(input, { marginRateBoost: boost });

  for (let i = 0; i < MAX_MARGIN_BOOST_STEPS; i++) {
    const v = validatePricingAgainstEarnings({
      finalPriceCents: last.finalPrice,
      input,
      requiresTeam: requiresTeamForPricingInput(input),
      tipCents: 0,
      hireDate: null,
    });
    if (v.ok) {
      return { ...last, marginRateBoostApplied: boost };
    }
    const tier = tierMarginRate(last.costFloor);
    boost = Math.min(0.95 - tier, boost + MARGIN_BOOST_STEP);
    last = calculatePricingEngine(input, { marginRateBoost: boost });
  }

  return last;
}

/** Integration alias — earnings-safe total in cents (cost floor + margin + company lines, R50 rounding). */
export const calculateBookingPrice = calculateSafePrice;

/**
 * Maps API `service_type` values to engine labels (`Move In/Out` → `Move`).
 */
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

/**
 * Anti-tampering: recomputes engine on the server and requires client `pricingEngineFinalCents` to match
 * within R50 (5000 cents). Skip when `pricingEngineFinalCents` is absent (legacy clients).
 */
export function validatePricingEngineRequest(body: {
  service?: string | null;
  pricingEngineFinalCents?: number;
  pricingTotalHours?: number;
  pricingTeamSize?: number;
  equipmentCostCents?: number;
  extraCleanerFeeCents?: number;
  serviceFee?: number;
}): { ok: true } | { ok: false; error: string } {
  if (
    body.pricingEngineFinalCents == null ||
    !Number.isFinite(body.pricingEngineFinalCents)
  ) {
    return { ok: true };
  }
  const serverEngine = calculateBookingPrice({
    serviceType: mapApiServiceToPricingEngineService(body.service),
    totalHours: Math.max(0, Number(body.pricingTotalHours) || 0),
    teamSize: Math.max(1, Math.round(Number(body.pricingTeamSize) || 1)),
    equipmentCost: Math.max(0, Math.round(Number(body.equipmentCostCents) || 0)),
    extraCleanerFee: Math.max(0, Math.round(Number(body.extraCleanerFeeCents) || 0)),
    serviceFee: Math.max(0, Math.round((Number(body.serviceFee) || 0) * 100)),
  });
  if (
    Math.abs(serverEngine.finalPrice - Math.round(body.pricingEngineFinalCents)) > 5000
  ) {
    return { ok: false, error: 'Price mismatch detected' };
  }
  return { ok: true };
}

/*
 * TODO: Future pricing (non-destructive extensions)
 * -------------------------------------------------------------------------------------------------
 * - Dynamic pricing: weekends, public holidays, short-notice / urgent jobs
 * - Area-based multipliers (suburb / travel band)
 * - Demand surge (slot occupancy–aware) — keep in sync with checkout surge if added
 */
