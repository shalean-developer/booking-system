/**
 * Idempotency keys for scheduled payouts.
 * One key per cleaner per calendar day (UTC) when the payout cron runs — duplicate runs same day → deduped.
 */

export function buildScheduledPayoutIdempotencyKey(cleanerId: string, now: Date): string {
  const d = now.toISOString().slice(0, 10);
  return `payout-${cleanerId}-${d}`;
}

export function buildRetryPayoutIdempotencyKey(cleanerId: string, failedWalletTxId: string, now: Date): string {
  return `payout-retry-${cleanerId}-${failedWalletTxId}-${now.getTime()}`;
}

/**
 * One id per cron invocation — stored on wallet_transactions.payout_batch_id for audit
 * (duplicate pay protection remains idempotency_key + DB unique index).
 */
export function buildPayoutRunBatchId(now: Date = new Date()): string {
  return `payout-run-${now.toISOString().replace(/[:.]/g, '-').slice(0, 19)}Z`;
}
