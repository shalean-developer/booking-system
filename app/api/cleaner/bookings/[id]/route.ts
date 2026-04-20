import { NextRequest, NextResponse } from 'next/server';
import {
  getCleanerSession,
  createCleanerSupabaseClient,
  cleanerIdToUuid,
} from '@/lib/cleaner-auth';
import { isCleanerAssignedToBooking } from '@/lib/cleaner-booking-assignment';

export const dynamic = 'force-dynamic';

/**
 * Single booking for cleaner app — only if assigned to this cleaner.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: bookingId } = await params;
    const supabase = await createCleanerSupabaseClient();
    const cleanerUuid = cleanerIdToUuid(session.id);

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (error || !booking) {
      return NextResponse.json({ ok: false, error: 'Booking not found' }, { status: 404 });
    }

    const allowed = await isCleanerAssignedToBooking(supabase, bookingId, cleanerUuid, booking);
    if (!allowed) {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ok: true, booking });
  } catch (e) {
    console.error('[cleaner/bookings/id GET]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 },
    );
  }
}
