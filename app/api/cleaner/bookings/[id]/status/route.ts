import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient } from '@/lib/cleaner-auth';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted'],
  accepted: ['on_my_way'],        // Must go to "on my way"
  on_my_way: ['in-progress'],     // Must start job from "on my way"
  'in-progress': ['completed'],
  completed: [], // No transitions from completed
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus) {
      return NextResponse.json(
        { ok: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    const supabase = await createCleanerSupabaseClient();

    // Get current booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('cleaner_id', session.id)
      .maybeSingle();

    if (fetchError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Validate status transition
    const validNextStatuses = VALID_TRANSITIONS[booking.status] || [];
    if (!validNextStatuses.includes(newStatus)) {
      return NextResponse.json(
        { 
          ok: false, 
          error: `Cannot transition from ${booking.status} to ${newStatus}` 
        },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status: newStatus,
    };

    // Set timestamps based on status
    if (newStatus === 'accepted' && !booking.cleaner_accepted_at) {
      updateData.cleaner_accepted_at = new Date().toISOString();
    } else if (newStatus === 'on_my_way' && !booking.cleaner_on_my_way_at) {
      updateData.cleaner_on_my_way_at = new Date().toISOString();
    } else if (newStatus === 'in-progress' && !booking.cleaner_started_at) {
      updateData.cleaner_started_at = new Date().toISOString();
    } else if (newStatus === 'completed' && !booking.cleaner_completed_at) {
      updateData.cleaner_completed_at = new Date().toISOString();
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
      .eq('cleaner_id', session.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking status:', updateError);
      return NextResponse.json(
        { ok: false, error: 'Failed to update booking status' },
        { status: 500 }
      );
    }

    console.log('✅ Booking status updated:', bookingId, '→', newStatus);

    return NextResponse.json({
      ok: true,
      booking: updatedBooking,
      message: `Booking marked as ${newStatus}`,
    });
  } catch (error) {
    console.error('Error in update booking status route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

