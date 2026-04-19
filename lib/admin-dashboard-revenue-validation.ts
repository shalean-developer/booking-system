import { isExcludedFromRevenueReporting } from '@/lib/booking-revenue-exclusion';

type BookingRow = {
  total_amount?: number | null;
  payment_status?: string | null;
  status?: string | null;
};

/**
 * Dev-only: if raw SUM(total_amount) for the fetched cohort differs from revenue after exclusion,
 * log (expected whenever exclusions apply).
 */
export function logAdminRevenueExclusionDeltaDev(
  label: string,
  rows: BookingRow[] | null | undefined,
  revenueAfterExclusionCents: number
): void {
  if (process.env.NODE_ENV !== 'development') return;

  const list = rows || [];
  const sumRaw = list.reduce((s, b) => s + Math.round(Number(b.total_amount) || 0), 0);
  const sumIncluded = list
    .filter((b) => !isExcludedFromRevenueReporting(b) && b.total_amount && Number(b.total_amount) > 0)
    .reduce((s, b) => s + Math.round(Number(b.total_amount) || 0), 0);

  if (Math.abs(sumIncluded - revenueAfterExclusionCents) > 1) {
    console.warn(`[admin-dashboard-revenue] ${label}: recomputed sum !== passed revenue (bug?)`, {
      revenueAfterExclusionCents,
      sumIncluded,
    });
  }

  if (sumRaw !== sumIncluded) {
    console.warn(`[admin-dashboard-revenue] ${label}: cohort SUM(total_amount) ≠ revenue after exclusion`, {
      sumRawCents: sumRaw,
      revenueAfterExclusionCents: sumIncluded,
      excludedCents: sumRaw - sumIncluded,
    });
  }
}
