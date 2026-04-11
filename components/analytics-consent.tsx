"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";

const CONSENT_KEY = "shalean_cookie_consent_v1";
type ConsentState = "accepted" | "declined" | null;

export function AnalyticsConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [mounted, setMounted] = useState(false);
  const [isBannerOpen, setIsBannerOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      if (saved === "accepted" || saved === "declined") {
        setConsent(saved);
      }
    } catch {
      // Ignore storage access errors (privacy mode / blocked storage)
    }

    const handleOpenSettings = () => setIsBannerOpen(true);
    window.addEventListener("open-cookie-settings", handleOpenSettings as EventListener);

    return () => {
      window.removeEventListener("open-cookie-settings", handleOpenSettings as EventListener);
    };
  }, []);

  const updateConsent = (value: Exclude<ConsentState, null>) => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // Ignore storage access errors
    }
    try {
      document.cookie = `analytics_consent=${value}; path=/; max-age=31536000; samesite=lax`;
    } catch {
      // Ignore cookie write errors
    }
    setConsent(value);
    setIsBannerOpen(false);
  };

  const shouldLoadAnalytics = consent === "accepted";
  const shouldShowBanner = mounted && (consent === null || isBannerOpen);

  return (
    <>
      {shouldLoadAnalytics && (
        <>
          <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-VV357GZWXM"
            strategy="lazyOnload"
          />
          <Script
            id="google-analytics"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-VV357GZWXM');
              `,
            }}
          />
          <Script
            src="https://analytics.ahrefs.com/analytics.js"
            data-key="03pYd6IC2yPD0CqqG1dMTg"
            strategy="lazyOnload"
          />
        </>
      )}

      {shouldShowBanner && (
        <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-700">
              We use analytics cookies to improve site performance and booking experience.
              You can accept or decline non-essential tracking.
              {" "}
              <Link href="/cookies" className="font-semibold text-slate-900 underline underline-offset-2">
                Learn more
              </Link>
              .
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => updateConsent("declined")}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={() => updateConsent("accepted")}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
