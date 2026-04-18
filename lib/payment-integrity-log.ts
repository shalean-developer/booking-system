/**
 * Structured logs for payment validation (webhook + finalize). No card or customer PII.
 */

export function logPaymentIntegrity(payload: Record<string, unknown>): void {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      module: 'payment_integrity',
      ...payload,
    }),
  );
}

/** Safe correlation id for logs (not full reference). */
export function redactPaymentReference(ref: string): string {
  const t = ref.trim();
  if (!t) return '';
  if (t.length <= 10) return `len:${t.length}`;
  return `${t.slice(0, 4)}…${t.slice(-4)}(len:${t.length})`;
}
