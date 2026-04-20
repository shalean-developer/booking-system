/**
 * Aggregates `bookings.price_snapshot` for the Pricing Analytics dashboard (last 30 days).
 * Fetches from Supabase; all rollups happen in code.
 */

import { unstable_cache } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

export type PricingSnapshotParsed = {
  total_price: number | null;
  hours: number | null;
  duration: number | null;
  team_size: number | null;
  effective_hourly_rate: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  carpets: number | null;
  rugs: number | null;
  extra_rooms: number | null;
};

export type PricingAnalyticsServiceRow = {
  service: string;
  bookings: number;
  revenue: number;
  avg_hours: number;
  avg_rate: number;
};

export type PricingAnalyticsTrendRow = {
  date: string;
  revenue: number;
  hourly_rate: number;
};

export type PricingAnalyticsHeatmapCell = {
  day: number;
  hour: number;
  bookings: number;
};

export type PricingAnalyticsAnomaly = {
  booking_id: string;
  service: string;
  rate: number;
  hours: number;
};

export type PricingAnalyticsResult = {
  totalRevenue: number;
  totalBookings: number;
  avgHourlyRate: number;
  avgDuration: number;
  services: PricingAnalyticsServiceRow[];
  trends: PricingAnalyticsTrendRow[];
  heatmap: PricingAnalyticsHeatmapCell[];
  anomalies: PricingAnalyticsAnomaly[];
  /** Bookings in window with a usable pricing snapshot (for footnotes). */
  snapshotCoverageCount: number;
};

function num(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Normalize `price_snapshot` JSON from DB (V4 analytics + legacy keys). */
export function parsePriceSnapshot(raw: unknown): PricingSnapshotParsed | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;

  let total_price =
    num(s.total_price) ??
    num(s.price_zar) ??
    (typeof s.total === 'number' && s.total > 1000 ? s.total / 100 : num(s.total));

  const hours = num(s.hours) ?? num(s.unified_hours) ?? null;

  const duration = num(s.duration) ?? num(s.duration_hours) ?? null;

  const team_size = num(s.team_size) ?? null;

  let effective_hourly_rate = num(s.effective_hourly_rate);
  if (effective_hourly_rate === null && total_price !== null && hours && hours > 0) {
    effective_hourly_rate = total_price / hours;
  }

  const bedrooms =
    num(s.bedrooms) ?? (s.service && typeof s.service === 'object'
      ? num((s.service as Record<string, unknown>).bedrooms)
      : null);

  const bathrooms =
    num(s.bathrooms) ?? (s.service && typeof s.service === 'object'
      ? num((s.service as Record<string, unknown>).bathrooms)
      : null);

  const carpets = num(s.carpets);
  const rugs = num(s.rugs);
  const extra_rooms = num(s.extra_rooms);

  if (total_price === null && typeof s.total_amount_cents === 'number') {
    total_price = s.total_amount_cents / 100;
  }

  return {
    total_price,
    hours,
    duration,
    team_size,
    effective_hourly_rate,
    bedrooms,
    bathrooms,
    carpets,
    rugs,
    extra_rooms,
  };
}

function parseBookingTimeHour(bookingTime: string | null | undefined): number | null {
  if (!bookingTime || typeof bookingTime !== 'string') return null;
  const m = bookingTime.trim().match(/^(\d{1,2})/);
  if (!m) return null;
  const h = Number(m[1]);
  if (!Number.isFinite(h) || h < 0 || h > 23) return null;
  return h;
}

/** Monday = 0 … Sunday = 6 */
function dayIndexMondayFirst(bookingDateYmd: string): number | null {
  if (!bookingDateYmd || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDateYmd)) return null;
  const [y, mo, d] = bookingDateYmd.split('-').map(Number);
  const dt = new Date(y, mo - 1, d);
  const sun0 = dt.getDay();
  return (sun0 + 6) % 7;
}

type BookingRow = {
  id: string;
  created_at: string;
  service_type: string | null;
  price_snapshot: unknown;
  booking_date: string;
  booking_time: string;
};

