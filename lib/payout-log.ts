/**
 * Structured payout audit logs: DB row + JSON line for log drains.
 */

import { createServiceClient } from '@/lib/supabase-server';

export type PayoutLogLevel = 'info' | 'warn' | 'error';

export async function logPayoutEvent(params: {
  eventType: string;
  cleanerId?: string | null;
  walletTransactionId?: string | null;
  idempotencyKey?: string | null;
  payload?: Record<string, unknown>;
  level?: PayoutLogLevel;
}): Promise<void> {
  const line = {
    ts: new Date().toISOString(),
    level: params.level ?? 'info',
    module: 'payout',
    event_type: params.eventType,
    cleaner_id: params.cleanerId ?? null,
    wallet_transaction_id: params.walletTransactionId ?? null,
    idempotency_key: params.idempotencyKey ?? null,
    ...((params.payload && { detail: params.payload }) || {}),
  };

  const logFn =
    params.level === 'error'
      ? console.error
      : params.level === 'warn'
        ? console.warn
        : console.log;
  logFn(JSON.stringify(line));

  try {
    const svc = createServiceClient();
    await svc.rpc('log_payout_event', {
      p_event_type: params.eventType,
      p_cleaner_id: params.cleanerId ?? null,
      p_wallet_transaction_id: params.walletTransactionId ?? null,
      p_idempotency_key: params.idempotencyKey ?? null,
      p_payload: (params.payload ?? null) as Record<string, unknown> | null,
    });
  } catch (e) {
    console.warn('[payout-log] log_payout_event rpc failed', e);
  }
}
