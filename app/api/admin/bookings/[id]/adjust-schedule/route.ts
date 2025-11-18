import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/bookings/[id]/adjust-schedule
 * Adjust booking date/time (admin override)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const { bookingDate, bookingTime, reason, notes } = body;

    if (!bookingDate || !bookingTime) {
      return NextResponse.json(
        { ok: false, error: 'bookingDate and bookingTime are required' },
        { status: 400 }
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { ok: false, error: 'reason is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get current booking
    // Note: Using 'notes' column - if this doesn't exist, use 'booking_notes' instead
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time, notes, booking_notes')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update booking schedule
    const scheduleNote = `[ADMIN SCHEDULE ADJUSTMENT ${new Date().toISOString()}] ${reason}: Changed from ${booking.booking_date} ${booking.booking_time} to ${bookingDate} ${bookingTime}. ${notes || ''}`;
    
    // Use notes column if it exists, otherwise use booking_notes
    const currentNotes = booking.notes || booking.booking_notes || '';
    const updateData: any = {
      booking_date: bookingDate,
      booking_time: bookingTime,
    };
    
    // Try to update notes column (fallback to booking_notes if notes doesn't exist)
    if (booking.notes !== undefined) {
      updateData.notes = currentNotes ? `${currentNotes}\n\n${scheduleNote}` : scheduleNote;
    } else if (booking.booking_notes !== undefined) {
      updateData.booking_notes = currentNotes ? `${currentNotes}\n\n${scheduleNote}` : scheduleNote;
    }
    
    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking schedule:', updateError);
      return NextResponse.json(
        { ok: false, error: 'Failed to update schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      previousDate: booking.booking_date,
      previousTime: booking.booking_time,
      newDate: bookingDate,
      newTime: bookingTime,
    });
  } catch (error: any) {
    console.error('Error in schedule adjustment:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to adjust schedule' },
      { status: 500 }
    );
  }
}

