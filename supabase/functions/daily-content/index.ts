import { assertEdgeCronKey, invokeSiteCron, jsonFromFetch } from '../_shared/invoke-site-cron.ts';

/**
 * Scheduled via Supabase. Same behaviour as GET /api/cron/daily-content (Bearer or ?secret= on app route).
 */
Deno.serve(async (req) => {
  const denied = assertEdgeCronKey(req);
  if (denied) return denied;

  try {
    const upstream = await invokeSiteCron('/api/cron/daily-content');
    return await jsonFromFetch(upstream);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[edge daily-content]', e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
