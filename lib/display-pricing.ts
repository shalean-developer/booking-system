import type { PricingData } from '@/lib/pricing-db';

type CoreService = 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb' | 'Carpet';

function pickService(pricing: PricingData | null | undefined, key: CoreService) {
  return pricing?.services?.[key] ?? null;
}

/** Admin “Base price” column and booking “From …” line (ZAR). No static catalog fallback. */
export function formatFromBaseZar(pricing: PricingData | null | undefined, key: CoreService): string {
  const s = pickService(pricing, key);
  if (!s) return 'Get a quote';
  return `From R${Math.round(s.base)}`;
}

/** @deprecated Prefer formatFromBaseZar for parity with admin + booking base rate */
export function formatFromBasePlusBedroom(pricing: PricingData | null | undefined, key: CoreService): string {
  const s = pickService(pricing, key);
  if (!s) return 'Get a quote';
  return `From R${Math.round(s.base + s.bedroom)}`;
}

/** Carpet marketing line: per fitted room (ZAR), aligned with `calculateFinalBookingPrice` for Carpet. */
export function formatCarpetPerRoomFrom(pricing: PricingData | null | undefined): string {
  const s = pickService(pricing, 'Carpet');
  if (!s) return 'Get a quote';
  return `From R${Math.round(s.bedroom)}/room`;
}
