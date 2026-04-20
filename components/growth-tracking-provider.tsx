'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { GROWTH_EVENTS, trackEvent } from '@/lib/growth/growthEngine';
import { persistGrowthEvent } from '@/lib/growth/persist-event';

const BOOKING_PREFIX = '/booking';

/**
 * SPA page views + booking funnel start for ads / GA4 / Meta.
 * Loads only on client; pixels themselves are gated by AnalyticsConsent.
 */
export function GrowthTrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  useEffect(() => {
    if (pathname !== '/signup' || typeof window === 'undefined') return;
    const ref = new URL(window.location.href).searchParams.get('ref')?.trim();
    if (!ref) return;
    try {
      const k = `growth_ref_click_${ref}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
    } catch {
      return;
    }
    trackEvent(GROWTH_EVENTS.REFERRAL_CLICK, { referral_code: ref });
    void persistGrowthEvent({
      event: GROWTH_EVENTS.REFERRAL_CLICK,
      referral_code: ref,
      page_path: '/signup',
    });
  }, [pathname]);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;

    trackEvent(GROWTH_EVENTS.PAGE_VIEW, {
      page_path: pathname,
      page_location: typeof window !== 'undefined' ? window.location.href : pathname,
    });

    void persistGrowthEvent({
      event: GROWTH_EVENTS.PAGE_VIEW,
      page_path: pathname,
    });

    if (pathname.startsWith(BOOKING_PREFIX)) {
      const key = 'growth_booking_started_once';
      try {
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, '1');
          trackEvent(GROWTH_EVENTS.BOOKING_STARTED, { page_path: pathname });
          void persistGrowthEvent({
            event: GROWTH_EVENTS.BOOKING_STARTED,
            page_path: pathname,
          });
        }
      } catch {
        trackEvent(GROWTH_EVENTS.BOOKING_STARTED, { page_path: pathname });
      }
    }
  }, [pathname]);

  return <>{children}</>;
}
