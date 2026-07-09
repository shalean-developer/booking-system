'use client';

/**
 * Shown when live catalog pricing from `/api/booking/form-data` is unavailable.
 * Never use static fallback amounts — only loading or this message.
 */
export function PricingUnavailable() {
  return (
    <div
      className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600"
      role="status"
    >
      Pricing unavailable — please select details to get a quote, or try refreshing the page.
    </div>
  );
}
