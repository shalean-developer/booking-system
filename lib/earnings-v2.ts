/**
 * Earnings v2 — hybrid pool, caps, admin approval, and optional time-based fairness floor.
 * Amounts are in integer cents unless noted.
 */

import { TARGET_HOURLY_RATE } from '@/lib/earnings-config';

const BASE_PER_CLEANER_CENTS = 25_000; // R250
const REVIEW_TOTAL_THRESHOLD_CENTS = 400_000; // R4000
/** Below this hours-per-cleaner, time floor is not applied (short job protection). */
const SHORT_JOB_HOURS_PER_CLEANER = 5;

export type EarningsStatus = 'pending' | 'approved';

export type TimeFairnessContext = {
  /** Whole hours for the job (e.g. from duration). */
  totalHours: number;
};

export function getCommissionRateFromHireDate(hireDate: string | null): number {
  if (!hireDate) return 0.6;
  const hire = new Date(hireDate);
  const now = new Date();
  const monthsDiff =
    (now.getFullYear() - hire.getFullYear()) * 12 + (now.getMonth() - hire.getMonth());
  return monthsDiff >= 4 ? 0.7 : 0.6;
}

export function getPoolRateForServiceType(serviceType: string | null): number {
  const s = serviceType || '';
  if (s === 'Deep' || s === 'Move In/Out' || s === 'Move') return 0.55;
  if (s === 'Carpet') return 0.5;
  return 0.5;
}

/** Ideal cleaners for an 8-hour shift baseline (overstaffing heuristic). */
export function idealTeamSizeFromTotalHours(totalHours: number): number {
  const h = Math.max(0, totalHours);
  return Math.max(1, Math.ceil(h / 8));
}

/**
 * Derive whole hours from scheduled duration. Returns null if unknown.
 */
export function deriveTotalHoursFromDurationMinutes(durationMinutes: number | null | undefined): number | null {
  if (durationMinutes == null || !Number.isFinite(durationMinutes) || durationMinutes <= 0) return null;
  return Math.max(1, Math.round(durationMinutes / 60));
}

function distributeRemainderAcrossShares(base: number[], remainder: number): number[] {
  if (remainder <= 0) return base;
  const extra = splitCentsEvenly(remainder, base.length);
  return base.map((b, i) => b + (extra[i] || 0));
}

/**
 * Amount the commission pool is applied to: excludes company-only lines (equipment, extra cleaners).
 *
 * INVARIANT (earnings + pricing): `service_fee`, `tip_amount`, `equipment_cost`, and `extra_cleaner_fee`
 * must never enter pool / commission / cost-floor math except via this subtraction from `total_amount`.
 * Call sites must pass the same cents stored on the booking row.
 *
 * Quick Clean (all-in, `service_fee` = 0): commission applies to the full customer total minus tips
 * and company lines — platform share is implicit in `total - pool - tips` (no separate fee carve-out).
 */
export function commissionSubtotalCents(input: {
  totalAmountCents: number;
  serviceFeeCents: number;
  tipCents: number;
  equipmentCostCents?: number;
  extraCleanerFeeCents?: number;
}): number {
  const total = Math.max(0, Math.round(input.totalAmountCents));
  const fee = Math.max(0, Math.round(input.serviceFeeCents || 0));
  const tip = Math.max(0, Math.round(input.tipCents || 0));
  const eq = Math.max(0, Math.round(input.equipmentCostCents || 0));
  const ex = Math.max(0, Math.round(input.extraCleanerFeeCents || 0));
  return Math.max(0, total - fee - tip - eq - ex);
}

/**
 * Solo cleaner: commission with min/cap on commission portion, then add full tip.
 * Optional time floor: max(price-based, time minimum), capped at commission cap + tip.
 */
export function calculateSoloEarnings(input: {
  totalAmountCents: number;
  serviceFeeCents: number;
  tipCents: number;
  hireDate: string | null;
  /** Company-only (cents); excluded from commission subtotal. */
  equipmentCostCents?: number;
  extraCleanerFeeCents?: number;
  /** When set with totalHours, applies a lower bound vs hourly baseline (unless short job). */
  timeContext?: TimeFairnessContext | null;
}): number {
  const tip = Math.max(0, Math.round(input.tipCents || 0));
  const subtotal = commissionSubtotalCents({
    totalAmountCents: input.totalAmountCents,
    serviceFeeCents: input.serviceFeeCents,
    tipCents: input.tipCents,
    equipmentCostCents: input.equipmentCostCents,
    extraCleanerFeeCents: input.extraCleanerFeeCents,
  });

  const rate = getCommissionRateFromHireDate(input.hireDate);
  const commissionPart = Math.round(subtotal * rate);
  const minimum = Math.min(BASE_PER_CLEANER_CENTS, Math.round(subtotal * 0.8));
  const cap = Math.round(subtotal * 0.65);
  const commission = Math.min(Math.max(commissionPart, minimum), cap);

  const priceBased = Math.round(commission + tip);
  const maxCleanerTotal = cap + tip;

  const tc = input.timeContext;
  if (!tc || tc.totalHours <= 0) return priceBased;

  const teamSize = 1;
  const hoursPerCleaner = tc.totalHours / teamSize;
  if (hoursPerCleaner < SHORT_JOB_HOURS_PER_CLEANER) return priceBased;

  const timeMinimum = Math.round(hoursPerCleaner * TARGET_HOURLY_RATE);
  return Math.min(Math.max(priceBased, timeMinimum), maxCleanerTotal);
}

