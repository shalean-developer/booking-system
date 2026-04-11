/**
 * Public site origin for server-side redirects (e.g. Paystack callback_url).
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_BASE_URL | NEXT_PUBLIC_SITE_URL | NEXT_PUBLIC_APP_URL
 * 2. VERCEL_URL (https://…) on Vercel deployments
 * 3. Request Host / X-Forwarded-* (works for local `next dev` without env)
 */
export function resolvePublicBaseUrl(req: Request): string {
  const trim = (s: string) => s.replace(/\/$/, '');

  const fromEnv =
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return trim(fromEnv);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const hostOnly = vercel.replace(/^https?:\/\//, '').replace(/\/$/, '');
    return trim(`https://${hostOnly}`);
  }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host) {
    const isLocal =
      host.startsWith('localhost') ||
      host.startsWith('127.') ||
      host.startsWith('[::1]') ||
      host.includes('.local');
    const proto = req.headers.get('x-forwarded-proto') || (isLocal ? 'http' : 'https');
    return trim(`${proto}://${host}`);
  }

  return '';
}
