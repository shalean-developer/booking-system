import type { PricingData } from '@/lib/pricing-db';

/** Catalogue extra unit price (ZAR) — shared by final pricing for Carpet / Deep / Move lines. */
export function resolveExtraUnitPrice(pricing: PricingData, extraName: string): number {
  const normalized = extraName.trim();
  let unit = pricing.extras[normalized] ?? 0;
  if (unit === 0) {
    const key = Object.keys(pricing.extras).find(
      (k) => k.toLowerCase().trim() === normalized.toLowerCase()
    );
    if (key) unit = pricing.extras[key] ?? 0;
  }
  if (unit === 0) {
    const normalizeToken = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
    const wanted = normalizeToken(normalized);
    const key = Object.keys(pricing.extras).find((k) => normalizeToken(k) === wanted);
    if (key) unit = pricing.extras[key] ?? 0;
  }
  return unit;
}
