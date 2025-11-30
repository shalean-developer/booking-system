import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Fix pricing for all recurring bookings that don't match their schedule's pricing
 * This endpoint updates bookings to use the correct pricing from recurring_schedules
 */
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const svc = createServiceClient();
    const body = await request.json();
    const dryRun = body.dryRun !== false; // Default to true for safety

    // First, get all schedules with pricing set
    const { data: schedules, error: schedulesError } = await svc
      .from('recurring_schedules')
      .select('id, total_amount, cleaner_earnings')
      .not('total_amount', 'is', null)
      .gt('total_amount', 0);

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch schedules: ${schedulesError.message}` },
        { status: 500 }
      );
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No recurring schedules with pricing found',
        fixed: 0,
        dryRun,
      });
    }

    const scheduleIds = schedules.map((s: any) => s.id);
    const scheduleMap = new Map(schedules.map((s: any) => [s.id, s]));

    // Find all bookings for these schedules
    const { data: bookingsToFix, error: fetchError } = await svc
      .from('bookings')
      .select('id, total_amount, cleaner_earnings, price_snapshot, recurring_schedule_id')
      .in('recurring_schedule_id', scheduleIds);

    if (fetchError) {
      console.error('Error fetching bookings:', fetchError);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch bookings: ${fetchError.message}` },
        { status: 500 }
      );
    }

    if (!bookingsToFix || bookingsToFix.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No bookings found that need pricing fixes',
        fixed: 0,
        dryRun,
      });
    }

    // Filter bookings that actually need fixing
    const bookingsNeedingFix = bookingsToFix.filter((booking: any) => {
      const schedule = scheduleMap.get(booking.recurring_schedule_id);
      if (!schedule || !schedule.total_amount) return false;

      // Check if pricing needs to be fixed
      const totalMismatch = booking.total_amount !== schedule.total_amount;
      const cleanerEarningsMismatch = 
        (booking.cleaner_earnings === null && schedule.cleaner_earnings !== null) ||
        (booking.cleaner_earnings !== null && schedule.cleaner_earnings !== null && 
         booking.cleaner_earnings !== schedule.cleaner_earnings);

      return totalMismatch || cleanerEarningsMismatch;
    }).map((booking: any) => ({
      ...booking,
      schedule: scheduleMap.get(booking.recurring_schedule_id),
    }));

    if (bookingsNeedingFix.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'All bookings already have correct pricing',
        fixed: 0,
        dryRun,
      });
    }

    if (dryRun) {
      // Return preview of what would be fixed
      const preview = bookingsNeedingFix.map((booking: any) => {
        const schedule = booking.schedule;
        return {
          booking_id: booking.id,
          current_total: booking.total_amount,
          correct_total: schedule.total_amount,
          current_cleaner_earnings: booking.cleaner_earnings,
          correct_cleaner_earnings: schedule.cleaner_earnings,
        };
      });

      return NextResponse.json({
        ok: true,
        message: `DRY RUN: Found ${bookingsNeedingFix.length} bookings that need pricing fixes`,
        dryRun: true,
        wouldFix: bookingsNeedingFix.length,
        preview: preview.slice(0, 10), // Show first 10 as preview
        total: bookingsNeedingFix.length,
      });
    }

    // Actually fix the bookings
    let fixed = 0;
    const errors: string[] = [];

    for (const booking of bookingsNeedingFix) {
      try {
        const schedule = booking.schedule;
        const updateData: any = {
          total_amount: schedule.total_amount,
          updated_at: new Date().toISOString(),
        };

        // Update cleaner_earnings if schedule has it set
        if (schedule.cleaner_earnings !== null) {
          updateData.cleaner_earnings = schedule.cleaner_earnings;
        }

        // Update price_snapshot
        const existingSnapshot = booking.price_snapshot || {};
        const totalRands = schedule.total_amount / 100;
        updateData.price_snapshot = {
          ...existingSnapshot,
          total: totalRands,
          manual_pricing: true,
          snapshot_date: new Date().toISOString(),
          pricing_fixed_at: new Date().toISOString(),
        };

        const { error: updateError } = await svc
          .from('bookings')
          .update(updateData)
          .eq('id', booking.id);

        if (updateError) {
          errors.push(`Booking ${booking.id}: ${updateError.message}`);
        } else {
          fixed++;
        }
      } catch (error: any) {
        errors.push(`Booking ${booking.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Fixed pricing for ${fixed} booking(s)`,
      fixed,
      total: bookingsNeedingFix.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error fixing booking pricing:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

