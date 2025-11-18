import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/bookings/[id]/adjust-earnings
 * Adjust cleaner earnings for a specific booking (admin override)
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
    const { adjustmentAmount, reason, notes } = body;

    if (adjustmentAmount === undefined || adjustmentAmount === null) {
      return NextResponse.json(
        { ok: false, error: 'adjustmentAmount is required' },
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
      .select('id, cleaner_id, cleaner_earnings, notes, booking_notes')
      .eq('id', bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Calculate new earnings (adjustmentAmount is in cents)
    const currentEarnings = booking.cleaner_earnings || 0;
    const newEarnings = Math.max(0, currentEarnings + adjustmentAmount); // Ensure non-negative

    // Update booking earnings
    const adjustmentNote = `[ADMIN ADJUSTMENT ${new Date().toISOString()}] ${reason}: ${adjustmentAmount > 0 ? '+' : ''}R${(adjustmentAmount / 100).toFixed(2)}. ${notes || ''}`;
    
    // Use notes column if it exists, otherwise use booking_notes
    const currentNotes = booking.notes || booking.booking_notes || '';
    const updateData: any = {
      cleaner_earnings: newEarnings,
    };
    
    // Try to update notes column (fallback to booking_notes if notes doesn't exist)
    if (booking.notes !== undefined) {
      updateData.notes = currentNotes ? `${currentNotes}\n\n${adjustmentNote}` : adjustmentNote;
    } else if (booking.booking_notes !== undefined) {
      updateData.booking_notes = currentNotes ? `${currentNotes}\n\n${adjustmentNote}` : adjustmentNote;
    }
    
    const { error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking earnings:', updateError);
      return NextResponse.json(
        { ok: false, error: 'Failed to update earnings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      previousEarnings: currentEarnings / 100,
      newEarnings: newEarnings / 100,
      adjustment: adjustmentAmount / 100,
    });
  } catch (error: any) {
    console.error('Error in earnings adjustment:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to adjust earnings' },
      { status: 500 }
    );
  }
}

