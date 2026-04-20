import type { SupabaseClient } from '@supabase/supabase-js';
import {
  timeHmToMinutes,
  intervalsOverlapMinutes,
  intervalsOverlapWithTravelBuffer,
  BUFFER_MINUTES,
  addMinutesToTimeHm,
} from '@/lib/booking-interval';
import { STANDARD_BOOKING_TIME_IDS } from '@/lib/booking-time-slots';
import type { Database } from '@/types/database';

type CleanerRow = Database['public']['Tables']['cleaners']['Row'];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Max scheduled minutes per cleaner per day (dispatch assignment + slot capacity). */
export const MAX_MINUTES_PER_DAY = 8 * 60;

export { BUFFER_MINUTES };

/** Sum of scheduled job length for a cleaner on a given day (for load balancing). */
export function calculateCleanerLoad(
  bookings: Array<{
    booking_time: string;
    duration_minutes: number | null;
    expected_end_time: string | null;
  }>
): number {
  return bookings.reduce((total, b) => {
    if (b.duration_minutes != null && b.duration_minutes > 0) {
      return total + b.duration_minutes;
    }
    const iv = bookingRowToIntervalMinutes(b);
    return total + Math.max(0, iv.end - iv.start);
  }, 0);
}

const DAY_COLS = [
  'available_sunday',
  'available_monday',
  'available_tuesday',
  'available_wednesday',
  'available_thursday',
  'available_friday',
  'available_saturday',
] as const;

/** 0=Sun … 6=Sat for YYYY-MM-DD as a civil date (avoids host timezone shifting the weekday). */
export function dayOfWeekFromIsoDate(date: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (!m) return new Date(`${date.trim()}T12:00:00`).getDay();
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10) - 1;
  const d = parseInt(m[3], 10);
  return new Date(Date.UTC(y, mo, d)).getUTCDay();
}

export function checkCleanerDay(cleaner: CleanerRow, date: string): boolean {
  const dow = dayOfWeekFromIsoDate(date);
  const col = DAY_COLS[dow];
  return Boolean(cleaner[col]);
}

export function bookingRowToIntervalMinutes(row: {
  booking_time: string;
  duration_minutes: number | null;
  expected_end_time: string | null;
}): { start: number; end: number } {
  const start = timeHmToMinutes(row.booking_time);
  let end: number;
  if (row.duration_minutes != null && row.duration_minutes > 0) {
    end = start + row.duration_minutes;
  } else if (row.expected_end_time) {
    end = timeHmToMinutes(row.expected_end_time);
    if (end <= start) end = start + 180;
  } else {
    end = start + 180;
  }
  const cap = 24 * 60;
  if (end > cap) end = cap;
  if (end <= start) end = Math.min(cap, start + 60);
  return { start, end };
}

export async function fetchEligibleCleanersForAreas(
  supabase: SupabaseClient,
  date: string,
  areas: string[],
  options?: { skipDayFilter?: boolean }
): Promise<CleanerRow[]> {
  const areaList = [...new Set(areas.map((a) => a.trim()).filter(Boolean))];
  if (areaList.length === 0) return [];

  const dayOfWeek = dayOfWeekFromIsoDate(date);
  const dayColumn = DAY_COLS[dayOfWeek];

  const cleanerById = new Map<string, CleanerRow>();

  for (const area of areaList) {
    for (const column of ['areas', 'working_areas'] as const) {
      let q = supabase
        .from('cleaners')
        .select('*')
        .contains(column, [area])
        .eq('is_active', true)
        .eq('is_available', true);
      if (!options?.skipDayFilter) {
        q = q.eq(dayColumn, true);
      }
      const { data: batch, error } = await q;

      if (error) {
        if (column === 'working_areas') {
          console.warn('[dispatch] working_areas query (column may be missing pre-migration):', error.message);
        } else {
          console.error('[dispatch] cleaners query', error);
        }
        continue;
      }
      for (const c of batch || []) {
        cleanerById.set(c.id, c);
      }
    }
  }

  return Array.from(cleanerById.values()).sort((a, b) => {
    const ratingB = b.rating ?? 0;
    const ratingA = a.rating ?? 0;
    if (ratingB !== ratingA) return ratingB - ratingA;
    const crB = b.completion_rate ?? 0;
    const crA = a.completion_rate ?? 0;
    return crB - crA;
  });
}

export async function loadBookingsForOverlap(
  supabase: SupabaseClient,
  date: string,
  excludeBookingId?: string
): Promise<
  Array<{
    cleaner_id: string | null;
    booking_time: string;
    duration_minutes: number | null;
    expected_end_time: string | null;
    requires_team: boolean | null;
  }>