export interface TeamEarningsResult {
  /** Sum of all cleaners' earnings (pool share + tip). */
  totalCleanerPayoutCents: number;
  perCleanerCents: number;
  finalPoolCents: number;
}

/**
 * Team pool: per-cleaner share including tip split; optional time floor per cleaner (respects pool cap).
 */
export function calculateTeamEarnings(input: {
  totalAmountCents: number;
  serviceFeeCents: number;
  tipCents: number;
  teamSize: number;
  serviceType: string | null;
  equipmentCostCents?: number;
  extraCleanerFeeCents?: number;
  timeContext?: TimeFairnessContext | null;
}): TeamEarningsResult {
  const teamSize = Math.max(1, Math.floor(input.teamSize));
  const tip = Math.max(0, Math.round(input.tipCents || 0));
  const subtotal = commissionSubtotalCents({
    totalAmountCents: input.totalAmountCents,
    serviceFeeCents: input.serviceFeeCents,
    tipCents: input.tipCents,
    equipmentCostCents: input.equipmentCostCents,
    extraCleanerFeeCents: input.extraCleanerFeeCents,
  });

  const poolRate = getPoolRateForServiceType(input.serviceType);
  const pool = subtotal * poolRate;
  const baseTotal = teamSize * BASE_PER_CLEANER_CENTS;
  let finalPool = Math.max(baseTotal, pool);
  const maxPool = subtotal * 0.6;
  finalPool = Math.min(finalPool, maxPool);

  const finalPoolRounded = Math.round(finalPool);
  const totalPayout = finalPoolRounded + tip;
  let amounts = splitCentsEvenly(totalPayout, teamSize);

  const tc = input.timeContext;
  if (tc && tc.totalHours > 0) {
    const hoursPerCleaner = tc.totalHours / teamSize;
    if (hoursPerCleaner >= SHORT_JOB_HOURS_PER_CLEANER) {
      const timeMin = Math.round(hoursPerCleaner * TARGET_HOURLY_RATE);
      const raised = amounts.map((a) => Math.max(a, timeMin));
      const sumRaised = raised.reduce((x, y) => x + y, 0);
      if (sumRaised > totalPayout) {
        // Price cap wins — cannot apply time floor without exceeding pool
        amounts = splitCentsEvenly(totalPayout, teamSize);
      } else if (sumRaised < totalPayout) {
        amounts = distributeRemainderAcrossShares(raised, totalPayout - sumRaised);
      } else {
        amounts = raised;
      }
    }
  }

  return {
    totalCleanerPayoutCents: totalPayout,
    perCleanerCents: amounts[0] ?? 0,
    finalPoolCents: finalPoolRounded,
  };
}

/** Split integer cents across n recipients; first entries get +1 when remainder. */
export function splitCentsEvenly(totalCents: number, n: number): number[] {
  const total = Math.max(0, Math.round(totalCents));
  const size = Math.max(1, Math.floor(n));
  const base = Math.floor(total / size);
  const rem = total - base * size;
  return Array.from({ length: size }, (_, i) => base + (i < rem ? 1 : 0));
}

export function requiresEarningsReview(input: {
  totalAmountCents: number;
  teamSize: number;
  serviceType: string | null;
  /** When set, enables overstaffing check: teamSize > ceil(totalHours/8). */
  totalHours?: number | null;
}): boolean {
  if (input.totalAmountCents > REVIEW_TOTAL_THRESHOLD_CENTS) return true;
  if (input.teamSize >= 3) return true;
  const s = input.serviceType || '';
  if (s === 'Deep' || s === 'Move' || s === 'Move In/Out') return true;

  if (input.totalHours != null && input.totalHours > 0) {
    const ideal = idealTeamSizeFromTotalHours(input.totalHours);
    if (input.teamSize > ideal) return true;
  }

  return false;
}

