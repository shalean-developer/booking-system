/**
 * Tracks repeated payment validation failures per Paystack reference (DB-backed for serverless).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { logPaymentIntegrity, redactPaymentReference } from '@/lib/payment-integrity-log';

export function getPaymentValidationFailureAlertThreshold(): number {
  const n = Number(process.env.PAYMENT_VALIDATION_FAILURE_ALERT_THRESHOLD);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 3;
}

export async function recordPaymentValidationFailure(
  supabase: SupabaseClient,
  paymentReference: string,
  failureType: 'payment_amount_mismatch' | 'invalid_currency' | 'payment_reference_mismatch',
): Promise<void> {
  const ref = paymentReference.trim();
  if (!ref) return;

  const { data, error } = await supabase.rpc('record_payment_validation_failure', {
    p_reference: ref,
    p_failure_type: failureType,
  });

  if (error) {
    console.warn('[payment-validation] record_payment_validation_failure failed', error.message);
    return;
  }

  const count = typeof data === 'number' ? data : Number(data);
  if (!Number.isFinite(count)) return;

  const threshold = getPaymentValidationFailureAlertThreshold();
  const thresholdTriggered = count >= threshold;

  const baseLog = {
    failure_type: failureType,
    reference_redacted: redactPaymentReference(ref),
    failure_count: count,
    threshold,
    threshold_triggered: thresholdTriggered,
  };

  if (thresholdTriggered) {
    logPaymentIntegrity({
      event_type: 'payment_validation_repeated_failure',
      ...baseLog,
    });
  } else {
    logPaymentIntegrity({
      event_type: 'payment_validation_failure_recorded',
      ...baseLog,
    });
  }
}
