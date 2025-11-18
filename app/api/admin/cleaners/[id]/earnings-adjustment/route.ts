import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/cleaners/[id]/earnings-adjustment
 * Adjust cleaner earnings for a specific booking
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

    const { id: cleanerId } = await params;
    const body = await request.json();
    const { bookingId, adjustmentAmount, reason, notes } = body;

    if (!bookingId || adjustmentAmount === undefined) {
      return NextResponse.json(
        { ok: false, error: 'bookingId and adjustmentAmount are required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Get current booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, cleaner_id, cleaner_earnings, notes')
      .eq('id', bookingId)
      .eq('cleaner_id', cleanerId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found or not assigned to this cleaner' },
        { status: 404 }
      );
    }

    // Calculate new earnings (adjustmentAmount is in cents)
    const currentEarnings = booking.cleaner_earnings || 0;
    const newEarnings = currentEarnings + adjustmentAmount;

    // Update booking earnings
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        cleaner_earnings: newEarnings,
        // Store adjustment in booking notes
        notes: booking.notes
          ? `${booking.notes}\n\n[ADJUSTMENT ${new Date().toISOString()}] ${reason || 'Earnings adjustment'}: ${adjustmentAmount > 0 ? '+' : ''}R${(adjustmentAmount / 100).toFixed(2)}. ${notes || ''}`
          : `[ADJUSTMENT ${new Date().toISOString()}] ${reason || 'Earnings adjustment'}: ${adjustmentAmount > 0 ? '+' : ''}R${(adjustmentAmount / 100).toFixed(2)}. ${notes || ''}`,
      })
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


