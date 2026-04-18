/** Payout retry / stale recovery (used by cron + SQL RPC defaults). */

export function getPayoutMaxRetries(): number {
  const n = Number(process.env.PAYOUT_MAX_RETRIES);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}

export function getPayoutRetryBaseDelaySeconds(): number {
  const n = Number(process.env.PAYOUT_RETRY_BASE_DELAY_SECONDS);
  return Number.isFinite(n) && n >= 60 ? Math.floor(n) : 3600;
}

export function getStaleProcessingMaxHours(): number {
  const n = Number(process.env.PAYOUT_STALE_PROCESSING_HOURS);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 72;
}
