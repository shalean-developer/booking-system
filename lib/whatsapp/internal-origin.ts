import 'server-only';

/** Base URL for same-origin API calls from server routes (snapshot + pending). */
export function getInternalAppOrigin(): string {
  const explicit = process.env.INTERNAL_APP_ORIGIN?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) return site.replace(/\/$/, '');
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, '')}`;
  return 'http://127.0.0.1:3001';
}
