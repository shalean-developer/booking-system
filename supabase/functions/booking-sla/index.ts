import { assertEdgeCronKey, invokeSiteCron, jsonFromFetch } from '../_shared/invoke-site-cron.ts';

/**
 * Scheduled via Supabase (Dashboard cron or pg_cron → this function URL).
 * Executes the same logic as GET /api/cron/booking-sla on the deployed site.
 */
Deno.serve(async (req) => {
  const denied = assertEdgeCronKey(req);
  if (denied) return denied;

  try {
    const upstream = await invokeSiteCron('/api/cron/booking-sla');
    return await jsonFromFetch(upstream);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[edge booking-sla]', e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
