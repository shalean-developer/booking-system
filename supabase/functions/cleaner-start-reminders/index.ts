import { assertEdgeCronKey, invokeSiteCron, jsonFromFetch } from '../_shared/invoke-site-cron.ts';

/** Supabase cron → Edge → GET /api/cron/cleaner-start-reminders */
Deno.serve(async (req) => {
  const denied = assertEdgeCronKey(req);
  if (denied) return denied;

  try {
    const upstream = await invokeSiteCron('/api/cron/cleaner-start-reminders');
    return await jsonFromFetch(upstream);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    console.error('[edge cleaner-start-reminders]', e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
