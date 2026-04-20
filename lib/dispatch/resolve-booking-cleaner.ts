import type { SupabaseClient } from '@supabase/supabase-js';
import { computeBookingDurationMinutes } from '@/lib/booking-duration';
import { isCleanerFreeForInterval, expectedEndTimeFromDuration } from '@/lib/dispatch/cleaner-dispatch';
import { calculateBookingV4 } from '@/lib/pricing/v4/calculateBookingV4';
import { dispatchBodyToV4Input } from '@/lib/pricing/v4/dispatch-input';
import {
  assignCleanersToBooking,
  AssignmentError,
  isCleanerAvailable,
  isTravelFeasible,
  validBookingGeo,
  type AssignmentSlot,
  type GeoPoint,
} from '@/lib/scheduling/assignment';
import { buildAssignmentSlot, loadCleanersForAssignment } from '@/lib/scheduling/assignment-server';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DispatchResolveOk = {
  cleanerId: string | null;
  cleanerIds: string[];
  durationMinutes: number;
  expectedEndTime: string;
};

export type DispatchResolveErr = {
  ok: false;
  error: string;
  status: number;
  /** Set when no cleaner could be assigned for supply/demand. */
  code?: 'NO_SUPPLY';
  fallback?: {
    suggestNextSlot: boolean;
    triggerAutoInvite: boolean;
  };
};

/**
 * Team jobs (Deep / Move): no per-cleaner assignment at booking time.
 * Standard/Airbnb: unified wall-clock duration + team_size; routing-aware assignment when coords exist.
 */
export async function resolveBookingCleanerAndSchedule(
  supabase: SupabaseClient,
  input: {
    date: string;
    time: string;
    bedrooms: number;
    bathrooms: number;
    extras: string[];
    extrasQuantities?: Record<string, number>;
    addressSuburb: string;
    addressCity?: string | null;
    preferredCleanerId?: string | null;
    service?: string | null;
    pricingMode?: 'basic' | 'premium' | null;
    extraRooms?: number;
    /** Job site — enables travel feasibility + distance scoring when both set. */
    bookingLocation?: GeoPoint | null;
  }
): Promise<{ ok: true } & DispatchResolveOk | DispatchResolveErr> {
  // Keep area matching consistent with `/api/cleaners/available`:
  // include suburb and city (deduped), instead of suburb-only fallback logic.
  const areas = [...new Set([input.addressSuburb.trim(), input.addressCity?.trim() ?? ''].filter(Boolean))];

  const bookingLocation = input.bookingLocation ?? null;

  const service = input.service ?? '';
  const isDeepOrMove = service === 'Deep' || service === 'Move In/Out';

  const v4In = dispatchBodyToV4Input({
    service: input.service,
    pricingMode: input.pricingMode ?? undefined,
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
    extraRooms: input.extraRooms,
    extras: input.extras,
    extrasQuantities: input.extrasQuantities,
  });

  let durationMinutes: number;
  let teamSize = 1;

  if (v4In) {
    const v4 = calculateBookingV4(v4In);
    durationMinutes = Math.max(1, Math.round(v4.duration * 60));
    teamSize = Math.max(1, v4.team_size);
    const expectedEndTime = expectedEndTimeFromDuration(input.time, durationMinutes);
    if (isDeepOrMove || service === 'Carpet') {
      return {
        ok: true,
        cleanerId: null,
        cleanerIds: [],
        durationMinutes,
        expectedEndTime,
      };
    }
  } else {
    durationMinutes = computeBookingDurationMinutes({
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      extras: input.extras,
      extrasQuantities: input.extrasQuantities,
    });
    teamSize = 1;
  }

  const expectedEndTime = expectedEndTimeFromDuration(input.time, durationMinutes);
  const slot: AssignmentSlot = buildAssignmentSlot(input.time, durationMinutes);

  const preferred = input.preferredCleanerId?.trim();
  if (preferred && preferred !== 'manual' && UUID_RE.test(preferred) && teamSize === 1) {
    if (areas.length === 0) {
      const free = await isCleanerFreeForInterval(supabase, {
        date: input.date,
        cleanerId: preferred,
        startMinutes: slot.start,
        endMinutes: slot.end,
      });
      if (!free) {
        return {
          ok: false,
          error:
            'Selected cleaner is no longer available for this time. Choose another cleaner or time.',
          status: 409,
        };
      }
      return {
        ok: true,
        cleanerId: preferred,
        cleanerIds: [preferred],
        durationMinutes,
        expectedEndTime,
      };
    }

    const cleaners = await loadCleanersForAssignment(supabase, input.date, areas);
    const c = cleaners.find((x) => x.id === preferred);
    if (!c) {
      return {
        ok: false,
        error: 'Selected cleaner does not cover this area.',
        status: 409,
      };
    }
    if (!isCleanerAvailable(c, slot, durationMinutes)) {
      return {
        ok: false,
        error:
          'Selected cleaner is no longer available for this time. Choose another cleaner or time.',
        status: 409,
      };
    }
    if (validBookingGeo(bookingLocation) && !isTravelFeasible(c, slot, bookingLocation)) {
      return {
        ok: false,
        error: 'Selected cleaner cannot reach this location in time for this slot. Try another time.',
        status: 409,
      };
    }
    return {
      ok: true,
      cleanerId: preferred,
      cleanerIds: [preferred],
      durationMinutes,
      expectedEndTime,
    };
  }

  if (areas.length === 0) {
    return {
      ok: false,
      error: 'Service area (suburb or city) is required to assign a cleaner.',
      status: 400,
    };
  }

  try {
    const cleaners = await loadCleanersForAssignment(supabase, input.date, areas);
    const assigned = assignCleanersToBooking({
      slot,
      durationMinutes,
      team_size: teamSize,
      cleaners,
      bookingLocation,
    });
    const cleanerIds = assigned.map((c) => c.id);
    return {
      ok: true,
      cleanerId: cleanerIds[0] ?? null,
      cleanerIds,
      durationMinutes,
      expectedEndTime,
    };
  } catch (e) {
    if (e instanceof AssignmentError) {
      return {
        ok: false,
        error:
          teamSize > 1
            ? 'Not enough cleaners available for this team booking. Try another slot or date.'
            : 'No cleaners available for this time and area. Try another slot or date.',
        status: 409,
        code: 'NO_SUPPLY',
        fallback: {
          suggestNextSlot: true,
          triggerAutoInvite: true,
        },
      };
    }
    throw e;
  }
}
