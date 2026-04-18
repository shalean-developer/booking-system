import { assertEdgeCronKey, invokeSiteCron, jsonFromFetch } from '../_shared/invoke-site-cron.ts';

/**
 * Scheduled via Supabase. Same behaviour as GET /api/cron/generate-recurring-bookings (incl. ?force=true on site URL if needed).
 */
Deno.serve(async (req) => {
  const denied = assertEdgeCronKey(req);
  if (denied) return denied;

  try {
    const upstream = await invokeSiteCron('/api/cron/generate-recurring-bookings');
    return await jsonFromFetch(upstream);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[edge generate-recurring-bookings]', e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
