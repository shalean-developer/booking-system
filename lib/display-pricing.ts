import type { PricingData } from '@/lib/pricing-db';
import { PRICING } from '@/lib/pricing';

type CoreService = 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb' | 'Carpet';

function pickService(pricing: PricingData | null | undefined, key: CoreService) {
  return pricing?.services?.[key] ?? PRICING.services[key];
}

/** Admin “Base price” column and booking “Base rate” line (ZAR). */
export function formatFromBaseZar(pricing: PricingData | null | undefined, key: CoreService): string {
  const s = pickService(pricing, key);
  return `From R${Math.round(s.base)}`;
}

/** @deprecated Prefer formatFromBaseZar for parity with admin + booking base rate */
export function formatFromBasePlusBedroom(pricing: PricingData | null | undefined, key: CoreService): string {
  const s = pickService(pricing, key);
  return `From R${Math.round(s.base + s.bedroom)}`;
}

/** Carpet marketing line: per fitted room (ZAR), aligned with `calculateFinalBookingPrice` for Carpet. */
export function formatCarpetPerRoomFrom(pricing: PricingData | null | undefined): string {
  const s = pickService(pricing, 'Carpet');
  return `From R${Math.round(s.bedroom)}/room`;
}
