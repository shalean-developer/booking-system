/**
 * Bridge: Supabase Edge → deployed Next.js `/api/cron/*` handlers (same logic as manual HTTP).
 * Set secrets: CRON_INVOKE_URL (e.g. https://shalean.co.za), CRON_SECRET (must match Vercel).
 */
export async function invokeSiteCron(path: string): Promise<Response> {
  const base = Deno.env.get('CRON_INVOKE_URL')?.replace(/\/$/, '') ?? '';
  const secret = Deno.env.get('CRON_SECRET') ?? '';
  if (!base || !secret) {
    throw new Error('CRON_INVOKE_URL and CRON_SECRET must be set for Edge cron bridges');
  }
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${p}?secret=${encodeURIComponent(secret)}`;
  return await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}

/** Optional gate: require x-cron-key on incoming Edge requests (set CRON_EDGE_KEY in function secrets). */
export function assertEdgeCronKey(req: Request): Response | null {
  const expected = Deno.env.get('CRON_EDGE_KEY')?.trim();
  if (!expected) return null;
  const got = req.headers.get('x-cron-key')?.trim();
  if (got !== expected) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return null;
}

export async function jsonFromFetch(res: Response): Promise<Response> {
  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
