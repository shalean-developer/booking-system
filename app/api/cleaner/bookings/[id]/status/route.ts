import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { generateReviewRequestEmail, sendEmail } from '@/lib/email';
import { createServiceClient } from '@/lib/supabase-server';
import { sendWhatsAppTemplate } from '@/lib/notifications/whatsapp';
import { logNotification } from '@/lib/notifications/log';
import { sendCustomerNotification } from '@/lib/notifications/sendCustomerNotification';
import { incrementCustomerRewardsForCompletedBooking } from '@/lib/rewards-server';

/**
 * Cleaner workflow: pending/paid → assigned → accepted → on_my_way → in-progress → completed
 * (decline/reschedule still allowed where listed.)
 *
 * Paid-but-claimed rows often keep DB status `paid` until the cleaner moves the job; the dashboard
 * maps `paid` to the same UI step as `accepted`, so we allow paid → on_my_way and backfill accept
 * timestamps when missing.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'assigned', 'declined', 'reschedule_requested'],
  paid: ['accepted', 'assigned', 'declined', 'reschedule_requested', 'on_my_way'],
  /** Must accept assignment before en route / start */
  assigned: ['accepted', 'declined', 'reschedule_requested'],
  accepted: ['on_my_way', 'declined', 'reschedule_requested'],
  confirmed: ['on_my_way', 'declined', 'reschedule_requested'], // legacy
  on_my_way: ['in-progress', 'declined', 'reschedule_requested'],
  'in-progress': ['completed'],
  reschedule_requested: ['accepted'],
  declined: [],
  completed: [],
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
    let { status: newStatus, reason, proposed_date, proposed_time, notes } = body;

    if (newStatus === 'in_progress') {
      newStatus = 'in-progress';
    }

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

    if (booking.cleaner_id === cleanerUuid || booking.assigned_cleaner_id === cleanerUuid) {
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

    // Idempotent: avoid errors on double-submit or stale UI (e.g. already on_my_way)
    if (booking.status === newStatus) {
      return NextResponse.json({
        ok: true,
        booking,
        message: 'Already up to date',
      });
    }

    const validNextStatuses = [...(VALID_TRANSITIONS[booking.status] || [])];

    if (!validNextStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          ok: false,
          error: `Cannot transition from ${booking.status} to ${newStatus}`,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (newStatus === 'in-progress') {
      if (booking.booking_time && !booking.start_time) {
        updateData.start_time = String(booking.booking_time).slice(0, 5);
      }
      if (booking.expected_end_time && !booking.end_time) {
        updateData.end_time = String(booking.expected_end_time).slice(0, 5);
      }
    }

    // Lifecycle timestamps (always refresh on transition into that state)
    if (newStatus === 'accepted') {
      updateData.cleaner_accepted_at = now;
      updateData.accepted_at = now;
    }
    if (newStatus === 'on_my_way') {
      updateData.cleaner_on_my_way_at = now;
      updateData.on_my_way_at = now;
      // Claimed paid jobs may never have gone through PATCH accepted; align lifecycle if missing
      if (
        booking.status === 'paid' &&
        !(booking as { cleaner_accepted_at?: string | null }).cleaner_accepted_at &&
        !(booking as { accepted_at?: string | null }).accepted_at
      ) {
        updateData.cleaner_accepted_at = now;
        updateData.accepted_at = now;
      }
    }
    if (newStatus === 'in-progress') {
      updateData.cleaner_started_at = now;
      updateData.started_at = now;
    }
    if (newStatus === 'completed') {
      updateData.cleaner_completed_at = now;
      updateData.completed_at = now;
    }

    // If decline or reschedule, record an internal note for admins
    try {
      if (newStatus === 'declined' && (reason || notes)) {
        await supabase.from('booking_notes').insert({
          booking_id: bookingId,
          author_type: 'cleaner',
          author_id: cleanerUuid,
          note_type: 'decline',
          content: reason || notes,
        });
      }

      if (newStatus === 'reschedule_requested') {
        const details = [
          proposed_date ? `Proposed date: ${proposed_date}` : null,
          proposed_time ? `Proposed time: ${proposed_time}` : null,
          notes ? `Notes: ${notes}` : null,
        ]
          .filter(Boolean)
          .join(' | ');

        await supabase.from('booking_notes').insert({
          booking_id: bookingId,
          author_type: 'cleaner',
          author_id: cleanerUuid,
          note_type: 'reschedule',
          content: details || 'Reschedule requested',
        });
      }
    } catch (noteErr) {
      console.warn('⚠️ Failed to write booking note:', noteErr);
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

    try {
      if (newStatus === 'accepted') {
        await sendCustomerNotification({ type: 'accepted', booking: updatedBooking });
      } else if (newStatus === 'on_my_way') {
        await sendCustomerNotification({ type: 'on_my_way', booking: updatedBooking });
      } else if (newStatus === 'in-progress') {
        await sendCustomerNotification({ type: 'started', booking: updatedBooking });
      } else if (newStatus === 'completed') {
        await sendCustomerNotification({ type: 'completed', booking: updatedBooking });
      }
    } catch (notifyErr) {
      console.warn('⚠️ Customer lifecycle notification failed:', notifyErr);
    }

    // Get cleaner name for activity log and email
    const { data: cleaner } = await supabase
      .from('cleaners')
      .select('name')
      .eq('id', cleanerUuid)
      .single();

    // Log activity for admin dashboard
    if (cleaner) {
      try {
        // Insert activity log record
        const { error: activityError } = await supabase
          .from('booking_activities')
          .insert({
            booking_id: bookingId,
            cleaner_id: cleanerUuid,
            cleaner_name: cleaner.name,
            old_status: booking.status,
            new_status: newStatus,
            action_type: 'status_change',
          });

        if (activityError) {
          // Log error but don't fail the status update
          console.error('⚠️ Failed to log activity:', activityError);
        } else {
          console.log('✅ Activity logged:', cleaner.name, booking.status, '→', newStatus);
        }
      } catch (activityLogError) {
        // Log error but don't fail the status update
        console.error('⚠️ Error logging activity:', activityLogError);
      }
    }

    // WhatsApp status-change notification to cleaner (best-effort, gated by prefs and env)
    try {
      const svc = createServiceClient();
      const { data: prefs } = await svc
        .from('notification_preferences')
        .select('whatsapp_opt_in, phone')
        .eq('cleaner_id', cleanerUuid)
        .maybeSingle();

      const notifyPhone = (prefs?.phone || updatedBooking.customer_phone || '').trim();
      const whatsappOptIn = prefs?.whatsapp_opt_in === true;

      if (whatsappOptIn && notifyPhone) {
        const address = [updatedBooking.address_line1, updatedBooking.address_suburb, updatedBooking.address_city]
          .filter(Boolean)
          .join(', ');
        const waPayloadCleaner = {
          to: notifyPhone,
          template: 'booking_status_update',
          language: 'en',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: updatedBooking.id }, // {{1}} bookingId
                { type: 'text', text: newStatus },         // {{2}} newStatus
                { type: 'text', text: updatedBooking.service_type || 'Cleaning' }, // {{3}}
                { type: 'text', text: updatedBooking.booking_date },              // {{4}}
                { type: 'text', text: updatedBooking.booking_time },              // {{5}}
                { type: 'text', text: address },                                  // {{6}}
                { type: 'text', text: `https://shalean.co.za/cleaner/dashboard/my-jobs?ref=${updatedBooking.id}` }, // {{7}}
              ],
            },
          ],
        };
        const resCleaner = await sendWhatsAppTemplate(waPayloadCleaner as any);
        await logNotification({
          channel: 'whatsapp',
          template: 'booking_status_update',
          recipient_type: 'cleaner',
          recipient_phone: notifyPhone,
          booking_id: updatedBooking.id,
          payload: waPayloadCleaner,
          ok: resCleaner.ok,
          status: resCleaner.status ?? null,
          error: resCleaner.error ?? null,
        });
      }
    } catch {}

    // Optional customer notification (env-gated to avoid sending without consent)
    try {
      if (process.env.ENABLE_WHATSAPP_CUSTOMER === 'true') {
        const customerPhone = (updatedBooking.customer_phone || '').trim();
        if (customerPhone) {
          const address = [updatedBooking.address_line1, updatedBooking.address_suburb, updatedBooking.address_city]
            .filter(Boolean)
            .join(', ');
          const waPayloadCustomer = {
            to: customerPhone,
            template: 'booking_status_update',
            language: 'en',
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: updatedBooking.id }, // {{1}} bookingId
                  { type: 'text', text: newStatus },         // {{2}} newStatus
                  { type: 'text', text: updatedBooking.service_type || 'Cleaning' }, // {{3}}
                  { type: 'text', text: updatedBooking.booking_date },              // {{4}}
                  { type: 'text', text: updatedBooking.booking_time },              // {{5}}
                  { type: 'text', text: address },                                  // {{6}}
                  { type: 'text', text: `https://shalean.co.za/bookings/${updatedBooking.id}` }, // {{7}}
                ],
              },
            ],
          };
          const resCustomer = await sendWhatsAppTemplate(waPayloadCustomer as any);
          await logNotification({
            channel: 'whatsapp',
            template: 'booking_status_update',
            recipient_type: 'customer',
            recipient_phone: customerPhone,
            booking_id: updatedBooking.id,
            payload: waPayloadCustomer,
            ok: resCustomer.ok,
            status: resCustomer.status ?? null,
            error: resCustomer.error ?? null,
          });
        }
      }
    } catch {}

    // Increment customer rewards when booking is marked completed
    if (newStatus === 'completed') {
      try {
        const serviceSupabase = await createServiceClient();
        const rewardsResult = await incrementCustomerRewardsForCompletedBooking(serviceSupabase, bookingId);
        if (!rewardsResult.ok) {
          console.warn('⚠️ Failed to increment customer rewards:', rewardsResult.error);
        }
      } catch (rewardsErr) {
        console.warn('⚠️ Rewards increment error:', rewardsErr);
      }
    }

    // Send review request email if booking is completed
    if (newStatus === 'completed' && process.env.RESEND_API_KEY && cleaner) {
      try {
        console.log('📧 Sending review request email to customer...');

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

