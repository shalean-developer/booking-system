import type { SupabaseClient } from '@supabase/supabase-js';
import { computeBookingDurationMinutes } from '@/lib/booking-duration';
import { timeHmToMinutes } from '@/lib/booking-interval';
import {
  findFirstAvailableCleanerId,
  isCleanerFreeForInterval,
  expectedEndTimeFromDuration,
} from '@/lib/dispatch/cleaner-dispatch';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DispatchResolveOk = {
  cleanerId: string | null;
  durationMinutes: number;
  expectedEndTime: string;
};

export type DispatchResolveErr = { ok: false; error: string; status: number };

/**
 * Team jobs: no individual cleaner. Otherwise auto-assign or validate preferred cleaner with overlap rules.
 */
export async function resolveBookingCleanerAndSchedule(
  supabase: SupabaseClient,
  input: {
    requiresTeam: boolean;
    date: string;
    time: string;
    bedrooms: number;
    bathrooms: number;
    extras: string[];
    extrasQuantities?: Record<string, number>;
    addressSuburb: string;
    /** Used when suburb is empty (fallback for cleaner area matching). */
    addressCity?: string | null;
    preferredCleanerId?: string | null;
  }
): Promise<{ ok: true } & DispatchResolveOk | DispatchResolveErr> {
  const durationMinutes = computeBookingDurationMinutes({
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    extras: input.extras,
    extrasQuantities: input.extrasQuantities,
  });
  const expectedEndTime = expectedEndTimeFromDuration(input.time, durationMinutes);

  if (input.requiresTeam) {
    return {
      ok: true,
      cleanerId: null,
      durationMinutes,
      expectedEndTime,
    };
  }

  const areas: string[] = [];
  if (input.addressSuburb.trim()) areas.push(input.addressSuburb.trim());
  else if (input.addressCity?.trim()) areas.push(input.addressCity.trim());

  const startMin = timeHmToMinutes(input.time);
  const endMin = Math.min(24 * 60, startMin + durationMinutes);

  const preferred = input.preferredCleanerId?.trim();
  if (preferred && preferred !== 'manual' && UUID_RE.test(preferred)) {
    const free = await isCleanerFreeForInterval(supabase, {
      date: input.date,
      cleanerId: preferred,
      startMinutes: startMin,
      endMinutes: endMin,
    });
    if (!free) {
      return {
        ok: false,
        error: 'Selected cleaner is no longer available for this time. Choose another cleaner or time.',
        status: 409,
      };
    }
    return {
      ok: true,
      cleanerId: preferred,
      durationMinutes,
      expectedEndTime,
    };
  }

  const auto = await findFirstAvailableCleanerId(supabase, {
    date: input.date,
    startTime: input.time,
    durationMinutes,
    areas,
  });

  if (!auto) {
    return {
      ok: false,
      error:
        areas.length === 0
          ? 'Service area (suburb or city) is required to assign a cleaner.'
          : 'No cleaners available for this time and area. Try another slot or date.',
      status: areas.length === 0 ? 400 : 409,
    };
  }

  return {
    ok: true,
    cleanerId: auto,
    durationMinutes,
    expectedEndTime,
  };
}
