import type { SupabaseClient } from '@supabase/supabase-js';
import { timeHmToMinutes } from '@/lib/booking-interval';
import {
  fetchEligibleCleanersForAreas,
  groupByCleaner,
  bookingRowToIntervalMinutes,
} from '@/lib/dispatch/cleaner-dispatch';
import type { Cleaner } from '@/lib/scheduling/assignment';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RoutingBookingRow = {
  cleaner_id: string | null;
  booking_time: string;
  duration_minutes: number | null;
  expected_end_time: string | null;
  requires_team: boolean | null;
  latitude: number | null;
  longitude: number | null;
};

/** Same eligibility as dispatch overlap load, plus lat/lng for last-job routing. */
export async function loadBookingsForRoutingOverlap(
  supabase: SupabaseClient,
  date: string
): Promise<RoutingBookingRow[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'cleaner_id, booking_time, duration_minutes, expected_end_time, requires_team, latitude, longitude'
    )
    .eq('booking_date', date)
    .neq('status', 'cancelled');

  if (error) {
    console.error('[assignment-server] loadBookingsForRoutingOverlap', error);
    return [];
  }

  return (data ?? []).filter((row: RoutingBookingRow) => {
    if (row.requires_team === true) return false;
    const id = row.cleaner_id;
    if (!id || id === 'manual' || !UUID_RE.test(id)) return false;
    return true;
  });
}

export async function loadCleanersForAssignment(
  supabase: SupabaseClient,
  date: string,
  areas: string[]
): Promise<Cleaner[]> {
  const eligible = await fetchEligibleCleanersForAreas(supabase, date, areas);
  const overlapRows = await loadBookingsForRoutingOverlap(supabase, date);
  const byCleaner = groupByCleaner(overlapRows);

  return eligible.map((c) => {
    const rows = (byCleaner.get(c.id) ?? []) as RoutingBookingRow[];
    const bookings = rows.map((r) => {
      const iv = bookingRowToIntervalMinutes(r);
      return {
        start: iv.start,
        end: iv.end,
        latitude: r.latitude,
        longitude: r.longitude,
      };
    });
    const lat =
      typeof c.last_location_lat === 'number' && Number.isFinite(c.last_location_lat)
        ? c.last_location_lat
        : NaN;
    const lng =
      typeof c.last_location_lng === 'number' && Number.isFinite(c.last_location_lng)
        ? c.last_location_lng
        : NaN;

    return {
      id: c.id,
      latitude: lat,
      longitude: lng,
      bookings,
      rating: typeof c.rating === 'number' ? c.rating : undefined,
    };
  });
}

export function buildAssignmentSlot(bookingTimeHm: string, durationMinutes: number): {
  start: number;
  end: number;
} {
  const start = timeHmToMinutes(bookingTimeHm);
  const end = Math.min(24 * 60, start + Math.max(1, durationMinutes));
  return { start, end };
}
