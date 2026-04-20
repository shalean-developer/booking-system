/**
 * Supply automation job: evaluate slot-level shortage vs demand and invite cleaners.
 * Called from `GET /api/cron/supply-check` (every 10–15 min) with CRON_SECRET.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { ymdTodayInBusinessTz } from '@/lib/admin-dashboard-business-range';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/pricing/surge-demand-server';
import { evaluateSupplyDemand } from '@/lib/supply/supplyEngine';
import { inviteCleaners } from '@/lib/supply/inviteCleaners';
import { runSupplyActivationCheck } from '@/lib/supply/run-check';

function filterBookingRowsForArea<
  T extends { address_suburb?: string | null; address_city?: string | null },
>(rows: T[] | null, suburb: string | null, city: string | null): T[] {
  const wantSub = suburb?.trim().toLowerCase() ?? '';
  const wantCity = city?.trim().toLowerCase() ?? '';
  const out: T[] = [];
  for (const raw of rows ?? []) {
    const sub = raw.address_suburb?.trim().toLowerCase() ?? '';
    const cit = raw.address_city?.trim().toLowerCase() ?? '';
    const matchSub = wantSub && sub.includes(wantSub);
    const matchCity = wantCity && cit.includes(wantCity);
    if (!matchSub && !matchCity) continue;
    out.push(raw);
  }
  return out;
}

function hoursTeamFromSnapshot(row: {
  price_snapshot?: unknown;
  total_hours?: number | null;
  team_size?: number | null;
}): { hours: number; team_size: number } {
  const snap =
    row.price_snapshot && typeof row.price_snapshot === 'object'
      ? (row.price_snapshot as Record<string, unknown>)
      : {};
  const h = Number(snap.unified_hours ?? snap.hours ?? row.total_hours ?? 3);
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
    if (error) continue;
    for (const c of data ?? []) {
      byId.add((c as { id: string }).id);
    }
  }
  return [...byId];
}

/**
 * Hotspot areas from today’s bookings (same idea as `run-check` resolveTargetAreas).
 */
async function hotspotAreas(
  supabase: SupabaseClient,
  todayYmd: string
): Promise<Array<{ suburb: string | null; city: string | null; label: string }>> {
  const { data: rows } = await supabase
    .from('bookings')
    .select('address_suburb, address_city')
    .eq('booking_date', todayYmd)
    .in('status', [...ACTIVE_BOOKING_STATUSES]);

  const map = new Map<string, { suburb: string | null; city: string | null; n: number }>();
  for (const r of rows ?? []) {
    const suburb = (r as { address_suburb?: string }).address_suburb?.trim() || null;
    const city = (r as { address_city?: string }).address_city?.trim() || null;
    if (!suburb && !city) continue;
    const key = `${suburb ?? ''}|${city ?? ''}`;
    const cur = map.get(key) ?? { suburb, city, n: 0 };
    cur.n += 1;
    map.set(key, cur);
  }

  return [...map.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 12)
    .map((h) => ({
      suburb: h.suburb,
      city: h.city,
      label: [h.suburb, h.city].filter(Boolean).join(', ') || 'Area',
    }));
}

export type SupplyCheckJobResult = {
  date: string;
  activation: Awaited<ReturnType<typeof runSupplyActivationCheck>>;
  slotEvaluations: number;
  invitesFromSlots: number;
  samples: Array<{ area: string; shortage_hours: number; status: string }>;
};

/**
 * 1) Global activation (existing notifications).
 * 2) Per-area labour demand vs cleaner pool → optional invite when shortage_hours > 0.
 */
export async function runSupplyCheckJob(supabase: SupabaseClient): Promise<SupplyCheckJobResult> {
  const todayYmd = ymdTodayInBusinessTz();
  const activation = await runSupplyActivationCheck(supabase);

  const targets = await hotspotAreas(supabase, todayYmd);
  let slotEvaluations = 0;
  let invitesFromSlots = 0;
  const samples: Array<{ area: string; shortage_hours: number; status: string }> = [];

  const { data: allToday } = await supabase
    .from('bookings')
    .select(
      'price_snapshot, total_hours, team_size, address_suburb, address_city, booking_time'
    )
    .eq('booking_date', todayYmd)
    .in('status', [...ACTIVE_BOOKING_STATUSES]);

  for (const t of targets) {
    const areaRows = filterBookingRowsForArea(allToday, t.suburb, t.city);
    const bookings = areaRows.map((r) => hoursTeamFromSnapshot(r));

    const cleaners = await cleanerIdsInArea(supabase, t.suburb, t.city);
    const ev = evaluateSupplyDemand({
      date: todayYmd,
      time: 'day',
      area: t.label,
      bookings,
      cleaners: cleaners.map((id) => ({ id })),
      working_hours_per_slot: 4,
    });

    slotEvaluations += 1;
    samples.push({
      area: t.label,
      shortage_hours: ev.shortage_hours,
      status: ev.status,
    });

    if (ev.status === 'shortage' && ev.shortage_hours > 0.5) {
      const inv = await inviteCleaners(supabase, {
        suburb: t.suburb,
        city: t.city,
        dateYmd: todayYmd,
        time: '12:00',
        shortage_hours: ev.shortage_hours,
      });
      invitesFromSlots += inv.notified;
    }
  }

  return {
    date: todayYmd,
    activation,
    slotEvaluations,
    invitesFromSlots,
    samples,
  };
}

export type SlotSupplyInviteResult = {
  area_label: string;
  shortage_hours: number;
  status: string;
  notified: number;
};

/**
 * After a booking is created, re-evaluate labour vs supply for that suburb/city on the booking date
 * and invite cleaners when the slot shows meaningful shortage (throttled inside `inviteCleaners`).
 */
export async function runSlotSupplyInviteForArea(
  supabase: SupabaseClient,
  params: {
    suburb: string | null;
    city: string | null;
    /** Booking date YYYY-MM-DD */
    dateYmd: string;
  }
): Promise<SlotSupplyInviteResult> {
  const ymd = params.dateYmd.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    return {
      area_label: [params.suburb, params.city].filter(Boolean).join(', ') || 'Area',
      shortage_hours: 0,
      status: 'balanced',
      notified: 0,
    };
  }

  const label = [params.suburb, params.city].filter(Boolean).join(', ') || 'Area';
  const { data: rows } = await supabase
    .from('bookings')
    .select(
      'price_snapshot, total_hours, team_size, address_suburb, address_city, booking_time'
    )
    .eq('booking_date', ymd)
    .in('status', [...ACTIVE_BOOKING_STATUSES]);

  const areaRows = filterBookingRowsForArea(rows, params.suburb, params.city);
  const bookings = areaRows.map((r) =>
    hoursTeamFromSnapshot(
      r as {
        price_snapshot?: unknown;
        total_hours?: number | null;
        team_size?: number | null;
      }
    )
  );

  const cleaners = await cleanerIdsInArea(supabase, params.suburb, params.city);
  const ev = evaluateSupplyDemand({
    date: ymd,
    time: 'day',
    area: label,
    bookings,
    cleaners: cleaners.map((id) => ({ id })),
    working_hours_per_slot: 4,
  });

  let notified = 0;
  if (ev.status === 'shortage' && ev.shortage_hours > 0.5) {
    const inv = await inviteCleaners(supabase, {
      suburb: params.suburb,
      city: params.city,
      dateYmd: ymd,
      time: '12:00',
      shortage_hours: ev.shortage_hours,
    });
    notified = inv.notified;
  }

  return {
    area_label: label,
    shortage_hours: ev.shortage_hours,
    status: ev.status,
    notified,
  };
}