/** Snapshot for admin / debugging — mirrors pool math, does not drive payouts. */
export type EarningsBreakdownStored = {
  subtotal: number;
  pool: number;
  cap: number;
  team_size: number;
  hours_per_cleaner: number | null;
  hourly_rate: number;
  excluded_costs: {
    equipment_cost: number;
    extra_cleaner_fee: number;
  };
  mode: 'solo' | 'team';
  /** Also excluded from commission subtotal (debug). */
  service_fee_cents: number;
  tip_cents: number;
};

/**
 * Read-only breakdown for `earnings_breakdown` JSONB — same inputs as booking insert, no payout changes.
 */
export function buildEarningsBreakdownSnapshot(input: {
  totalAmountCents: number;
  serviceFeeCents: number;
  tipCents: number;
  hireDate: string | null;
  serviceType: string | null;
  requiresTeam: boolean;
  teamSize: number;
  equipmentCostCents?: number;
  extraCleanerFeeCents?: number;
  durationMinutes?: number | null;
}): EarningsBreakdownStored {
  const totalCents = Math.max(0, Math.round(input.totalAmountCents));
  const teamSize = Math.max(1, Math.round(input.teamSize));
  const equipmentCostCents = Math.max(0, Math.round(input.equipmentCostCents ?? 0));
  const extraCleanerFeeCents = Math.max(0, Math.round(input.extraCleanerFeeCents ?? 0));
  const serviceFeeCents = Math.max(0, Math.round(input.serviceFeeCents || 0));
  const tipCents = Math.max(0, Math.round(input.tipCents || 0));

  const subtotal = commissionSubtotalCents({
    totalAmountCents: totalCents,
    serviceFeeCents,
    tipCents,
    equipmentCostCents,
    extraCleanerFeeCents,
  });

  const totalHours = deriveTotalHoursFromDurationMinutes(input.durationMinutes ?? null);
  const hoursPerCleanerStored =
    totalHours != null ? Math.max(1, Math.round(totalHours / teamSize)) : null;

  if (input.requiresTeam) {
    const poolRate = getPoolRateForServiceType(input.serviceType);
    const poolRaw = subtotal * poolRate;
    const baseTotal = teamSize * BASE_PER_CLEANER_CENTS;
    let finalPool = Math.max(baseTotal, poolRaw);
    const maxPool = subtotal * 0.6;
    finalPool = Math.min(finalPool, maxPool);
    const finalPoolRounded = Math.round(finalPool);
    return {
      subtotal,
      pool: finalPoolRounded,
      cap: Math.round(maxPool),
      team_size: teamSize,
      hours_per_cleaner: hoursPerCleanerStored,
      hourly_rate: TARGET_HOURLY_RATE,
      excluded_costs: {
        equipment_cost: equipmentCostCents,
        extra_cleaner_fee: extraCleanerFeeCents,
      },
      mode: 'team',
      service_fee_cents: serviceFeeCents,
      tip_cents: tipCents,
    };
  }

  const rate = getCommissionRateFromHireDate(input.hireDate);
  const commissionPart = Math.round(subtotal * rate);
  const minimum = Math.min(BASE_PER_CLEANER_CENTS, Math.round(subtotal * 0.8));
  const capCents = Math.round(subtotal * 0.65);
  const commission = Math.min(Math.max(commissionPart, minimum), capCents);

  return {
    subtotal,
    pool: commission,
    cap: capCents,
    team_size: teamSize,
    hours_per_cleaner: hoursPerCleanerStored,
    hourly_rate: TARGET_HOURLY_RATE,
    excluded_costs: {
      equipment_cost: equipmentCostCents,
      extra_cleaner_fee: extraCleanerFeeCents,
    },
    mode: 'solo',
    service_fee_cents: serviceFeeCents,
    tip_cents: tipCents,
  };
}

export interface EarningsInsertFields {
  earnings_calculated: number;
  earnings_status: EarningsStatus;
  earnings_final: number | null;
  earnings_reviewed_by: null;
  earnings_reviewed_at: null;
  cleaner_earnings: number;
  equipment_cost: number;
  extra_cleaner_fee: number;
  total_hours?: number | null;
  team_size?: number | null;
  hours_per_cleaner?: number | null;
  hourly_rate_used?: number | null;
  /** Set when earnings are approved (or auto-approved at insert); null while pending review. */
  company_profit_cents?: number | null;
  earnings_breakdown?: EarningsBreakdownStored | null;
}

/**
 * Build DB fields for a new booking row. Mirrors cleaner_earnings for legacy readers.
 * Team: calculated/final/cleaner_earnings are total payout across cleaners.
 */
