import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * POST /api/cleaner/bookings/recurring/[scheduleId]/action
 * Perform actions on recurring booking series (accept-all, decline-all, pause, resume)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scheduleId: string }> }
) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { scheduleId } = await params;
    const body = await request.json();
    const action = body.action; // 'accept-all' | 'decline-all' | 'pause' | 'resume'

    const supabase = createServiceClient();
    const cleanerId = cleanerIdToUuid(session.id);

    // Verify cleaner owns this schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('recurring_schedules')
      .select('id, cleaner_id')
      .eq('id', scheduleId)
      .eq('cleaner_id', cleanerId)
      .maybeSingle();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { ok: false, error: 'Recurring schedule not found or access denied' },
        { status: 404 }
      );
    }

    if (action === 'accept-all') {
      // Accept all pending bookings in the series
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'accepted',
          cleaner_accepted_at: new Date().toISOString(),
        })
        .eq('cleaner_id', cleanerId)
        .eq('recurring_schedule_id', scheduleId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error accepting recurring bookings:', error);
        return NextResponse.json(
          { ok: false, error: 'Failed to accept bookings' },
          { status: 500 }
        );
      }
    } else if (action === 'decline-all') {
      // Decline all pending bookings in the series
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'declined',
        })
        .eq('cleaner_id', cleanerId)
        .eq('recurring_schedule_id', scheduleId)
        .eq('status', 'pending');

      if (error) {
        console.error('Error declining recurring bookings:', error);
        return NextResponse.json(
          { ok: false, error: 'Failed to decline bookings' },
          { status: 500 }
        );
      }
    } else if (action === 'pause') {
      // Pause the recurring schedule
      const { error } = await supabase
        .from('recurring_schedules')
        .update({ is_active: false })
        .eq('id', scheduleId)
        .eq('cleaner_id', cleanerId);

      if (error) {
        console.error('Error pausing recurring schedule:', error);
        return NextResponse.json(
          { ok: false, error: 'Failed to pause schedule' },
          { status: 500 }
        );
      }
    } else if (action === 'resume') {
      // Resume the recurring schedule
      const { error } = await supabase
        .from('recurring_schedules')
        .update({ is_active: true })
        .eq('id', scheduleId)
        .eq('cleaner_id', cleanerId);

      if (error) {
        console.error('Error resuming recurring schedule:', error);
        return NextResponse.json(
          { ok: false, error: 'Failed to resume schedule' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { ok: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Action completed successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/cleaner/bookings/recurring/[scheduleId]/action:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

