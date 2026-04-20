/**
 * Consistent V4 analytics fields for `bookings.price_snapshot` (JSON).
 */

import type { UnifiedPricingSnapshot } from '@/lib/pricing/booking-price-types';

export type PriceSnapshotV4Analytics = {
  service_type: string;
  bedrooms: number;
  bathrooms: number;
  carpets: number | null;
  rugs: number | null;
  extra_rooms: number;
  table_price: number;
  extras_total: number;
  total_price: number;
  hours: number;
  duration: number;
  team_size: number;
  effective_hourly_rate: number;
};

export function buildPriceSnapshotV4Analytics(
  params: Omit<PriceSnapshotV4Analytics, 'effective_hourly_rate'> & {
    effective_hourly_rate?: number;
  }
): PriceSnapshotV4Analytics {
  const h = Math.max(1e-9, params.hours);
  const effective_hourly_rate =
    params.effective_hourly_rate ?? params.total_price / h;
  return {
    ...params,
    effective_hourly_rate,
  };
}

export function buildPriceSnapshotV4AnalyticsFromUnified(
  body: {
    service?: string;
    bedrooms?: number;
    bathrooms?: number;
    extraRooms?: number;
    pricingMode?: string;
    rugs?: number;
    carpets?: number;
  },
  unifiedSnap: UnifiedPricingSnapshot | null | undefined,
  serviceTotalZar: number
): PriceSnapshotV4Analytics | null {
  if (!unifiedSnap) return null;
  const st = body.service ?? '';
  const isCarpet = st === 'Carpet';
  return buildPriceSnapshotV4Analytics({
    service_type: st,
    bedrooms: body.bedrooms ?? 0,
    bathrooms: body.bathrooms ?? 0,
    carpets: isCarpet ? (body.carpets ?? body.bedrooms ?? null) : null,
    rugs: isCarpet ? (body.rugs ?? body.bathrooms ?? null) : null,
    extra_rooms: body.extraRooms ?? 0,
    table_price: unifiedSnap.table_price_zar,
    extras_total: unifiedSnap.extras_price_zar,
    total_price: serviceTotalZar,
    hours: unifiedSnap.hours,
    duration: unifiedSnap.duration,
    team_size: unifiedSnap.team_size,
  });
}
