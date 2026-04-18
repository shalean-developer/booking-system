import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { listAvailableCleanersForBooking } from '@/lib/dispatch/cleaner-dispatch';
import { computeBookingDurationMinutes } from '@/lib/booking-duration';
import { normalizeBookingTimeToSlotId } from '@/lib/booking-time-slots';
import { BOOKING_TEAM_NAMES } from '@/shared/booking-engine/booking-team-names';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TEAM_NAMES = BOOKING_TEAM_NAMES;

function parseExtras(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

function parseExtrasQuantities(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

function preserveStatusOnReschedule(current: string | null | undefined): string {
  const s = (current || '').toLowerCase();
  if (s === 'pending') return 'pending';
  if (
    s === 'paid' ||
    s === 'confirmed' ||
    s === 'accepted' ||
    s === 'assigned' ||
    s === 'on_my_way' ||
    s === 'in_progress' ||
    s === 'started' ||
    s === 'completed' ||
    s === 'cancelled' ||
    s === 'canceled' ||
    s === 'declined'
  ) {
    return current || 'confirmed';
  }
  return current || 'confirmed';
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAuth.auth.getUser(token);
    if (authError || !authUser) {
      return NextResponse.json({ ok: false, error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      bookingId,
      date,
      time,
      cleanerId,
      teamName,
    } = body as {
      bookingId?: string;
      date?: string;
      time?: string;
      cleanerId?: string | null;
      teamName?: string | null;
    };

    if (!bookingId || !date || !time) {
      return NextResponse.json({ ok: false, error: 'bookingId, date and time are required' }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: false, error: 'Invalid date format' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();
    if (customerError || !customer) {
      return NextResponse.json({ ok: false, error: 'Customer profile not found' }, { status: 404 });
    }

    const { data: booking, error: bookingFetchError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        customer_id,
        status,
        cleaner_id,
        requires_team,
        service_type,
        address_suburb,
        address_city,
        bedrooms,
        bathrooms,
        extras,
        extras_quantities,
        duration_minutes,
        price_snapshot
      `
      )
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingFetchError || !booking || booking.customer_id !== customer.id) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    const st = (booking.status || '').toLowerCase();
    if (st === 'cancelled' || st === 'canceled' || st === 'declined' || st === 'completed') {
      return NextResponse.json(
        { ok: false, error: 'This booking cannot be rescheduled' },
        { status: 400 }
      );
    }

    const slotId = normalizeBookingTimeToSlotId(time) || time;
    const suburb = String(booking.address_suburb || '').trim();
    const city = String(booking.address_city || '').trim();
    const areas = [...new Set([suburb, city].filter(Boolean))];
    if (areas.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Booking is missing service area (suburb/city)' },
        { status: 400 }
      );
    }

    let bedrooms =
      typeof booking.bedrooms === 'number' && Number.isFinite(booking.bedrooms)
        ? booking.bedrooms
        : 2;
    let bathrooms =
      typeof booking.bathrooms === 'number' && Number.isFinite(booking.bathrooms)
        ? booking.bathrooms
        : 2;
    const snap = booking.price_snapshot as { service?: { bedrooms?: number; bathrooms?: number } } | null;
    if (snap?.service?.bedrooms != null) bedrooms = snap.service.bedrooms;
    if (snap?.service?.bathrooms != null) bathrooms = snap.service.bathrooms;

    const extras = parseExtras(booking.extras);
    const extrasQuantities = parseExtrasQuantities(booking.extras_quantities);

    let durationMinutes =
      typeof booking.duration_minutes === 'number' && booking.duration_minutes >= 30
        ? booking.duration_minutes
        : computeBookingDurationMinutes({
            bedrooms,
            bathrooms,
            extras,
            extrasQuantities,
          });

    const requiresTeam = Boolean(booking.requires_team);

    if (requiresTeam) {
      const name = typeof teamName === 'string' ? teamName.trim() : '';
      if (!name || !TEAM_NAMES.includes(name as (typeof TEAM_NAMES)[number])) {
        return NextResponse.json({ ok: false, error: 'A valid team must be selected' }, { status: 400 });
      }

      const { data: teamRows } = await supabase
        .from('booking_teams')
        .select('booking_id')
        .eq('team_name', name);

      const ids = (teamRows ?? []).map((r) => r.booking_id).filter(Boolean);
      if (ids.length > 0) {
        const { data: sameDay } = await supabase
          .from('bookings')
          .select('id, status')
          .in('id', ids)
          .eq('booking_date', date)
          .neq('id', bookingId);

        const terminal = new Set(['cancelled', 'canceled', 'completed', 'declined']);
        const conflicts = (sameDay ?? []).filter((b) => !terminal.has((b.status || '').toLowerCase()));

        if (conflicts.length > 0) {
          return NextResponse.json(
            { ok: false, error: 'That team is already assigned on this date' },
            { status: 409 }
          );
        }
      }

      const nextStatus = preserveStatusOnReschedule(booking.status);

      const { error: updateErr } = await supabase
        .from('bookings')
        .update({
          booking_date: date,
          booking_time: slotId,
          status: nextStatus,
        })
        .eq('id', bookingId);

      if (updateErr) {
        return NextResponse.json({ ok: false, error: 'Failed to reschedule booking' }, { status: 500 });
      }

      const { data: existingTeam } = await supabase
        .from('booking_teams')
        .select('booking_id')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (existingTeam) {
        await supabase.from('booking_teams').update({ team_name: name }).eq('booking_id', bookingId);
      } else {
        await supabase.from('booking_teams').insert({ booking_id: bookingId, team_name: name });
      }

      return NextResponse.json({ ok: true });
    }

    const cid = typeof cleanerId === 'string' ? cleanerId.trim() : '';
    if (!cid || !UUID_RE.test(cid)) {
      return NextResponse.json({ ok: false, error: 'A valid cleaner must be selected' }, { status: 400 });
    }

    const available = await listAvailableCleanersForBooking(supabase, {
      date,
      areas,
      startTime: slotId,
      durationMinutes,
      excludeBookingId: bookingId,
    });

    const allowed = available.some((c) => c.id === cid);
    if (!allowed) {
      return NextResponse.json(
        { ok: false, error: 'Selected cleaner is not available for this slot' },
        { status: 409 }
      );
    }

    const nextStatus = preserveStatusOnReschedule(booking.status);

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        booking_date: date,
        booking_time: slotId,
        cleaner_id: cid,
        duration_minutes: durationMinutes,
        status: nextStatus,
      })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.json({ ok: false, error: 'Failed to reschedule booking' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[dashboard/reschedule]', err);
    }
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
