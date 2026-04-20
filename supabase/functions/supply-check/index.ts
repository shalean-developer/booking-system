import { assertEdgeCronKey, invokeSiteCron, jsonFromFetch } from '../_shared/invoke-site-cron.ts';

/** Supabase cron → Edge → GET /api/cron/supply-check */
Deno.serve(async (req) => {
  const denied = assertEdgeCronKey(req);
  if (denied) return denied;

  try {
    const upstream = await invokeSiteCron('/api/cron/supply-check');
    return await jsonFromFetch(upstream);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[edge supply-check]', e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