function aggregate(rows: BookingRow[]): PricingAnalyticsResult {
  let totalRevenue = 0;
  let totalBookings = rows.length;
  let snapshotCoverageCount = 0;

  let sumWeightedRate = 0;
  let sumHoursForRate = 0;
  let sumDuration = 0;
  let countDuration = 0;

  const byService = new Map<
    string,
    { revenue: number; bookings: number; sumHours: number; nHours: number; sumRate: number; nRate: number }
  >();

  const byDate = new Map<string, { revenue: number; sumWeighted: number; sumH: number }>();

  const heatCounts = new Map<string, number>();

  const anomalies: PricingAnalyticsAnomaly[] = [];

  for (const row of rows) {
    const snap = parsePriceSnapshot(row.price_snapshot);
    const service = (row.service_type ?? 'Unknown').trim() || 'Unknown';

    if (snap && (snap.total_price !== null || snap.hours !== null)) {
      snapshotCoverageCount += 1;
    }

    if (snap != null && snap.total_price != null && snap.total_price > 0) {
      totalRevenue += snap.total_price;
    }

    const hours = snap != null ? snap.hours : null;
    const rate = snap != null ? snap.effective_hourly_rate : null;

    if (hours !== null && hours > 0 && rate !== null && Number.isFinite(rate)) {
      sumWeightedRate += rate * hours;
      sumHoursForRate += hours;
    } else if (rate !== null && Number.isFinite(rate)) {
      sumWeightedRate += rate;
      sumHoursForRate += 1;
    }

    if (snap != null && snap.duration != null && snap.duration > 0) {
      sumDuration += snap.duration;
      countDuration += 1;
    } else if (
      hours !== null &&
      hours > 0 &&
      snap != null &&
      snap.team_size != null &&
      snap.team_size > 0
    ) {
      sumDuration += hours / snap.team_size;
      countDuration += 1;
    }

    {
      const cur =
        byService.get(service) ?? {
          revenue: 0,
          bookings: 0,
          sumHours: 0,
          nHours: 0,
          sumRate: 0,
          nRate: 0,
        };
      cur.bookings += 1;
      if (snap != null && snap.total_price != null && snap.total_price > 0) {
        cur.revenue += snap.total_price;
      }
      if (hours !== null && hours > 0) {
        cur.sumHours += hours;
        cur.nHours += 1;
      }
      if (rate !== null && Number.isFinite(rate)) {
        cur.sumRate += rate;
        cur.nRate += 1;
      }
      byService.set(service, cur);
    }

    const createdDay = row.created_at?.slice(0, 10);
    if (createdDay && snap != null && snap.total_price != null && snap.total_price > 0) {
      const agg = byDate.get(createdDay) ?? { revenue: 0, sumWeighted: 0, sumH: 0 };
      agg.revenue += snap.total_price;
      if (hours !== null && hours > 0 && rate !== null && Number.isFinite(rate)) {
        agg.sumWeighted += rate * hours;
        agg.sumH += hours;
      }
      byDate.set(createdDay, agg);
    }

    const dow = dayIndexMondayFirst(row.booking_date);
    const hr = parseBookingTimeHour(row.booking_time);
    if (dow !== null && hr !== null && hr >= 6 && hr <= 18) {
      const key = `${dow}:${hr}`;
      heatCounts.set(key, (heatCounts.get(key) ?? 0) + 1);
    }

    const effRate =
      rate ??
      (snap != null && snap.total_price != null && hours !== null && hours > 0
        ? snap.total_price / hours
        : null);
    if (effRate !== null && hours !== null && hours > 0) {
      if (effRate < 120 || effRate > 600) {
        anomalies.push({
          booking_id: row.id,
          service,
          rate: Math.round(effRate * 100) / 100,
          hours: Math.round(hours * 100) / 100,
        });
      }
    }
  }

  const avgHourlyRate = sumHoursForRate > 0 ? sumWeightedRate / sumHoursForRate : 0;
  const avgDuration = countDuration > 0 ? sumDuration / countDuration : 0;

  const services: PricingAnalyticsServiceRow[] = Array.from(byService.entries())
    .map(([service, v]) => {
      const avg_hours = v.nHours > 0 ? v.sumHours / v.nHours : 0;
      const avg_rate = v.nRate > 0 ? v.sumRate / v.nRate : 0;
      return {
        service,
        bookings: v.bookings,
        revenue: Math.round(v.revenue * 100) / 100,
        avg_hours: Math.round(avg_hours * 100) / 100,
        avg_rate: Math.round(avg_rate * 100) / 100,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const trends: PricingAnalyticsTrendRow[] = [];
  const anchor = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(
      Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - 29 + i)
    );
    const date = d.toISOString().slice(0, 10);
    const a = byDate.get(date);
    const revenue = a?.revenue ?? 0;
    const hourly_rate =
      a && a.sumH > 0 ? Math.round((a.sumWeighted / a.sumH) * 100) / 100 : 0;
    trends.push({ date, revenue, hourly_rate });
  }

  const heatmap: PricingAnalyticsHeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 6; hour <= 18; hour++) {
      heatmap.push({
        day,
        hour,
        bookings: heatCounts.get(`${day}:${hour}`) ?? 0,
      });
    }
  }

  anomalies.sort((a, b) => Math.abs(b.rate - 360) - Math.abs(a.rate - 360));

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalBookings,
    avgHourlyRate: Math.round(avgHourlyRate * 100) / 100,
    avgDuration: Math.round(avgDuration * 100) / 100,
    services,
    trends,
    heatmap,
    anomalies: anomalies.slice(0, 100),
    snapshotCoverageCount,
  };
}

async function fetchBookingsForAnalytics(supabase: SupabaseClient): Promise<BookingRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data, error } = await supabase
    .from('bookings')
    .select('id, created_at, service_type, price_snapshot, booking_date, booking_time')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getPricingAnalytics]', error);
    throw new Error(error.message);
  }

  return (data ?? []) as BookingRow[];
}

async function computePricingAnalytics(): Promise<PricingAnalyticsResult> {
  let supabase: SupabaseClient;
  try {
    supabase = createServiceClient();
  } catch {
    supabase = await createClient();
  }

  const rows = await fetchBookingsForAnalytics(supabase);
  return aggregate(rows);
}

/**
 * Cached 60s — admin layout is `force-dynamic`, so page-level `revalidate` may not apply;
 * this cache still reduces load on repeated visits.
 */
export const getPricingAnalytics = unstable_cache(
  computePricingAnalytics,
  ['pricing-analytics-v1'],
  { revalidate: 60 }
);
