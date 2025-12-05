import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Get the recurring schedule to get the new pricing
    const { data: schedule, error: scheduleError } = await supabase
      .from('recurring_schedules')
      .select('total_amount, cleaner_earnings')
      .eq('id', id)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { ok: false, error: 'Recurring schedule not found' },
        { status: 404 }
      );
    }

    // Check if pricing is set (only total_amount is required, cleaner_earnings is optional)
    if (!schedule.total_amount || schedule.total_amount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Schedule must have total_amount set to update bookings' },
        { status: 400 }
      );
    }

    // Determine which bookings to update based on options
    const updateAll = body.updateAll === true; // Update all bookings including completed
    const updateFutureOnly = body.updateFutureOnly !== false; // Default to true

    // Build query for bookings to update
    let bookingsQuery = supabase
      .from('bookings')
      .select('id, booking_date, status, price_snapshot')
      .eq('recurring_schedule_id', id);

    // If updating future only, filter by date and status
    if (updateFutureOnly && !updateAll) {
      const today = new Date().toISOString().split('T')[0];
      bookingsQuery = bookingsQuery
        .gte('booking_date', today)
        .in('status', ['pending', 'accepted', 'confirmed', 'on_my_way', 'in-progress']);
    }

    const { data: bookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No bookings found to update',
        updatedCount: 0,
      });
    }

    // Update each booking
    const updatePromises = bookings.map(async (booking) => {
      const updateData: any = {
        total_amount: schedule.total_amount,
      };

      // Only include cleaner_earnings if it's set
      if (schedule.cleaner_earnings != null && schedule.cleaner_earnings > 0) {
        updateData.cleaner_earnings = schedule.cleaner_earnings;
      }

      // Update price_snapshot if it exists
      if (booking.price_snapshot && typeof booking.price_snapshot === 'object') {
        // Convert total_amount from cents to rands for price_snapshot
        const totalRands = schedule.total_amount / 100;
        updateData.price_snapshot = {
          ...booking.price_snapshot,
          total: totalRands,
          snapshot_date: new Date().toISOString(),
          manual_pricing: true,
        };
      }

      return supabase
        .from('bookings')
        .update(updateData)
        .eq('id', booking.id);
    });

    const results = await Promise.all(updatePromises);
    const errors = results.filter(r => r.error);
    
    if (errors.length > 0) {
      console.error('Some bookings failed to update:', errors);
      return NextResponse.json(
        { 
          ok: false, 
          error: `Failed to update ${errors.length} of ${bookings.length} bookings`,
          updatedCount: bookings.length - errors.length,
          failedCount: errors.length,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully updated ${bookings.length} booking(s)`,
      updatedCount: bookings.length,
    });
  } catch (error: any) {
    console.error('Error updating bookings:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

