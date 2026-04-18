import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  STANDARD_BOOKING_TIME_IDS,
  normalizeBookingTimeToSlotId,
  MAX_BOOKINGS_PER_TIME_SLOT,
} from '@/lib/booking-time-slots';
import { computeBookingDurationMinutes } from '@/lib/booking-duration';
import {
  fetchEligibleCleanersForAreas,
  assignableCleanersPerDispatchSlots,
  checkCleanerDay,
} from '@/lib/dispatch/cleaner-dispatch';

export const dynamic = 'force-dynamic';

function parseJsonArray(param: string | null): string[] {
  if (!param?.trim()) return [];
  try {
    const v = JSON.parse(param) as unknown;
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function parseQuantities(param: string | null): Record<string, number> {
  if (!param?.trim()) return {};
  try {
    const v = JSON.parse(param) as unknown;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const out: Record<string, number> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if (typeof val === 'number' && Number.isFinite(val)) out[k] = val;
      }
      return out;
    }
    return {};
  } catch {
    return {};
  }
}

/**
 * GET /api/bookings/slot-occupancy?date=YYYY-MM-DD&suburb=...&city=...
 * Optional: duration_minutes, bedrooms, bathrooms, extras (JSON), extras_quantities (JSON)
 * Verbose server logs + `debug: true` in JSON: add `debug=1` (dispatch mode only).
 *
 * With suburb: remaining[slot] = count of dispatch-eligible cleaners who can take this job
 * (eligible cleaners = union of matches for suburb and city on `cleaners.areas`, same as cleaners/available).
 * (same rules as assignment: daily load cap + travel-buffer overlap with existing jobs).
 * Without suburb: legacy cap — remaining = max(0, MAX_BOOKINGS_PER_TIME_SLOT − hourly booking count).
 */
export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: false, error: 'Invalid or missing date' }, { status: 400 });
    }

    const suburb = request.nextUrl.searchParams.get('suburb')?.trim() ?? '';
    const city = request.nextUrl.searchParams.get('city')?.trim() ?? '';
    const dmParam = request.nextUrl.searchParams.get('duration_minutes');
    const bedrooms = Math.max(0, parseInt(request.nextUrl.searchParams.get('bedrooms') || '2', 10) || 0);
    const bathrooms = Math.max(0, parseInt(request.nextUrl.searchParams.get('bathrooms') || '2', 10) || 0);
    const extras = parseJsonArray(request.nextUrl.searchParams.get('extras'));
    const extrasQuantities = parseQuantities(request.nextUrl.searchParams.get('extras_quantities'));
    const debug = request.nextUrl.searchParams.get('debug') === '1';

    let durationMinutes: number;
    if (dmParam != null && dmParam !== '') {
      const n = parseInt(dmParam, 10);
      durationMinutes = Number.isFinite(n) && n >= 30 ? n : 180;
    } else {
      durationMinutes = computeBookingDurationMinutes({
        bedrooms,
        bathrooms,
        extras,
        extrasQuantities,
      });
    }

    if (debug) {
      console.log('[slot-api] INPUT', {
        date,
        suburb,
        bedrooms,
        bathrooms,
        extras,
      });
      console.log('[weekday-check]', {
        date,
        weekday: new Date(date).getUTCDay(),
      });
      console.log('[duration]', durationMinutes);
    }

    const supabase = createServiceClient();

    if (!suburb) {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('booking_date', date)
        .neq('status', 'cancelled');

      if (error) {
        console.error('slot-occupancy:', error);
        return NextResponse.json({ ok: false, error: 'Failed to load occupancy' }, { status: 500 });
      }

      const hourly: Record<string, number> = {};
      for (const id of STANDARD_BOOKING_TIME_IDS) {
        hourly[id] = 0;
      }
      for (const row of data ?? []) {
        const sid = normalizeBookingTimeToSlotId(row.booking_time);
        if (sid != null && hourly[sid] !== undefined) {
          hourly[sid]++;
        }
      }

      const remaining: Record<string, number> = {};
      for (const id of STANDARD_BOOKING_TIME_IDS) {
        remaining[id] = Math.max(0, MAX_BOOKINGS_PER_TIME_SLOT - (hourly[id] ?? 0));
      }

      return NextResponse.json({
        ok: true,
        eligible_cleaners: null,
        duration_minutes: durationMinutes,
        counts: hourly,
        remaining,
        mode: 'legacy_cap',
        ...(debug ? { debug: true as const } : {}),
      });
    }

    const areaCandidates = [...new Set([suburb, city].filter(Boolean))];

    const eligible = await fetchEligibleCleanersForAreas(
      supabase,
      date,
      areaCandidates,
      debug ? { skipDayFilter: true } : undefined
    );

    const eligibleCleaners = eligible.filter((c) => checkCleanerDay(c, date)).length;

    if (debug) {
      console.log('[slot-api] eligible cleaners', eligibleCleaners);
      console.log('[slot-api] cleaners in pipeline (area match; day applied per slot)', eligible.length);
      for (const c of eligible) {
        console.log('[cleaner]', c.id, {
          areas: c.areas,
          available: {
            mon: c.available_monday,
            tue: c.available_tuesday,
            wed: c.available_wednesday,
            thu: c.available_thursday,
            fri: c.available_friday,
            sat: c.available_saturday,
            sun: c.available_sunday,
          },
        });
      }
    }

    const bookedJobs: Record<string, number> = {};
    const remaining: Record<string, number> = {};

    for (const id of STANDARD_BOOKING_TIME_IDS) {
      bookedJobs[id] = 0;
      remaining[id] = 0;
    }

    if (eligibleCleaners === 0) {
      return NextResponse.json({
        ok: true,
        eligible_cleaners: 0,
        duration_minutes: durationMinutes,
        counts: bookedJobs,
        remaining,
        mode: 'dispatch',
        ...(debug ? { debug: true as const } : {}),
      });
    }

    const assignable = await assignableCleanersPerDispatchSlots(supabase, {
      date,
      durationMinutes,
      eligible,
      debug,
    });
    for (const slotId of STANDARD_BOOKING_TIME_IDS) {
      const rem = assignable[slotId] ?? 0;
      remaining[slotId] = rem;
      bookedJobs[slotId] = Math.max(0, eligibleCleaners - rem);
    }

    return NextResponse.json({
      ok: true,
      eligible_cleaners: eligibleCleaners,
      duration_minutes: durationMinutes,
      counts: bookedJobs,
      remaining,
      mode: 'dispatch',
      ...(debug ? { debug: true as const } : {}),
    });
  } catch (e) {
    console.error('slot-occupancy:', e);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
