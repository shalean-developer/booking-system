/**
 * Fire-and-forget stub: notifies supply automation when a slot has no coverage.
 * Uses internal API so ops can swap implementation (queue, email, push) later.
 */
export async function triggerCleanerInvite(opts: {
  area: string;
  time: string;
  baseUrl?: string;
}): Promise<void> {
  const base =
    opts.baseUrl ||
    (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_BASE_URL?.trim() : '') ||
    (typeof process !== 'undefined' ? process.env.VERCEL_URL?.trim() : '');
  if (!base) return;
  const origin = base.startsWith('http') ? base : `https://${base}`;
  try {
    await fetch(`${origin.replace(/\/$/, '')}/api/cleaners/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ area: opts.area, time: opts.time }),
    });
  } catch {
    /* non-blocking */
  }
}