> {
  let q = supabase
    .from('bookings')
    .select('cleaner_id, booking_time, duration_minutes, expected_end_time, requires_team')
    .eq('booking_date', date)
    .neq('status', 'cancelled');
  if (excludeBookingId) {
    q = q.neq('id', excludeBookingId);
  }
  const { data, error } = await q;

  if (error) {
    console.error('[dispatch] loadBookingsForOverlap', error);
    return [];
  }
  return (data ?? []).filter((row) => {
    if (row.requires_team === true) return false;
    const id = row.cleaner_id;
    if (!id || id === 'manual' || !UUID_RE.test(id)) return false;
    return true;
  });
}

export function groupByCleaner(
  rows: Array<{
    cleaner_id: string | null;
    booking_time: string;
    duration_minutes: number | null;
    expected_end_time: string | null;
  }>
): Map<string, typeof rows> {
  const m = new Map<string, typeof rows>();
  for (const row of rows) {
    const id = row.cleaner_id;
    if (!id) continue;
    const list = m.get(id) ?? [];
    list.push(row);
    m.set(id, list);
  }
  return m;
}

/** Plain interval overlap (no travel buffer) — for debug attribution vs buffer-only conflicts. */
export function intervalOverlapsExistingRaw(
  newStart: number,
  newEnd: number,
  existingRows: Array<{
    booking_time: string;
    duration_minutes: number | null;
    expected_end_time: string | null;
  }>
): boolean {
  for (const row of existingRows) {
    const iv = bookingRowToIntervalMinutes(row);
    if (intervalsOverlapMinutes(newStart, newEnd, iv.start, iv.end)) {
      return true;
    }
  }
  return false;
}

export function intervalOverlapsExisting(
  newStart: number,
  newEnd: number,
  existingRows: Array<{
    booking_time: string;
    duration_minutes: number | null;
    expected_end_time: string | null;
  }>
): boolean {
  for (const row of existingRows) {
    const iv = bookingRowToIntervalMinutes(row);
    if (intervalsOverlapWithTravelBuffer(newStart, newEnd, iv.start, iv.end, BUFFER_MINUTES)) {
      return true;
    }
  }
  return false;
}

export async function isCleanerFreeForInterval(
  supabase: SupabaseClient,
  params: {
    date: string;
    cleanerId: string;
    startMinutes: number;
    endMinutes: number;
  }
): Promise<boolean> {
  const rows = await loadBookingsForOverlap(supabase, params.date);
  const mine = rows.filter((r) => r.cleaner_id === params.cleanerId);
  const load = calculateCleanerLoad(mine);
  const newDuration = params.endMinutes - params.startMinutes;
  if (load + newDuration > MAX_MINUTES_PER_DAY) {
    return false;
  }
  return !intervalOverlapsExisting(params.startMinutes, params.endMinutes, mine);
}

function sortCleanersByLoadThenRating(a: CleanerRow, b: CleanerRow, loadA: number, loadB: number): number {
  if (loadA !== loadB) return loadA - loadB;
  const ratingB = b.rating ?? 0;
  const ratingA = a.rating ?? 0;
  if (ratingB !== ratingA) return ratingB - ratingA;
  const crB = b.completion_rate ?? 0;
  const crA = a.completion_rate ?? 0;
  return crB - crA;
}

export async function findFirstAvailableCleanerId(
  supabase: SupabaseClient,
  params: {
    date: string;
    startTime: string;
    durationMinutes: number;
    areas: string[];
    /** Cleaners that must not be selected (e.g. current assignee during reassignment). */
    excludeCleanerIds?: string[];
  }
): Promise<string | null> {
  const eligible = await fetchEligibleCleanersForAreas(supabase, params.date, params.areas);
  if (eligible.length === 0) return null;

  const exclude = new Set((params.excludeCleanerIds ?? []).filter(Boolean));

  const startMin = timeHmToMinutes(params.startTime);
  const endMin = Math.min(24 * 60, startMin + params.durationMinutes);

  const allRows = await loadBookingsForOverlap(supabase, params.date);
  const byCleaner = groupByCleaner(allRows);

  const candidates: { cleaner: CleanerRow; load: number }[] = [];
  for (const c of eligible) {
    if (exclude.has(c.id)) continue;
    const existing = byCleaner.get(c.id) ?? [];
    const load = calculateCleanerLoad(existing);
    if (load + params.durationMinutes > MAX_MINUTES_PER_DAY) {
      continue;
    }
    if (intervalOverlapsExisting(startMin, endMin, existing)) {
      continue;
    }
    candidates.push({ cleaner: c, load });
  }

  if (candidates.length === 0) return null;

  for (const { cleaner, load } of candidates) {
    console.log('[dispatch] Cleaner load:', cleaner.id, load);
  }

  candidates.sort((x, y) => sortCleanersByLoadThenRating(x.cleaner, y.cleaner, x.load, y.load));
  const chosen = candidates[0]!;
  console.log('[dispatch] Assigned cleaner:', chosen.cleaner.id);
  return chosen.cleaner.id;
}

