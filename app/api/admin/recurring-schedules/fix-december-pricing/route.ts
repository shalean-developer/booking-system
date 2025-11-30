import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Fix December recurring booking pricing to match November pricing
 * For each schedule, finds November bookings and updates December bookings to match
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

    // Get November pricing for each schedule
    const { data: novemberBookings, error: novError } = await svc
      .from('bookings')
      .select('recurring_schedule_id, total_amount, cleaner_earnings')
      .gte('booking_date', '2024-11-01')
      .lt('booking_date', '2024-12-01')
      .not('recurring_schedule_id', 'is', null);

    if (novError) {
      console.error('Error fetching November bookings:', novError);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch November bookings: ${novError.message}` },
        { status: 500 }
      );
    }

    if (!novemberBookings || novemberBookings.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No November bookings found',
        fixed: 0,
        dryRun,
      });
    }

    // Calculate average pricing per schedule from November
    const schedulePricing = new Map<string, { total_amount: number; cleaner_earnings: number | null; count: number }>();
    
    for (const booking of novemberBookings) {
      const scheduleId = booking.recurring_schedule_id;
      if (!scheduleId) continue;

      if (!schedulePricing.has(scheduleId)) {
        schedulePricing.set(scheduleId, {
          total_amount: 0,
          cleaner_earnings: null,
          count: 0,
        });
      }

      const pricing = schedulePricing.get(scheduleId)!;
      pricing.total_amount += booking.total_amount || 0;
      if (booking.cleaner_earnings !== null) {
        if (pricing.cleaner_earnings === null) {
          pricing.cleaner_earnings = 0;
        }
        pricing.cleaner_earnings += booking.cleaner_earnings;
      }
      pricing.count += 1;
    }

    // Calculate averages
    const avgPricing = new Map<string, { total_amount: number; cleaner_earnings: number | null }>();
    for (const [scheduleId, pricing] of schedulePricing.entries()) {
      avgPricing.set(scheduleId, {
        total_amount: Math.round(pricing.total_amount / pricing.count),
        cleaner_earnings: pricing.cleaner_earnings !== null 
          ? Math.round(pricing.cleaner_earnings / pricing.count)
          : null,
      });
    }

    // Get December bookings
    const { data: decemberBookings, error: decError } = await svc
      .from('bookings')
      .select('id, total_amount, cleaner_earnings, price_snapshot, recurring_schedule_id, booking_date')
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

    // Find bookings that need fixing
    const bookingsToFix = decemberBookings.filter((booking: any) => {
      const novPricing = avgPricing.get(booking.recurring_schedule_id);
      if (!novPricing) return false; // No November booking to match

      const totalMismatch = booking.total_amount !== novPricing.total_amount;
      const cleanerEarningsMismatch = 
        (booking.cleaner_earnings === null && novPricing.cleaner_earnings !== null) ||
        (booking.cleaner_earnings !== null && novPricing.cleaner_earnings !== null && 
         booking.cleaner_earnings !== novPricing.cleaner_earnings);

      return totalMismatch || cleanerEarningsMismatch;
    });

    if (bookingsToFix.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'All December bookings already match November pricing',
        fixed: 0,
        dryRun,
      });
    }

    if (dryRun) {
      // Return preview
      const preview = bookingsToFix.slice(0, 10).map((booking: any) => {
        const novPricing = avgPricing.get(booking.recurring_schedule_id);
        return {
          booking_id: booking.id,
          booking_date: booking.booking_date,
          schedule_id: booking.recurring_schedule_id,
          current_total: booking.total_amount,
          november_avg_total: novPricing?.total_amount,
          current_cleaner_earnings: booking.cleaner_earnings,
          november_avg_cleaner_earnings: novPricing?.cleaner_earnings,
        };
      });

      return NextResponse.json({
        ok: true,
        message: `DRY RUN: Found ${bookingsToFix.length} December bookings that need pricing fixes`,
        dryRun: true,
        wouldFix: bookingsToFix.length,
        schedulesAffected: avgPricing.size,
        preview,
        total: bookingsToFix.length,
      });
    }

    // Actually fix the bookings
    let fixed = 0;
    const errors: string[] = [];

    for (const booking of bookingsToFix) {
      try {
        const novPricing = avgPricing.get(booking.recurring_schedule_id);
        if (!novPricing) continue;

        const updateData: any = {
          total_amount: novPricing.total_amount,
          updated_at: new Date().toISOString(),
        };

        if (novPricing.cleaner_earnings !== null) {
          updateData.cleaner_earnings = novPricing.cleaner_earnings;
        }

        // Update price_snapshot
        const existingSnapshot = booking.price_snapshot || {};
        const totalRands = novPricing.total_amount / 100;
        updateData.price_snapshot = {
          ...existingSnapshot,
          total: totalRands,
          manual_pricing: true,
          snapshot_date: new Date().toISOString(),
          pricing_fixed_from_november: true,
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
      message: `Fixed pricing for ${fixed} December booking(s) to match November pricing`,
      fixed,
      total: bookingsToFix.length,
      schedulesAffected: avgPricing.size,
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

