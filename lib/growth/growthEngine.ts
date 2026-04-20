/**
 * Growth engine: ads (Google + Meta), referrals, SEO funnel, server-side logging.
 * Client pixels fire only after cookie consent (see AnalyticsConsent + GrowthTrackingProvider).
 */

export const GROWTH_EVENTS = {
  PAGE_VIEW: 'page_view',
  BOOKING_STARTED: 'booking_started',
  BOOKING_COMPLETED: 'booking_completed',
  PURCHASE: 'purchase',
  REFERRAL_CLICK: 'referral_click',
  REFERRAL_SIGNUP: 'referral_signup',
  SEO_PAGE_VIEW: 'seo_page_view',
} as const;

export type GrowthEventName = (typeof GROWTH_EVENTS)[keyof typeof GROWTH_EVENTS];

/** GA4 recommended events + custom Meta standard events */
export const GA4_CONVERSION_EVENT = 'purchase';

export type GrowthEventPayload = {
  event: GrowthEventName | string;
  /** ZAR for conversions (not cents) */
  value_zar?: number;
  currency?: string;
  /** e.g. booking id, ref code */
  transaction_id?: string;
  page_path?: string;
  page_title?: string;
  service?: string;
  area_slug?: string;
  referral_code?: string;
  [key: string]: unknown;
};

function siteBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin.replace(/\/$/, '');
  }
  return (
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    ''
  );
}

/**
 * Canonical share link: `/ref?code=…` → signup applies `ref` (UUID or SHALEAN… code).
 */
export function generateReferralLink(referralCodeOrCustomerId: string): string {
  const raw = referralCodeOrCustomerId.trim();
  if (!raw) return '/signup';
  return `/ref?code=${encodeURIComponent(raw)}`;
}

export function getAbsoluteReferralGrowthUrl(referralCodeOrCustomerId: string): string {
  const path = generateReferralLink(referralCodeOrCustomerId);
  const base = siteBaseUrl();
  return base ? `${base}${path}` : path;
}

/** Log SEO landing (server or client → POST /api/growth/event). */
export function logSEOPageVisit(params: {
  /** Programmatic page id (service × location × intent) */
  service: string;
  area_slug: string;
  path: string;
}): GrowthEventPayload {
  return {
    event: GROWTH_EVENTS.SEO_PAGE_VIEW,
    service: params.service,
    area_slug: params.area_slug,
    page_path: params.path,
  };
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Client-only: push to dataLayer / gtag / Meta when consent allows scripts to load.
 */
export function trackEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  const payload = { event: name, ...params };

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(payload);
  } catch {
    // ignore
  }

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params ?? {});
    }
  } catch {
    // ignore
  }

  try {
    if (typeof window.fbq === 'function') {
      window.fbq('trackCustom', name, params ?? {});
    }
  } catch {
    // ignore
  }
}

/**
 * Conversion with value in ZAR (booking total). Maps to GA4 `purchase` + Meta `Purchase`.
 */
export function trackConversion(params: {
  value_zar: number;
  transaction_id: string;
  currency?: string;
  items?: Record<string, unknown>;
}): void {
  if (typeof window === 'undefined') return;

  const currency = params.currency ?? 'ZAR';
  const value = Math.max(0, Number(params.value_zar) || 0);

  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: GA4_CONVERSION_EVENT,
      ecommerce: {
        transaction_id: params.transaction_id,
        value,
        currency,
        items: params.items,
      },
    });
  } catch {
    // ignore
  }

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', GA4_CONVERSION_EVENT, {
        transaction_id: params.transaction_id,
        value,
        currency,
      });
    }
  } catch {
    // ignore
  }

  try {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'Purchase', {
        value,
        currency,
        content_ids: [params.transaction_id],
      });
    }
  } catch {
    // ignore
  }

  trackEvent(GROWTH_EVENTS.BOOKING_COMPLETED, {
    value_zar: value,
    transaction_id: params.transaction_id,
    currency,
  });
}