/**
 * Per standard start slot: how many dispatch-eligible cleaners can take a job of
 * `durationMinutes` at that start (same rules as {@link findFirstAvailableCleanerId} /
 * {@link listAvailableCleanersForBooking} — daily load cap + travel-buffer overlap).
 */
export async function assignableCleanersPerDispatchSlots(
  supabase: SupabaseClient,
  params: {
    date: string;
    durationMinutes: number;
    /** Cleaners to score per slot (area-eligible; may include off-day rows when debugging pipeline). */
    eligible: CleanerRow[];
    debug?: boolean;
  }
): Promise<Record<string, number>> {
  if (params.eligible.length === 0) {
    const empty: Record<string, number> = {};
    for (const slotId of STANDARD_BOOKING_TIME_IDS) empty[slotId] = 0;
    return empty;
  }

  const allRows = await loadBookingsForOverlap(supabase, params.date);
  const byCleaner = groupByCleaner(allRows);
  const out: Record<string, number> = {};

  for (const slotId of STANDARD_BOOKING_TIME_IDS) {
    const startMin = timeHmToMinutes(slotId);
    const endMin = Math.min(24 * 60, startMin + params.durationMinutes);

    if (params.debug) {
      console.log(`\n[slot] ${slotId}`);
    }

    const cleaners = params.eligible;
    const total = cleaners.length;
    let afterDayFilter = 0;
    let afterLoad = 0;
    let removedByRawOverlap = 0;
    let removedByBufferOnly = 0;
    let finalAssignable = 0;

    for (const c of cleaners) {
      const existing = byCleaner.get(c.id) ?? [];

      if (!checkCleanerDay(c, params.date)) continue;
      afterDayFilter++;

      const load = calculateCleanerLoad(existing);
      if (load + params.durationMinutes > MAX_MINUTES_PER_DAY) continue;
      afterLoad++;

      if (intervalOverlapsExistingRaw(startMin, endMin, existing)) {
        removedByRawOverlap++;
        continue;
      }
      if (intervalOverlapsExisting(startMin, endMin, existing)) {
        removedByBufferOnly++;
        continue;
      }
      finalAssignable++;
    }

    if (params.debug) {
      console.log('[slot-debug]', {
        slot: slotId,
        total,
        afterDayFilter,
        afterLoad,
        removedByRawOverlap,
        removedByBufferOnly,
        afterOverlap: finalAssignable,
        finalAssignable,
      });
    }

    out[slotId] = finalAssignable;
  }

  return out;
}

export function expectedEndTimeFromDuration(startTime: string, durationMinutes: number): string {
  return addMinutesToTimeHm(startTime, durationMinutes);
}

const MAX_UI_CLEANERS = 8;

/** All non-overlapping cleaners for customer picker (load-balanced order, then rating). */
export async function listAvailableCleanersForBooking(
  supabase: SupabaseClient,
  params: {
    date: string;
    areas: string[];
    startTime: string;
    durationMinutes: number;
    excludeBookingId?: string;
  }
): Promise<CleanerRow[]> {
  const eligible = await fetchEligibleCleanersForAreas(supabase, params.date, params.areas);
  const startMin = timeHmToMinutes(params.startTime);
  const endMin = Math.min(24 * 60, startMin + params.durationMinutes);
  const allRows = await loadBookingsForOverlap(supabase, params.date, params.excludeBookingId);
  const byCleaner = groupByCleaner(allRows);
  const candidates: { cleaner: CleanerRow; load: number }[] = [];
  for (const c of eligible) {
    const existing = byCleaner.get(c.id) ?? [];
    const load = calculateCleanerLoad(existing);
    if (load + params.durationMinutes > MAX_MINUTES_PER_DAY) {
      continue;
    }
    if (intervalOverlapsExisting(startMin, endMin, existing)) {
      continue;
    }
    candidates.push({ cleaner: c, load });
  }
  candidates.sort((x, y) => sortCleanersByLoadThenRating(x.cleaner, y.cleaner, x.load, y.load));
  const out = candidates.map((x) => x.cleaner);
  if (process.env.NODE_ENV !== 'production' && out.length > 0) {
    console.log(
      '[dispatch] listAvailableCleaners: first',
      out[0]!.id,
      'load:',
      candidates[0]!.load,
      'count:',
      out.length
    );
  }
  return out.slice(0, MAX_UI_CLEANERS);
}
