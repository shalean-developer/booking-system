/**
 * Admin “Supply status” table — aggregates today’s bookings vs area cleaner pool.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/pricing/surge-demand-server';
import { evaluateSupplyDemand, type SupplyBookingInput } from '@/lib/supply/supplyEngine';

export type SupplyStatusRow = {
  time: string;
  area: string;
  demand_hours: number;
  supply_hours: number;
  shortage_hours: number;
  status: 'balanced' | 'shortage' | 'oversupply';
  available_cleaners: number;
  required_cleaners: number;
};

function hourBucketLabel(bookingTime: string): string {
  const m = /^(\d{1,2})/.exec(String(bookingTime).trim());
  const h = m ? Number(m[1]) : 12;
  if (!Number.isFinite(h)) return 'Day';
  if (h < 11) return '06:00–11:00';
  if (h < 15) return '11:00–15:00';
  if (h < 19) return '15:00–19:00';
  return '19:00–22:00';
}

function hoursTeamFromSnapshot(row: {
  price_snapshot?: unknown;
  total_hours?: number | null;
  team_size?: number | null;
}): SupplyBookingInput {
  const snap =
    row.price_snapshot && typeof row.price_snapshot === 'object'
      ? (row.price_snapshot as Record<string, unknown>)
      : {};
  const h = Number(
    snap.unified_hours ?? snap.hours ?? row.total_hours ?? 3
  );
  const ts = Number(snap.team_size ?? row.team_size ?? 1);
  return {
    hours: Math.max(0.25, Number.isFinite(h) ? h : 3),
    team_size: Math.max(1, Number.isFinite(ts) ? Math.floor(ts) : 1),
  };
}

async function cleanerIdsInArea(
  supabase: SupabaseClient,
  suburb: string | null,
  city: string | null
): Promise<string[]> {
  const labels = [...new Set([suburb, city].map((s) => s?.trim()).filter(Boolean))] as string[];
  if (labels.length === 0) return [];
  const byId = new Set<string>();
  for (const label of labels) {
    const { data, error } = await supabase
      .from('cleaners')
      .select('id')
      .contains('areas', [label])
      .eq('is_active', true)
      .eq('is_available', true);
    if (error) {
      console.error('[supply-status] cleaners', error);
      continue;
    }
    for (const c of data ?? []) {
      byId.add((c as { id: string }).id);
    }
  }
  return [...byId];
}

/**
 * Rows for admin table: grouped by area + time-of-day bucket.
 */
export async function fetchSupplyStatusRows(
  supabase: SupabaseClient,
  dateYmd: string
): Promise<SupplyStatusRow[]> {
  const { data: rows, error } = await supabase
    .from('bookings')
    .select(
      'booking_time, address_suburb, address_city, price_snapshot, total_hours, team_size'
    )
    .eq('booking_date', dateYmd.slice(0, 10))
    .in('status', [...ACTIVE_BOOKING_STATUSES]);

  if (error) {
    console.error('[supply-status]', error);
    return [];
  }

  type GroupKey = string;
  const groups = new Map<
    GroupKey,
    { suburb: string | null; city: string | null; bucket: string; bookings: SupplyBookingInput[] }
  >();

  for (const raw of rows ?? []) {
    const r = raw as {
      booking_time?: string;
      address_suburb?: string | null;
      address_city?: string | null;
      price_snapshot?: unknown;
      total_hours?: number | null;
      team_size?: number | null;
    };
    const suburb = r.address_suburb?.trim() || null;
    const city = r.address_city?.trim() || null;
    if (!suburb && !city) continue;
    const bucket = hourBucketLabel(r.booking_time ?? '10:00');
    const key = `${suburb ?? ''}|${city ?? ''}|${bucket}`;
    const cur = groups.get(key) ?? {
      suburb,
      city,
      bucket,
      bookings: [],
    };
    cur.bookings.push(hoursTeamFromSnapshot(r));
    groups.set(key, cur);
  }

  const out: SupplyStatusRow[] = [];

  for (const g of groups.values()) {
    const cleaners = await cleanerIdsInArea(supabase, g.suburb, g.city);
    const ev = evaluateSupplyDemand({
      date: dateYmd,
      time: g.bucket,
      area: [g.suburb, g.city].filter(Boolean).join(', ') || '—',
      bookings: g.bookings,
      cleaners: cleaners.map((id) => ({ id })),
      working_hours_per_slot: 4,
    });

    out.push({
      time: g.bucket,
      area: [g.suburb, g.city].filter(Boolean).join(', ') || '—',
      demand_hours: ev.demand_hours,
      supply_hours: ev.supply_hours,
      shortage_hours: ev.shortage_hours,
      status: ev.status,
      available_cleaners: ev.available_cleaners,
      required_cleaners: ev.required_cleaners,
    });
  }

  out.sort((a, b) => a.area.localeCompare(b.area) || a.time.localeCompare(b.time));
  return out;
}
