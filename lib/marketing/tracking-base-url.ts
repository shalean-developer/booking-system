import 'server-only';

import { publicSiteBaseUrl } from '@/lib/booking-manage';

/**
 * Base URL used in email HTML for open pixel and click redirects.
 * Prefer explicit marketing base in env so tracking links match production domain.
 */
export function marketingTrackingPublicBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_MARKETING_TRACKING_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  return publicSiteBaseUrl();
}