export function buildEarningsInsertFields(input: {
  totalAmountCents: number;
  serviceFeeCents: number;
  tipCents: number;
  hireDate: string | null;
  serviceType: string | null;
  requiresTeam: boolean;
  teamSize: number;
  /** Company-only revenue lines (cents), excluded from pool. */
  equipmentCostCents?: number;
  extraCleanerFeeCents?: number;
  /** When provided, enables time metadata + fairness layer. */
  durationMinutes?: number | null;
}): EarningsInsertFields {
  const totalCents = Math.max(0, Math.round(input.totalAmountCents));
  const teamSize = Math.max(1, Math.round(input.teamSize));
  const equipmentCostCents = Math.max(0, Math.round(input.equipmentCostCents ?? 0));
  const extraCleanerFeeCents = Math.max(0, Math.round(input.extraCleanerFeeCents ?? 0));

  const totalHours = deriveTotalHoursFromDurationMinutes(input.durationMinutes ?? null);
  const timeContext: TimeFairnessContext | null =
    totalHours != null ? { totalHours } : null;

  const hoursPerCleanerStored =
    totalHours != null ? Math.max(1, Math.round(totalHours / teamSize)) : null;

  let calculated: number;
  if (input.requiresTeam) {
    calculated = calculateTeamEarnings({
      totalAmountCents: totalCents,
      serviceFeeCents: input.serviceFeeCents,
      tipCents: input.tipCents,
      teamSize,
      serviceType: input.serviceType,
      equipmentCostCents,
      extraCleanerFeeCents,
      timeContext,
    }).totalCleanerPayoutCents;
  } else {
    calculated = calculateSoloEarnings({
      totalAmountCents: totalCents,
      serviceFeeCents: input.serviceFeeCents,
      tipCents: input.tipCents,
      hireDate: input.hireDate,
      equipmentCostCents,
      extraCleanerFeeCents,
      timeContext,
    });
  }

  const review = requiresEarningsReview({
    totalAmountCents: totalCents,
    teamSize: input.requiresTeam ? teamSize : 1,
    serviceType: input.serviceType,
    totalHours,
  });

  const timeMeta =
    totalHours != null
      ? {
          total_hours: totalHours,
          team_size: teamSize,
          hours_per_cleaner: hoursPerCleanerStored,
          hourly_rate_used: TARGET_HOURLY_RATE,
        }
      : {
          total_hours: null,
          team_size: null,
          hours_per_cleaner: null,
          hourly_rate_used: null,
        };

  const companyLines = { equipment_cost: equipmentCostCents, extra_cleaner_fee: extraCleanerFeeCents };

  const earnings_breakdown = buildEarningsBreakdownSnapshot({
    totalAmountCents: totalCents,
    serviceFeeCents: input.serviceFeeCents,
    tipCents: input.tipCents,
    hireDate: input.hireDate,
    serviceType: input.serviceType,
    requiresTeam: input.requiresTeam,
    teamSize,
    equipmentCostCents,
    extraCleanerFeeCents,
    durationMinutes: input.durationMinutes ?? null,
  });

  if (review) {
    return {
      earnings_calculated: calculated,
      earnings_status: 'pending',
      earnings_final: null,
      earnings_reviewed_by: null,
      earnings_reviewed_at: null,
      cleaner_earnings: calculated,
      ...companyLines,
      ...timeMeta,
      company_profit_cents: null,
      earnings_breakdown,
    };
  }

  const company_profit_cents = Math.max(0, totalCents - calculated);

  return {
    earnings_calculated: calculated,
    earnings_status: 'approved',
    earnings_final: calculated,
    earnings_reviewed_by: null,
    earnings_reviewed_at: null,
    cleaner_earnings: calculated,
    ...companyLines,
    ...timeMeta,
    company_profit_cents,
    earnings_breakdown,
  };
}

/** Resolved payout for a booking row (solo: use final; legacy: cleaner_earnings). */
export function getResolvedBookingPayoutTotalCents(booking: {
  earnings_final?: number | null;
  earnings_calculated?: number | null;
  cleaner_earnings?: number | null;
  earnings_status?: string | null;
}): number | null {
  if (booking.earnings_final != null) return booking.earnings_final;
  return booking.cleaner_earnings ?? booking.earnings_calculated ?? null;
}

/**
 * Implied Rands per hour per cleaner (for admin review). Null if hours unknown.
 */
export function computeHourlyEquivalentRandsPerCleaner(input: {
  payoutCentsForCleaner: number;
  hoursPerCleaner: number | null | undefined;
}): number | null {
  const h = input.hoursPerCleaner;
  if (h == null || h <= 0) return null;
  return (input.payoutCentsForCleaner / 100) / h;
}
