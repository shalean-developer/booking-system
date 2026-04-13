/**
 * Admin dashboard home — optional env overrides (client-safe).
 * Monthly revenue goal in cents (e.g. 50000000 = R500,000).
 */
export function getAdminMonthlyRevenueGoalCents(): number {
  const raw = process.env.NEXT_PUBLIC_ADMIN_MONTHLY_REVENUE_GOAL_CENTS;
  if (raw === undefined || raw === '') return 50_000_000;
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 ? n : 50_000_000;
}
