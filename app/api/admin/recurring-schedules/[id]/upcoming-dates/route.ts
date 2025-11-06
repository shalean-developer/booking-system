import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, isAdmin } from '@/lib/supabase-server';
import { calculateBookingDatesForMonth } from '@/lib/recurring-bookings';
import { RecurringSchedule } from '@/types/recurring';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/recurring-schedules/[id]/upcoming-dates
 * Fetches upcoming booking dates for a recurring schedule
 */
export async function GET(
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

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12', 10); // Default to 12 months ahead

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Failed to initialize database connection' },
        { status: 500 }
      );
    }

    // Fetch the recurring schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('recurring_schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { ok: false, error: 'Recurring schedule not found' },
        { status: 404 }
      );
    }

    // Check if schedule is active
    if (!schedule.is_active) {
      return NextResponse.json(
        { ok: true, dates: [] },
        { status: 200 }
      );
    }

    // Calculate upcoming dates for the next N months
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + limit);
    
    const scheduleStartDate = new Date(schedule.start_date);
    const scheduleEndDate = schedule.end_date ? new Date(schedule.end_date) : null;
    
    // Only calculate dates from schedule start date onwards
    const calculationStartDate = scheduleStartDate > today ? scheduleStartDate : today;
    
    const allDates: Date[] = [];
    
    // Calculate dates month by month
    const currentDate = new Date(calculationStartDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const monthDates = calculateBookingDatesForMonth(
        schedule as RecurringSchedule,
        year,
        month
      );
      
      // Filter dates that are:
      // 1. Today or in the future
      // 2. After schedule start date
      // 3. Before schedule end date (if exists)
      const filteredDates = monthDates.filter(date => {
        const dateOnly = new Date(date);
        dateOnly.setHours(0, 0, 0, 0);
        
        if (dateOnly < today) return false;
        if (dateOnly < scheduleStartDate) return false;
        if (scheduleEndDate && dateOnly > scheduleEndDate) return false;
        
        return true;
      });
      
      allDates.push(...filteredDates);
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1);
    }

    // Sort and limit dates
    const sortedDates = allDates
      .sort((a, b) => a.getTime() - b.getTime())
      .slice(0, 50); // Limit to 50 dates max

    // Format dates for response
    const formattedDates = sortedDates.map(date => ({
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      time: schedule.preferred_time,
      display: date.toLocaleDateString('en-ZA', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    }));

    return NextResponse.json({
      ok: true,
      dates: formattedDates,
      schedule: {
        id: schedule.id,
        frequency: schedule.frequency,
        is_active: schedule.is_active,
      },
    });
  } catch (error) {
    console.error('Error fetching upcoming dates:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch upcoming dates' },
      { status: 500 }
    );
  }
}




