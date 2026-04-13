/**
 * Signup path for referring friends (`ref` = referrer customer UUID from our DB).
 */
export function getReferralSignupPath(referrerCustomerId: string): string {
  const id = referrerCustomerId.trim();
  if (!id) return '/signup';
  return `/signup?ref=${encodeURIComponent(id)}`;
}

/** Absolute URL for sharing (copy, WhatsApp, email). */
export function getAbsoluteReferralSignupUrl(referrerCustomerId: string): string {
  const path = getReferralSignupPath(referrerCustomerId);
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }
  const base =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    '';
  return base ? `${base}${path}` : path;
}
