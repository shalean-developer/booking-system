/**
 * Dev / ops logging for cleaner mobile app actions (avoid PII in production logs).
 */

export function logCleanerAppDev(payload: {
  cleaner_id: string;
  action: string;
  booking_id?: string | null;
  extra?: Record<string, unknown>;
}) {
  if (process.env.NODE_ENV !== 'development') return;
  // eslint-disable-next-line no-console
  console.log('[cleaner-app]', {
    cleaner_id: payload.cleaner_id,
    action: payload.action,
    booking_id: payload.booking_id ?? null,
    ...payload.extra,
  });
}
