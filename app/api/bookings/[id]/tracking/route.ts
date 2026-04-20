import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase-server';
import { isSafeBookingLookupId } from '@/lib/booking-lookup-id';
import { verifyBookingLookupToken, isBookingLookupTokenConfigured } from '@/lib/booking-lookup-token';
import { estimateETA } from '@/lib/scheduling/eta';
import { effectiveTrackingStatus, type TrackingStatus } from '@/lib/tracking-status';

async function authorizeCustomerTracking(
  req: NextRequest,
  bookingId: string
): Promise<boolean> {
  if (!isBookingLookupTokenConfigured()) {
    return true;
  }

  const { searchParams } = new URL(req.url);
  const ct = searchParams.get('ct');
  if (verifyBookingLookupToken(bookingId, ct)) {
    return true;
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.replace('Bearer ', '');
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) return false;

  const svc = createServiceClient();
  const { data: customer } = await svc
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!customer) return false;

  const { data: booking } = await svc
    .from('bookings')
    .select('customer_id')
    .eq('id', bookingId)
    .maybeSingle();

  return Boolean(booking && booking.customer_id === customer.id);
}

function resolvePrimaryCleanerId(booking: {
  cleaner_id?: string | null;
  assigned_cleaner_id?: string | null;
  assigned_cleaners?: string[] | null;
}): string | null {
  if (booking.cleaner_id && booking.cleaner_id !== 'manual') return booking.cleaner_id;
  if (booking.assigned_cleaner_id) return booking.assigned_cleaner_id;
  const ac = booking.assigned_cleaners;
  if (Array.isArray(ac) && ac.length > 0) return ac[0]!;
  return null;
}

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id || !isSafeBookingLookupId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid reference' }, { status: 400 });
    }

    const allowed = await authorizeCustomerTracking(req, id);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const svc = createServiceClient();
    let booking = (await svc.from('bookings').select('*').eq('id', id).maybeSingle()).data;
    if (!booking) {
      booking = (await svc.from('bookings').select('*').eq('payment_reference', id).maybeSingle()).data;
    }
    if (!booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    const cleanerUuid = resolvePrimaryCleanerId(booking);
    type CleanerLoc = {
      id: string;
      name: string;
      phone: string | null;
      last_location_lat: number | null;
      last_location_lng: number | null;
    };
    let cleanerRow: CleanerLoc | null = null;
    if (cleanerUuid) {
      const { data: c } = await svc
        .from('cleaners')
        .select('id, name, phone, last_location_lat, last_location_lng')
        .eq('id', cleanerUuid)
        .maybeSingle();
      cleanerRow = c as CleanerLoc | null;
    }

    const cache = booking.cleaner_locations as
      | Record<string, '' | { lat?: number; lng?: number }>
      | null;
    const rawCached = cleanerUuid ? cache?.[cleanerUuid] : undefined;
    const cached =
      rawCached && typeof rawCached === 'object' ? rawCached : null;
    let lat =
      cached && typeof cached.lat === 'number' && Number.isFinite(cached.lat)
        ? cached.lat
        : cleanerRow && typeof cleanerRow.last_location_lat === 'number'
          ? cleanerRow.last_location_lat
          : null;
    let lng =
      cached && typeof cached.lng === 'number' && Number.isFinite(cached.lng)
        ? cached.lng
        : cleanerRow && typeof cleanerRow.last_location_lng === 'number'
          ? cleanerRow.last_location_lng
          : null;

    const destLat = typeof booking.latitude === 'number' ? booking.latitude : null;
    const destLng = typeof booking.longitude === 'number' ? booking.longitude : null;

    let eta_minutes: number | null = null;
    let eta_time: string | null = null;

    if (
      lat !== null &&
      lng !== null &&
      destLat !== null &&
      destLng !== null &&
      Number.isFinite(destLat) &&
      Number.isFinite(destLng)
    ) {
      const eta = estimateETA(
        { latitude: lat, longitude: lng },
        { latitude: destLat, longitude: destLng }
      );
      eta_minutes = eta.eta_minutes;
      eta_time = eta.eta_time;
    }

    const phase = effectiveTrackingStatus(booking) as TrackingStatus | null;

    if (process.env.NODE_ENV === 'development') {
      console.log('[tracking]', {
        booking_id: booking.id,
        cleaner_id: cleanerUuid,
        status: phase,
        location: lat !== null && lng !== null ? { lat, lng } : null,
        eta: eta_minutes != null ? { eta_minutes, eta_time } : null,
      });
    }

    const destination =
      destLat !== null && destLng !== null && Number.isFinite(destLat) && Number.isFinite(destLng)
        ? { lat: destLat, lng: destLng }
        : null;

    return NextResponse.json({
      ok: true,
      status: phase,
      cleaner: cleanerRow
        ? {
            id: cleanerRow.id,
            name: cleanerRow.name,
            phone: cleanerRow.phone,
          }
        : null,
      location:
        lat !== null && lng !== null
          ? {
              lat,
              lng,
            }
          : null,
      destination,
      eta_minutes,
      eta_time,
    });
  } catch (e) {
    console.error('[bookings/tracking]', e);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}
