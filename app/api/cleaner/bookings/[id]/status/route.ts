import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { generateReviewRequestEmail, sendEmail } from '@/lib/email';

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted'],
  accepted: ['on_my_way'],        // Must go to "on my way"
  confirmed: ['on_my_way'],       // Same as accepted (legacy status)
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
    const cleanerUuid = cleanerIdToUuid(session.id);

    // Get current booking - check both individual and team bookings
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is assigned to this cleaner
    // For individual bookings: check cleaner_id
    // For team bookings: check if cleaner is a team member
    let isAssigned = false;

    if (booking.cleaner_id === cleanerUuid) {
      // Individual booking assigned to this cleaner
      isAssigned = true;
    } else if (booking.requires_team) {
      // Team booking - check if cleaner is a team member
      try {
        const { data: teamMembership } = await supabase
          .from('booking_team_members')
          .select(`
            booking_team_id,
            booking_teams!inner(booking_id)
          `)
          .eq('cleaner_id', cleanerUuid);
        
        if (teamMembership && teamMembership.length > 0) {
          const isMemberOfThisBooking = teamMembership.some(
            (membership: any) => membership.booking_teams.booking_id === bookingId
          );
          if (isMemberOfThisBooking) {
            isAssigned = true;
          }
        }
      } catch (err) {
        console.error('Error checking team membership:', err);
      }
    }

    if (!isAssigned) {
      return NextResponse.json(
        { ok: false, error: 'Booking not assigned to you' },
        { status: 403 }
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

    // Update booking (we already verified ownership above)
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', bookingId)
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

    // Send review request email if booking is completed
    if (newStatus === 'completed' && process.env.RESEND_API_KEY) {
      try {
        console.log('📧 Sending review request email to customer...');
        
        // Get cleaner name for the email
        const { data: cleaner } = await supabase
          .from('cleaners')
          .select('name')
          .eq('id', session.id)
          .single();

        const emailData = generateReviewRequestEmail({
          customerEmail: updatedBooking.customer_email,
          customerName: updatedBooking.customer_name,
          bookingId: updatedBooking.id,
          bookingDate: updatedBooking.booking_date,
          bookingTime: updatedBooking.booking_time,
          serviceType: updatedBooking.service_type || 'Cleaning Service',
          cleanerName: cleaner?.name,
        });

        await sendEmail(emailData);
        console.log('✅ Review request email sent successfully');
      } catch (emailError) {
        // Log error but don't fail the status update
        console.error('⚠️ Failed to send review request email:', emailError);
      }
    }

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

