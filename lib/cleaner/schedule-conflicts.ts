import type { SupabaseClient } from '@supabase/supabase-js';

function parseTimeToMinutes(t: string | null | undefined): number {
  if (!t) return 9 * 60;
  const m = /^(\d{1,2}):(\d{2})/.exec(String(t).trim());
  if (!m) return 9 * 60;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return 9 * 60;
  return h * 60 + min;
}

function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
  bufferMin = 0
): boolean {
  return aStart < bEnd + bufferMin && bStart < aEnd + bufferMin;
}

export type BookingLike = {
  id: string;
  booking_date: string | null;
  booking_time?: string | null;
  duration_minutes?: number | null;
  price_snapshot?: unknown;
};

/**
 * Returns true if the cleaner already has another job overlapping [start, start+duration] on the same calendar day.
 */
export async function cleanerHasOverlappingBooking(
  supabase: SupabaseClient,
  cleanerId: string,
  candidate: {
    booking_date: string;
    booking_time: string;
    duration_minutes: number;
    excludeBookingId?: string;
  }
): Promise<boolean> {
  const startMin = parseTimeToMinutes(candidate.booking_time);
  const dur = Math.max(15, candidate.duration_minutes || 180);
  const endMin = startMin + dur;

  const { data: direct } = await supabase
    .from('bookings')
    .select('id, booking_date, booking_time, duration_minutes, status')
    .eq('booking_date', candidate.booking_date)
    .or(`cleaner_id.eq.${cleanerId},assigned_cleaner_id.eq.${cleanerId}`);

  const terminal = new Set(['cancelled', 'completed']);

  for (const row of direct ?? []) {
    const r = row as BookingLike & { status?: string };
    if (r.status && terminal.has(r.status)) continue;
    if (candidate.excludeBookingId && r.id === candidate.excludeBookingId) continue;
    const st = parseTimeToMinutes(r.booking_time);
    const en = st + Math.max(15, r.duration_minutes ?? 180);
    if (rangesOverlap(startMin, endMin, st, en, 0)) return true;
  }

  const { data: memberships } = await supabase
    .from('booking_team_members')
    .select('booking_team_id')
    .eq('cleaner_id', cleanerId);

  const teamIds = [...new Set((memberships ?? []).map((m) => (m as { booking_team_id: string }).booking_team_id))];
  if (teamIds.length === 0) return false;

  const { data: teams } = await supabase
    .from('booking_teams')
    .select('booking_id')
    .in('id', teamIds);

  const bookingIds = [...new Set((teams ?? []).map((t) => (t as { booking_id: string }).booking_id))];
  if (bookingIds.length === 0) return false;

  const { data: teamBookings } = await supabase
    .from('bookings')
    .select('id, booking_date, booking_time, duration_minutes, status')
    .in('id', bookingIds)
    .eq('booking_date', candidate.booking_date);

  for (const row of teamBookings ?? []) {
    const r = row as BookingLike & { status?: string };
    if (r.status && terminal.has(r.status)) continue;
    if (candidate.excludeBookingId && r.id === candidate.excludeBookingId) continue;
    const st = parseTimeToMinutes(r.booking_time);
    const en = st + Math.max(15, r.duration_minutes ?? 180);
    if (rangesOverlap(startMin, endMin, st, en, 0)) return true;
  }

  return false;
}
