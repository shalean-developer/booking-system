import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { calcTotalAsync } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

/**
 * Fix December booking pricing by calculating correct pricing from schedule details
 * This calculates pricing based on bedrooms, bathrooms, extras, and frequency
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
      // If no body provided, default to dryRun: true
      body = { dryRun: true };
    }
    const dryRun = body.dryRun !== false; // Default to true for safety

    console.log(`[Fix December Pricing] Starting with dryRun=${dryRun}`);

    // First get schedule IDs that have December bookings
    const { data: decemberBookings, error: decError } = await svc
      .from('bookings')
      .select('recurring_schedule_id, id, total_amount, cleaner_earnings, price_snapshot')
      .gte('booking_date', '2025-12-01')
      .lt('booking_date', '2026-01-01')
      .not('recurring_schedule_id', 'is', null);

    if (decError) {
      console.error('Error fetching December bookings:', decError);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch December bookings: ${decError.message}` },
        { status: 500 }
      );
    }

    if (!decemberBookings || decemberBookings.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No December bookings found',
        fixed: 0,
        dryRun,
      });
    }

    // Get unique schedule IDs (filter out null/undefined)
    const scheduleIds = [...new Set(decemberBookings.map((b: any) => b.recurring_schedule_id).filter(Boolean))];

    if (scheduleIds.length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'No valid schedule IDs found in December bookings',
      }, { status: 400 });
    }

    console.log(`[Fix December Pricing] Found ${scheduleIds.length} unique schedule IDs:`, scheduleIds);

    // Get all schedules with December bookings
    const { data: schedules, error: schedulesError } = await svc
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
      .in('id', scheduleIds);

    console.log(`[Fix December Pricing] Fetched ${schedules?.length || 0} schedules`);

    if (schedulesError) {
      console.error('[Fix December Pricing] Error fetching schedules:', schedulesError);
      console.error('[Fix December Pricing] Schedule IDs queried:', scheduleIds);
      return NextResponse.json(
        { 
          ok: false, 
          error: `Failed to fetch schedules: ${schedulesError.message}`,
          details: `Tried to fetch ${scheduleIds.length} schedules`,
          scheduleIds: scheduleIds.slice(0, 5), // Show first 5 for debugging
        },
        { status: 500 }
      );
    }

    if (!schedules || schedules.length === 0) {
      console.warn('[Fix December Pricing] No schedules found for IDs:', scheduleIds);
      return NextResponse.json({
        ok: false,
        error: 'No schedules found with December bookings',
        message: `Found ${decemberBookings.length} December bookings but could not fetch their schedules`,
        scheduleIdsQueried: scheduleIds,
        fixed: 0,
        dryRun,
      }, { status: 404 });
    }


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

    // Calculate correct pricing for each schedule
    const schedulePricing = new Map<string, { total_amount: number; cleaner_earnings: number | null }>();

    for (const schedule of schedules) {
      let correctTotal: number;
      let correctCleanerEarnings: number | null = null;

      // Use stored pricing if available
      if (schedule.total_amount && schedule.total_amount > 0) {
        correctTotal = schedule.total_amount;
        correctCleanerEarnings = schedule.cleaner_earnings || null;
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

        correctTotal = Math.round(pricing.total * 100); // Convert to cents
        const subtotalAfterFee = pricing.total - pricing.serviceFee;
        correctCleanerEarnings = Math.round(subtotalAfterFee * 0.60 * 100);
      }

      schedulePricing.set(schedule.id, {
        total_amount: correctTotal,
        cleaner_earnings: correctCleanerEarnings,
      });
    }

    // Find bookings that need fixing
    const bookingsToFix = (decemberBookings || []).filter((booking: any) => {
      const correctPricing = schedulePricing.get(booking.recurring_schedule_id);
      if (!correctPricing) return false;

      const totalMismatch = booking.total_amount !== correctPricing.total_amount;
      const cleanerEarningsMismatch = 
        (booking.cleaner_earnings === null && correctPricing.cleaner_earnings !== null) ||
        (booking.cleaner_earnings !== null && correctPricing.cleaner_earnings !== null && 
         booking.cleaner_earnings !== correctPricing.cleaner_earnings);

      return totalMismatch || cleanerEarningsMismatch;
    });

    if (bookingsToFix.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'All December bookings already have correct pricing',
        fixed: 0,
        dryRun,
      });
    }

    if (dryRun) {
      const preview = bookingsToFix.slice(0, 10).map((booking: any) => {
        const correctPricing = schedulePricing.get(booking.recurring_schedule_id);
        return {
          booking_id: booking.id,
          schedule_id: booking.recurring_schedule_id,
          current_total: booking.total_amount,
          correct_total: correctPricing?.total_amount,
          current_cleaner_earnings: booking.cleaner_earnings,
          correct_cleaner_earnings: correctPricing?.cleaner_earnings,
        };
      });

      return NextResponse.json({
        ok: true,
        message: `DRY RUN: Found ${bookingsToFix.length} December bookings that need pricing fixes`,
        dryRun: true,
        wouldFix: bookingsToFix.length,
        schedulesProcessed: schedulePricing.size,
        preview,
        total: bookingsToFix.length,
      });
    }

    // Actually fix the bookings
    let fixed = 0;
    const errors: string[] = [];

    for (const booking of bookingsToFix) {
      try {
        const correctPricing = schedulePricing.get(booking.recurring_schedule_id);
        if (!correctPricing) continue;

        const updateData: any = {
          total_amount: correctPricing.total_amount,
          updated_at: new Date().toISOString(),
        };

        if (correctPricing.cleaner_earnings !== null) {
          updateData.cleaner_earnings = correctPricing.cleaner_earnings;
        }

        const totalRands = correctPricing.total_amount / 100;
        const existingSnapshot = booking.price_snapshot || {};
        updateData.price_snapshot = {
          ...existingSnapshot,
          total: totalRands,
          manual_pricing: true,
          snapshot_date: new Date().toISOString(),
          pricing_recalculated: true,
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
      message: `Fixed pricing for ${fixed} December booking(s)`,
      fixed,
      total: bookingsToFix.length,
      schedulesProcessed: schedulePricing.size,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error fixing December booking pricing:', error);
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

