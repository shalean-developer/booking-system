/**
 * Shared profit / P&L math for admin reporting — single place for formulas.
 * Projected costs use `buildEarningsInsertFields` from earnings-v2 (same as booking pipeline).
 */

import { buildEarningsInsertFields } from '@/lib/earnings-v2';
import { getCompanyProfitCents } from '@/shared/finance-engine/booking-money';

export type ProfitMode = 'realized' | 'projected';

export const PROJECTED_STATUSES = [
  'pending',
  'reschedule_requested',
  'confirmed',
  'paid',
  'accepted',
  'in-progress',
  'on_my_way',
] as const;

export function profitCentsRealized(b: {
  total_amount: number | null;
  earnings_final: number | null;
  company_profit_cents: number | null;
}): number {
  return getCompanyProfitCents(b);
}

/** Estimated cleaner cost (cents) using the same earnings model as live bookings. */
export function estimateCleanerCostCentsProjected(b: {
  total_amount: number | null;
  service_fee: number | null;
  tip_amount: number | null;
  equipment_cost: number | null;
  extra_cleaner_fee: number | null;
  service_type: string | null;
  requires_team: boolean | null;
  team_size: number | null;
  duration_minutes: number | null;
}): number {
  const fields = buildEarningsInsertFields({
    totalAmountCents: Math.max(0, Math.round(Number(b.total_amount) || 0)),
    serviceFeeCents: Math.max(0, Math.round(Number(b.service_fee) || 0)),
    tipCents: Math.max(0, Math.round(Number(b.tip_amount) || 0)),
    hireDate: null,
    serviceType: b.service_type,
    requiresTeam: Boolean(b.requires_team),
    teamSize: Math.max(1, Math.round(Number(b.team_size) || 1)),
    equipmentCostCents: Math.max(0, Math.round(Number(b.equipment_cost) || 0)),
    extraCleanerFeeCents: Math.max(0, Math.round(Number(b.extra_cleaner_fee) || 0)),
    durationMinutes: b.duration_minutes,
  });
  return Math.max(0, Math.round(fields.earnings_calculated));
}

export function computePreviousInclusiveDateRange(
  dateFrom: string,
  dateTo: string
): { previousFrom: string; previousTo: string } | null {
  const d1 = new Date(`${dateFrom}T12:00:00`);
  const d2 = new Date(`${dateTo}T12:00:00`);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime()) || d2 < d1) return null;
  const msPerDay = 86400000;
  const inclusiveDays = Math.floor((d2.getTime() - d1.getTime()) / msPerDay) + 1;
  if (inclusiveDays < 1) return null;
  const prevTo = new Date(d1.getTime() - msPerDay);
  const prevFrom = new Date(prevTo.getTime() - (inclusiveDays - 1) * msPerDay);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { previousFrom: fmt(prevFrom), previousTo: fmt(prevTo) };
}

export function growthPct(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export type ProfitAlertItem = {
  severity: 'info' | 'warning' | 'critical';
  code: string;
  message: string;
};

function arithmeticMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, x) => s + x, 0) / values.length;
}

function sampleStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = arithmeticMean(values);
  const v = values.reduce((s, x) => s + (x - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(Math.max(0, v));
}

export type ServiceOptimizationInsight = {
  serviceType: string;
  marginPct: number | null;
  revenueCents: number;
  revenueSharePct: number;
  suggestedPriceIncreasePct: number | null;
  insight: 'low_margin' | 'watch' | 'healthy';
};

/**
 * Portfolio-relative service insights (uses same aggregates as P&L; illustrative price bumps).
 */
export function buildServiceOptimizationInsights(
  byService: Array<{ serviceType: string; revenueCents: number; profitCents: number; marginPct: number | null }>,
  targetMargin = 0.22
): ServiceOptimizationInsight[] {
  const totalRev = byService.reduce((s, r) => s + r.revenueCents, 0);
  if (totalRev <= 0) return [];

  const margins = byService
    .map((r) => r.marginPct)
    .filter((m): m is number => m != null && Number.isFinite(m));
  const mMean = margins.length >= 2 ? arithmeticMean(margins) : 20;
  const mStd = margins.length >= 3 ? sampleStdDev(margins) : 5;
  const lowMarginLine = Math.max(6, Math.min(28, mMean - 1.25 * Math.max(mStd, 3)));

  return byService.map((row) => {
    const share = row.revenueCents / totalRev;
    const m = row.marginPct;
    const rev = row.revenueCents;
    const profit = row.profitCents;
    const cost = Math.max(0, rev - profit);

    let suggestedPriceIncreasePct: number | null = null;
    if (rev > 0 && cost >= 0 && targetMargin > 0 && targetMargin < 1) {
      const neededRev = cost / (1 - targetMargin);
      if (neededRev > rev) suggestedPriceIncreasePct = ((neededRev - rev) / rev) * 100;
    }

    let insight: ServiceOptimizationInsight['insight'] = 'healthy';
    if (m != null && m < lowMarginLine && share >= 0.03) insight = 'low_margin';
    else if (m != null && m < mMean - 0.5 * mStd) insight = 'watch';

    return {
      serviceType: row.serviceType,
      marginPct: m,
      revenueCents: rev,
      revenueSharePct: share * 100,
      suggestedPriceIncreasePct:
        insight === 'low_margin' && suggestedPriceIncreasePct != null
          ? Math.round(suggestedPriceIncreasePct * 10) / 10
          : null,
      insight,
    };
  });
}

/**
 * Dispersion-based thresholds on the same in-memory series (no extra DB work).
 */
export function buildProfitAlerts(input: {
  byService: Array<{ serviceType: string; marginPct: number | null; revenueCents?: number }>;
  bookingCostSamples: Array<{ id: string; revenueCents: number; costCents: number }>;
  daily: Array<{ date: string; profitCents: number }>;
}): ProfitAlertItem[] {
  const alerts: ProfitAlertItem[] = [];

  const margins = input.byService
    .map((r) => r.marginPct)
    .filter((m): m is number => m != null && Number.isFinite(m));
  const mMean = margins.length >= 2 ? arithmeticMean(margins) : 18;
  const mStd = margins.length >= 3 ? sampleStdDev(margins) : 6;
  const lowServiceThreshold = Math.max(5, Math.min(32, mMean - 1.25 * Math.max(2, mStd)));

  for (const row of input.byService) {
    if (row.marginPct != null && row.marginPct < lowServiceThreshold) {
      const sev =
        row.marginPct < lowServiceThreshold - 6
          ? 'critical'
          : row.marginPct < lowServiceThreshold - 3
            ? 'warning'
            : 'info';
      alerts.push({
        severity: sev,
        code: 'low_margin_service',
        message: `Service "${row.serviceType}" margin ${row.marginPct.toFixed(1)}% is below the dynamic band (portfolio mean ${mMean.toFixed(1)}%, σ≈${mStd.toFixed(1)} → threshold ${lowServiceThreshold.toFixed(1)}%).`,
      });
    }
  }

  const ratios: number[] = [];
  for (const b of input.bookingCostSamples) {
    if (b.revenueCents <= 0) continue;
    ratios.push(b.costCents / b.revenueCents);
  }
  const rMean = ratios.length >= 2 ? arithmeticMean(ratios) : 0.55;
  const rStd = ratios.length >= 3 ? sampleStdDev(ratios) : 0.12;
  const highCostThreshold = Math.min(0.92, Math.max(0.62, rMean + 2 * rStd));

  let highCostCount = 0;
  for (const b of input.bookingCostSamples) {
    if (b.revenueCents <= 0) continue;
    const ratio = b.costCents / b.revenueCents;
    if (ratio >= highCostThreshold) {
      highCostCount += 1;
      alerts.push({
        severity: ratio >= highCostThreshold + 0.08 ? 'warning' : 'info',
        code: 'high_cost_booking',
        message: `Booking ${b.id.slice(0, 8)}… cost/revenue ${(ratio * 100).toFixed(0)}% (dynamic alert ≥ ${(highCostThreshold * 100).toFixed(0)}%, μ≈${(rMean * 100).toFixed(0)}%).`,
      });
      if (highCostCount >= 12) break;
    }
  }

  const sorted = [...input.daily].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length >= 14) {
    const last7 = sorted.slice(-7);
    const prev7 = sorted.slice(-14, -7);
    const sum = (rows: typeof last7) => rows.reduce((s, r) => s + r.profitCents, 0);
    const p1 = sum(last7);
    const p0 = sum(prev7);
    if (p0 > 0 && p1 < p0 * 0.9) {
      alerts.push({
        severity: 'warning',
        code: 'declining_profit_trend',
        message: `Last 7 days profit (${(p1 / 100).toFixed(0)} ZAR) is down vs prior 7 days (${(p0 / 100).toFixed(0)} ZAR).`,
      });
    }
  }

  if (sorted.length >= 10) {
    const profits = sorted.map((d) => d.profitCents);
    const pMu = arithmeticMean(profits);
    const pSig = sampleStdDev(profits);
    const last = sorted[sorted.length - 1]!;
    if (pSig > 0 && last.profitCents < pMu - 2 * pSig) {
      alerts.push({
        severity: 'critical',
        code: 'profit_daily_anomaly',
        message: `Latest day profit (${(last.profitCents / 100).toFixed(0)} ZAR) is more than 2σ below the range mean (${(pMu / 100).toFixed(0)} ZAR, σ≈${(pSig / 100).toFixed(0)} ZAR).`,
      });
    }
  }

  return alerts;
}
