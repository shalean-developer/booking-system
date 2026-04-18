import { TARGET_HOURLY_RATE, MAX_HOURLY_RATE } from '@/lib/earnings-config';
import { idealTeamSizeFromTotalHours } from '@/lib/earnings-v2';

/**
 * Non-blocking admin UI warnings for earnings review — does not change payouts.
 */
export function buildEarningsAdminWarnings(input: {
  totalAmountCents: number | null | undefined;
  companyProfitCents: number | null | undefined;
  totalHours: number | null | undefined;
  teamSize: number | null | undefined;
  /** Implied cents per hour per cleaner (integer), or null if unknown. */
  impliedHourlyCentsPerCleaner: number | null | undefined;
}): string[] {
  const warnings: string[] = [];

  const total = Math.max(0, Math.round(input.totalAmountCents ?? 0));
  const profit = input.companyProfitCents;
  if (total > 0 && profit != null && Number.isFinite(profit)) {
    const pct = (profit / total) * 100;
    if (pct < 15) warnings.push('❌ Risk of loss');
    else if (pct < 25) warnings.push('⚠️ Low profit');
  }

  const th = input.totalHours;
  const ts = input.teamSize;
  if (th != null && th > 0 && ts != null && ts > 0) {
    if (ts > idealTeamSizeFromTotalHours(th)) {
      warnings.push('⚠️ Overstaffed job');
    }
  }

  const hCents = input.impliedHourlyCentsPerCleaner;
  if (hCents != null && hCents > 0) {
    if (hCents < TARGET_HOURLY_RATE) warnings.push('⚠️ Underpay risk');
    if (hCents > MAX_HOURLY_RATE) warnings.push('⚠️ Overpay risk');
  }

  return warnings;
}

/** Cents per hour per cleaner from total team payout and hours (integer cents). */
export function impliedHourlyCentsForTeamPayout(input: {
  totalPayoutCents: number;
  teamSize: number;
  hoursPerCleaner: number | null | undefined;
}): number | null {
  const h = input.hoursPerCleaner;
  if (h == null || h <= 0) return null;
  const sz = Math.max(1, Math.floor(input.teamSize));
  const perCleaner = Math.round(input.totalPayoutCents / sz);
  return Math.round(perCleaner / h);
}
