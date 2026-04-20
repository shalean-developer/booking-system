import type { SupabaseClient } from '@supabase/supabase-js';
import { timeHmToMinutes } from '@/lib/booking-interval';
import {
  isCleanerFreeForInterval,
  loadBookingsForOverlap,
  intervalOverlapsExisting,
} from '@/lib/dispatch/cleaner-dispatch';

export type IsCleanerFreeParams = {
  /** YYYY-MM-DD (civil date for the booking). */
  date: string;
  cleanerId: string;
  /** Wall-clock interval in minutes from midnight (same semantics as dispatch). */
  startMinutes: number;
  endMinutes: number;
  /** Exclude a booking when re-checking after reschedule. */
  excludeBookingId?: string;
};

/**
 * Returns true if the cleaner has no overlapping active bookings in the interval.
 * Uses travel-buffer overlap rules consistent with {@link isCleanerFreeForInterval}.
 */
export async function isCleanerFree(
  supabase: SupabaseClient,
  params: IsCleanerFreeParams,
): Promise<boolean> {
  return isCleanerFreeForInterval(supabase, {
    date: params.date,
    cleanerId: params.cleanerId,
    startMinutes: params.startMinutes,
    endMinutes: params.endMinutes,
  });
}

/**
 * Explicit overlap check against raw booking rows (for tests / custom windows).
 * Overlap rule: start1 < end2 AND end1 > start2 (half-open variants normalized via buffer in dispatch).
 */
export async function hasOverlappingBooking(
  supabase: SupabaseClient,
  params: {
    date: string;
    cleanerId: string;
    startMinutes: number;
    endMinutes: number;
    excludeBookingId?: string;
  },
): Promise<boolean> {
  const rows = await loadBookingsForOverlap(supabase, params.date, params.excludeBookingId);
  const mine = rows.filter((r) => r.cleaner_id === params.cleanerId);
  return intervalOverlapsExisting(params.startMinutes, params.endMinutes, mine);
}

/** Convert "HH:MM" strings to minute range for a single civil day. */
export function timeRangeToMinutes(startHm: string, endHm: string): { start: number; end: number } {
  const start = timeHmToMinutes(startHm);
  let end = timeHmToMinutes(endHm);
  if (end <= start) {
    end = Math.min(24 * 60, start + 60);
  }
  return { start, end: Math.min(24 * 60, end) };
}
