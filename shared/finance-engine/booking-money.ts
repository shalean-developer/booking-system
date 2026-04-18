/**
 * Canonical money fields on booking rows (cents). Used by admin profit, APIs, and UI estimates.
 */

export type BookingRevenueRow = {
  total_amount?: number | null;
};

export type BookingPayoutRow = {
  earnings_final?: number | null;
  cleaner_earnings?: number | null;
  earnings_calculated?: number | null;
};

export type BookingProfitRow = BookingRevenueRow &
  BookingPayoutRow & {
    company_profit_cents?: number | null;
  };

/** Display-only fallback when no earnings fields exist (e.g. cleaner app estimate before finalize). */
export const DEFAULT_ESTIMATED_CLEANER_SHARE_OF_REVENUE = 0.7;

export function getBookingRevenueCents(row: BookingRevenueRow): number {
  return Math.max(0, Math.round(Number(row.total_amount) || 0));
}

/**
 * Best-effort cleaner payout for any row (wallet, lists). Prefer finalized earnings.
 */
export function getCleanerPayoutCents(row: BookingPayoutRow): number {
  if (row.earnings_final != null && Number.isFinite(Number(row.earnings_final))) {
    return Math.max(0, Math.round(Number(row.earnings_final)));
  }
  if (row.cleaner_earnings != null && Number.isFinite(Number(row.cleaner_earnings))) {
    return Math.max(0, Math.round(Number(row.cleaner_earnings)));
  }
  if (row.earnings_calculated != null && Number.isFinite(Number(row.earnings_calculated))) {
    return Math.max(0, Math.round(Number(row.earnings_calculated)));
  }
  return 0;
}

/**
 * Company profit on a realized admin row: prefers `company_profit_cents`, else revenue − earnings_final
 * (matches approved P&L in `lib/admin/profit-financial`).
 */
export function getCompanyProfitCents(row: BookingProfitRow): number {
  const total = getBookingRevenueCents(row);
  const payoutFromFinal = Math.max(0, Math.round(Number(row.earnings_final) || 0));
  if (row.company_profit_cents != null && Number.isFinite(row.company_profit_cents)) {
    return Math.max(0, Math.round(row.company_profit_cents));
  }
  return Math.max(0, total - payoutFromFinal);
}
