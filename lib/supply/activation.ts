/**
 * Supply-side activation: detect shortage vs cleaner availability and rank candidate cleaners.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { dayOfWeekFromIsoDate } from '@/lib/dispatch/cleaner-dispatch';
import type { Database } from '@/types/database';
import { ACTIVE_BOOKING_STATUSES } from '@/lib/pricing/surge-demand-server';

export type CleanerRow = Database['public']['Tables']['cleaners']['Row'];

export type ShortageLevel = 'none' | 'medium' | 'high';

const DAY_COLS = [
  'available_sunday',
  'available_monday',
  'available_tuesday',
  'available_wednesday',
  'available_thursday',
  'available_friday',
  'available_saturday',
] as const;

export function computeDemandRatio(bookings: number, availableCleaners: number): number {
  const ac = Math.max(1, Math.floor(availableCleaners) || 0);
  const b = Math.max(0, Number(bookings) || 0);
  return b / ac;
}

/**
 * demandRatio = bookings / max(availableCleaners, 1)
 */
export function detectSupplyShortage(input: {
  bookings: number;
  availableCleaners: number;
}): ShortageLevel {
  const r = computeDemandRatio(input.bookings, input.availableCleaners);
  if (r > 1.5) return 'high';
  if (r > 1.2) return 'medium';
  return 'none';
}

/** Higher = better match to service area (suburb preferred over city). */
export function areaProximityScore(
  cleaner: CleanerRow,
  suburb: string | null | undefined,
  city: string | null | undefined,
): number {
  const areas = (cleaner.areas ?? []).map((a) => String(a).trim().toLowerCase()).filter(Boolean);
  const sub = suburb?.trim().toLowerCase();
  const cit = city?.trim().toLowerCase();
  if (sub && areas.some((a) => a === sub || a.includes(sub) || sub.includes(a))) return 3;
  if (cit && areas.some((a) => a === cit || a.includes(cit) || cit.includes(a))) return 2;
  if (sub && areas.some((a) => a.split(/\s+/).some((w) => sub.includes(w) && w.length > 3))) return 1;
  return 0;
}

function isInactiveToday(cleaner: CleanerRow, dateYmd: string): boolean {
  const dow = dayOfWeekFromIsoDate(dateYmd);
  const col = DAY_COLS[dow];
  return cleaner[col] !== true;
}

/**
 * Fetch active cleaners whose `areas` include any of the labels; count workload today; rank for outreach.
 */
export async function fetchAndRankSupplyCandidates(
  supabase: SupabaseClient,
  params: {
    dateYmd: string;
    suburb: string | null;
    city: string | null;
    limit: number;
  },
): Promise<
  Array<{
    cleaner: CleanerRow;
    workloadToday: number;
    proximity: number;
    inactiveToday: boolean;
  }>
> {
  const labels = [...new Set([params.suburb, params.city].map((s) => s?.trim()).filter(Boolean))] as string[];
  if (labels.length === 0) return [];

  const byId = new Map<string, CleanerRow>();
  for (const label of labels) {
    const { data, error } = await supabase
      .from('cleaners')
      .select('*')
      .contains('areas', [label])
      .eq('is_active', true);
    if (error) {
      console.error('[supply] cleaners query', error);
      continue;
    }
    for (const c of data ?? []) {
      byId.set(c.id, c as CleanerRow);
    }
  }

  const cleaners = Array.from(byId.values());
  if (cleaners.length === 0) return [];

  const ids = cleaners.map((c) => c.id);
  const idSet = new Set(ids);
  const { data: bookingRows } = await supabase
    .from('bookings')
    .select('cleaner_id, assigned_cleaner_id')
    .eq('booking_date', params.dateYmd)
    .in('status', [...ACTIVE_BOOKING_STATUSES]);

  const workload = new Map<string, number>();
  for (const id of ids) workload.set(id, 0);
  for (const row of bookingRows ?? []) {
    const cid =
      (row.cleaner_id as string | null) || (row.assigned_cleaner_id as string | null);
    if (!cid || !idSet.has(cid)) continue;
    workload.set(cid, (workload.get(cid) ?? 0) + 1);
  }

  const enriched = cleaners.map((cleaner) => {
    const wl = workload.get(cleaner.id) ?? 0;
    const proximity = areaProximityScore(cleaner, params.suburb, params.city);
    const inactiveToday = isInactiveToday(cleaner, params.dateYmd);
    return { cleaner, workloadToday: wl, proximity, inactiveToday };
  });

  enriched.sort((a, b) => {
    if (b.proximity !== a.proximity) return b.proximity - a.proximity;
    if (a.workloadToday !== b.workloadToday) return a.workloadToday - b.workloadToday;
    const ar = a.inactiveToday === b.inactiveToday ? 0 : a.inactiveToday ? 1 : -1;
    if (ar !== 0) return -ar;
    const rc = (b.cleaner.completion_rate ?? 0) - (a.cleaner.completion_rate ?? 0);
    if (rc !== 0) return rc;
    return (b.cleaner.rating ?? 0) - (a.cleaner.rating ?? 0);
  });

  return enriched.slice(0, params.limit);
}
