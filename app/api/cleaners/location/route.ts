import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient } from '@/lib/cleaner-auth';
import { createServiceClient } from '@/lib/supabase-server';
import { isCleanerAssignedToBooking } from '@/lib/cleaner-booking-assignment';

function parseCoord(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Cleaner live location (session-bound).
 * POST body: { cleaner_id, latitude, longitude, timestamp?, booking_id? }
 * Only the authenticated cleaner may update; optional booking_id must be assigned to them.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const cleanerIdBody = typeof body.cleaner_id === 'string' ? body.cleaner_id : null;
    const bookingId = typeof body.booking_id === 'string' ? body.booking_id : null;
    const latitude = parseCoord(body.latitude);
    const longitude = parseCoord(body.longitude);
    const tsRaw = body.timestamp;
    const timestamp =
      typeof tsRaw === 'string' && tsRaw ? tsRaw : new Date().toISOString();

    if (!cleanerIdBody || cleanerIdBody !== session.id) {
      return NextResponse.json({ ok: false, error: 'Invalid cleaner' }, { status: 403 });
    }

    if (
      latitude === null ||
      longitude === null ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json({ ok: false, error: 'Invalid coordinates' }, { status: 400 });
    }

    const supabase = await createCleanerSupabaseClient();

    const { error } = await supabase
      .from('cleaners')
      .update({
        last_location_lat: latitude,
        last_location_lng: longitude,
        last_location_updated: timestamp,
      })
      .eq('id', session.id);

    if (error) {
      console.error('[cleaners/location] cleaners update:', error);
      return NextResponse.json({ ok: false, error: 'Failed to update location' }, { status: 500 });
    }

    if (bookingId) {
      const svc = createServiceClient();
      const { data: booking, error: bErr } = await svc
        .from('bookings')
        .select('id, cleaner_id, assigned_cleaner_id, assigned_cleaners, requires_team, cleaner_locations')
        .eq('id', bookingId)
        .maybeSingle();

      if (bErr || !booking) {
        return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
      }

      const allowed = await isCleanerAssignedToBooking(supabase, bookingId, session.id, booking);
      if (!allowed) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
      }

      const prev = (booking.cleaner_locations as Record<string, unknown> | null) || {};
      const next = {
        ...prev,
        [session.id]: {
          lat: latitude,
          lng: longitude,
          at: timestamp,
        },
      };

      const { error: upErr } = await svc
        .from('bookings')
        .update({ cleaner_locations: next, updated_at: new Date().toISOString() })
        .eq('id', bookingId);

      if (upErr) {
        console.warn('[cleaners/location] cleaner_locations cache skipped:', upErr.message);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[tracking]', {
        booking_id: bookingId,
        cleaner_id: session.id,
        location: { lat: latitude, lng: longitude },
      });
    }

    return NextResponse.json({ ok: true, message: 'Location updated' });
  } catch (e) {
    console.error('[cleaners/location]', e);
    return NextResponse.json({ ok: false, error: 'An error occurred' }, { status: 500 });
  }
}
