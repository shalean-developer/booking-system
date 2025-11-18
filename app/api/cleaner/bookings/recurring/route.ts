import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * GET /api/cleaner/bookings/recurring
 * Fetch all recurring bookings for the cleaner
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const cleanerId = cleanerIdToUuid(session.id);

    // Fetch bookings with recurring schedule info
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        status,
        service_type,
        total_amount,
        cleaner_earnings,
        recurring_schedule_id,
        recurring_schedules (
          id,
          frequency,
          day_of_week,
          day_of_month,
          preferred_time,
          is_active,
          start_date,
          end_date
        )
      `)
      .eq('cleaner_id', cleanerId)
      .not('recurring_schedule_id', 'is', null)
      .order('booking_date', { ascending: true });

    if (error) {
      console.error('Error fetching recurring bookings:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch recurring bookings' },
        { status: 500 }
      );
    }

    // Group by recurring schedule
    const groupedBySchedule: Record<string, any> = {};
    bookings?.forEach((booking: any) => {
      const scheduleId = booking.recurring_schedule_id;
      if (!groupedBySchedule[scheduleId]) {
        groupedBySchedule[scheduleId] = {
          schedule: booking.recurring_schedules,
          bookings: [],
        };
      }
      groupedBySchedule[scheduleId].bookings.push(booking);
    });

    return NextResponse.json({
      ok: true,
      recurringBookings: Object.values(groupedBySchedule),
    });
  } catch (error) {
    console.error('Error in GET /api/cleaner/bookings/recurring:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


