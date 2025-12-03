import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { calcTotalAsync } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

/**
 * Fix pricing for all recurring schedules and their bookings
 * 1. Calculates and sets pricing on schedules that don't have it
 * 2. Updates all bookings to match their schedule's pricing
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
    let body;
    try {
      body = await request.json();
    } catch (e) {
      body = { dryRun: true };
    }
    const dryRun = body.dryRun !== false; // Default to true for safety

    console.log(`[Fix All Pricing] Starting with dryRun=${dryRun}`);

    // Get all recurring schedules
    const { data: allSchedules, error: schedulesError } = await svc
      .from('recurring_schedules')
      .select(`
        id,
        service_type,
        bedrooms,
        bathrooms,
        extras,
        extras_quantities,
        frequency,
        total_amount,
        cleaner_earnings
      `)
      .eq('is_active', true);

    if (schedulesError) {
      console.error('[Fix All Pricing] Error fetching schedules:', schedulesError);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch schedules: ${schedulesError.message}` },
        { status: 500 }
      );
    }

    if (!allSchedules || allSchedules.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No active recurring schedules found',
        schedulesUpdated: 0,
        bookingsUpdated: 0,
        dryRun,
      });
    }

    console.log(`[Fix All Pricing] Found ${allSchedules.length} active schedules`);

    // Map frequency for pricing calculation
    const mapFrequency = (freq: string): 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' => {
      switch (freq) {
        case 'weekly':
        case 'custom-weekly':
          return 'weekly';
        case 'bi-weekly':
        case 'custom-bi-weekly':
          return 'bi-weekly';
        case 'monthly':
          return 'monthly';
        default:
          return 'one-time';
      }
    };

    // Calculate pricing for each schedule
    const scheduleUpdates: Array<{
      id: string;
      total_amount: number;
      cleaner_earnings: number;
      needsUpdate: boolean;
    }> = [];

    for (const schedule of allSchedules) {
      let totalAmount: number;
      let cleanerEarnings: number;

      // Use stored pricing if available, otherwise calculate
      if (schedule.total_amount && schedule.total_amount > 0) {
        totalAmount = schedule.total_amount;
        cleanerEarnings = schedule.cleaner_earnings || 
          Math.round((totalAmount - 5000) * 0.60); // Calculate if not set
      } else {
        // Calculate pricing
        const pricingFrequency = mapFrequency(schedule.frequency);
        const pricing = await calcTotalAsync(
          {
            service: schedule.service_type as any,
            bedrooms: schedule.bedrooms,
            bathrooms: schedule.bathrooms,
            extras: schedule.extras || [],
            extrasQuantities: schedule.extras_quantities || {},
          },
          pricingFrequency
        );

        totalAmount = Math.round(pricing.total * 100); // Convert to cents
        const subtotalAfterFee = pricing.total - pricing.serviceFee;
        cleanerEarnings = Math.round(subtotalAfterFee * 0.60 * 100);
      }

      const needsUpdate = 
        schedule.total_amount !== totalAmount ||
        schedule.cleaner_earnings !== cleanerEarnings;

      scheduleUpdates.push({
        id: schedule.id,
        total_amount: totalAmount,
        cleaner_earnings: cleanerEarnings,
        needsUpdate,
      });
    }

    const schedulesToUpdate = scheduleUpdates.filter(s => s.needsUpdate);
    console.log(`[Fix All Pricing] ${schedulesToUpdate.length} schedules need pricing updates`);

    if (dryRun) {
      // Get all bookings that will be affected
      const scheduleIds = scheduleUpdates.map(s => s.id);
      const { data: allBookings } = await svc
        .from('bookings')
        .select('id, recurring_schedule_id, total_amount')
        .in('recurring_schedule_id', scheduleIds)
        .not('recurring_schedule_id', 'is', null);

      const bookingsNeedingUpdate = (allBookings || []).filter((booking: any) => {
        const schedule = scheduleUpdates.find(s => s.id === booking.recurring_schedule_id);
        return schedule && booking.total_amount !== schedule.total_amount;
      });

      return NextResponse.json({
        ok: true,
        message: `DRY RUN: Would update ${schedulesToUpdate.length} schedules and ${bookingsNeedingUpdate.length} bookings`,
        dryRun: true,
        schedulesToUpdate: schedulesToUpdate.length,
        totalSchedules: allSchedules.length,
        bookingsToUpdate: bookingsNeedingUpdate.length,
        totalBookings: allBookings?.length || 0,
        preview: {
          schedules: schedulesToUpdate.slice(0, 10).map(s => ({
            schedule_id: s.id,
            new_total_amount: s.total_amount,
            new_total_rands: (s.total_amount / 100).toFixed(2),
            new_cleaner_earnings: s.cleaner_earnings,
            new_cleaner_earnings_rands: (s.cleaner_earnings / 100).toFixed(2),
          })),
          bookings: bookingsNeedingUpdate.slice(0, 10).map((b: any) => {
            const schedule = scheduleUpdates.find(s => s.id === b.recurring_schedule_id);
            return {
              booking_id: b.id,
              schedule_id: b.recurring_schedule_id,
              current_total: b.total_amount,
              new_total: schedule?.total_amount,
            };
          }),
        },
      });
    }

    // Actually update schedules
    let schedulesUpdated = 0;
    const scheduleErrors: string[] = [];

    for (const update of schedulesToUpdate) {
      try {
        const { error: updateError } = await svc
          .from('recurring_schedules')
          .update({
            total_amount: update.total_amount,
            cleaner_earnings: update.cleaner_earnings,
            updated_at: new Date().toISOString(),
          })
          .eq('id', update.id);

        if (updateError) {
          scheduleErrors.push(`Schedule ${update.id}: ${updateError.message}`);
        } else {
          schedulesUpdated++;
        }
      } catch (error: any) {
        scheduleErrors.push(`Schedule ${update.id}: ${error.message}`);
      }
    }

    console.log(`[Fix All Pricing] Updated ${schedulesUpdated} schedules`);

    // Now update all bookings to match their schedule's pricing
    const scheduleMap = new Map(scheduleUpdates.map(s => [s.id, s]));
    const { data: allBookings } = await svc
      .from('bookings')
      .select('id, recurring_schedule_id, total_amount, cleaner_earnings, price_snapshot')
      .not('recurring_schedule_id', 'is', null);

    const bookingsToUpdate = (allBookings || []).filter((booking: any) => {
      const schedule = scheduleMap.get(booking.recurring_schedule_id);
      if (!schedule) return false;

      const totalMismatch = booking.total_amount !== schedule.total_amount;
      const cleanerEarningsMismatch = booking.cleaner_earnings !== schedule.cleaner_earnings;

      return totalMismatch || cleanerEarningsMismatch;
    });

    console.log(`[Fix All Pricing] Found ${bookingsToUpdate.length} bookings to update`);

    let bookingsUpdated = 0;
    const bookingErrors: string[] = [];

    for (const booking of bookingsToUpdate) {
      try {
        const schedule = scheduleMap.get(booking.recurring_schedule_id);
        if (!schedule) continue;

        const updateData: any = {
          total_amount: schedule.total_amount,
          cleaner_earnings: schedule.cleaner_earnings,
          updated_at: new Date().toISOString(),
        };

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
          bookingErrors.push(`Booking ${booking.id}: ${updateError.message}`);
        } else {
          bookingsUpdated++;
        }
      } catch (error: any) {
        bookingErrors.push(`Booking ${booking.id}: ${error.message}`);
      }
    }

    console.log(`[Fix All Pricing] Updated ${bookingsUpdated} bookings`);

    return NextResponse.json({
      ok: true,
      message: `Updated ${schedulesUpdated} schedules and ${bookingsUpdated} bookings`,
      schedulesUpdated,
      bookingsUpdated,
      totalSchedules: allSchedules.length,
      totalBookings: allBookings?.length || 0,
      errors: {
        schedules: scheduleErrors.length > 0 ? scheduleErrors : undefined,
        bookings: bookingErrors.length > 0 ? bookingErrors : undefined,
      },
    });
  } catch (error: any) {
    console.error('[Fix All Pricing] Fatal error:', error);
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

