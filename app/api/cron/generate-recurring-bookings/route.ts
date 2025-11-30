import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { calculateBookingDatesForMonth, getMonthYearString, parseMonthYearString } from '@/lib/recurring-bookings';
import { calcTotalAsync } from '@/lib/pricing';
import { generateUniqueBookingId } from '@/lib/booking-id';
import type { RecurringSchedule } from '@/types/recurring';

export const dynamic = 'force-dynamic';

/**
 * Map recurring schedule frequency to pricing frequency
 */
function mapFrequencyToPricingFrequency(frequency: string): 'one-time' | 'weekly' | 'bi-weekly' | 'monthly' {
  switch (frequency) {
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
}

/**
 * Check if today is the last day of the month
 */
function isLastDayOfMonth(): boolean {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // If tomorrow is the 1st, today is the last day of the month
  return tomorrow.getDate() === 1;
}

/**
 * Get next month's year and month
 */
function getNextMonth(): { year: number; month: number } {
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  return {
    year: nextMonth.getFullYear(),
    month: nextMonth.getMonth() + 1,
  };
}

export async function GET(req: NextRequest) {
  try {
    const svc = createServiceClient();

    // Check if today is the last day of the month
    if (!isLastDayOfMonth()) {
      return NextResponse.json({
        ok: true,
        message: 'Not the last day of the month. Skipping generation.',
        processed: 0,
        generated: 0,
        errors: [],
      });
    }

    const { year: nextYear, month: nextMonth } = getNextMonth();
    const nextMonthYear = getMonthYearString(new Date(nextYear, nextMonth - 1, 1));
    const nextMonthFirstDay = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`;
    
    // Calculate last day of next month
    const lastDayOfNextMonth = new Date(nextYear, nextMonth, 0).getDate();
    const nextMonthLastDay = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-${lastDayOfNextMonth.toString().padStart(2, '0')}`;

    console.log(`[Cron] Generating bookings for ${nextMonthYear} (${nextMonthFirstDay} to ${nextMonthLastDay})`);

    // Fetch all active recurring schedules that need generation
    // We'll filter in code for complex OR conditions
    const { data: allSchedules, error: schedulesError } = await svc
      .from('recurring_schedules')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', nextMonthLastDay);

    if (schedulesError) {
      console.error('[Cron] Error fetching recurring schedules:', schedulesError);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch schedules: ${schedulesError.message}` },
        { status: 500 }
      );
    }

    // Filter schedules that need generation:
    // 1. end_date is NULL OR end_date >= first day of next month
    // 2. last_generated_month is NULL OR last_generated_month < next month
    const schedules = (allSchedules || []).filter((schedule: any) => {
      // Check end_date condition
      const endDateValid = !schedule.end_date || schedule.end_date >= nextMonthFirstDay;
      
      // Check last_generated_month condition
      const lastGeneratedValid = !schedule.last_generated_month || schedule.last_generated_month < nextMonthYear;
      
      return endDateValid && lastGeneratedValid;
    });

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No active recurring schedules found that need generation.',
        processed: 0,
        generated: 0,
        errors: [],
      });
    }

    console.log(`[Cron] Found ${schedules.length} schedules to process`);

    let processed = 0;
    let totalGenerated = 0;
    const errors: string[] = [];

    // Process each schedule
    for (const schedule of schedules as RecurringSchedule[]) {
      try {
        processed++;

        // Skip if already generated for this month
        if (schedule.last_generated_month === nextMonthYear) {
          console.log(`[Cron] Schedule ${schedule.id} already generated for ${nextMonthYear}, skipping`);
          continue;
        }

        // Check if schedule has started
        const scheduleStartDate = new Date(schedule.start_date);
        const nextMonthStartDate = new Date(nextYear, nextMonth - 1, 1);
        if (scheduleStartDate > new Date(nextYear, nextMonth, 0)) {
          console.log(`[Cron] Schedule ${schedule.id} hasn't started yet, skipping`);
          continue;
        }

        // Check if schedule has ended
        if (schedule.end_date) {
          const scheduleEndDate = new Date(schedule.end_date);
          if (scheduleEndDate < nextMonthStartDate) {
            console.log(`[Cron] Schedule ${schedule.id} has ended, skipping`);
            continue;
          }
        }

        // Fetch customer details
        const { data: customer, error: customerError } = await svc
          .from('customers')
          .select('id, first_name, last_name, email, phone')
          .eq('id', schedule.customer_id)
          .maybeSingle();

        if (customerError || !customer) {
          errors.push(`Schedule ${schedule.id}: Customer not found`);
          console.error(`[Cron] Schedule ${schedule.id}: Customer error:`, customerError);
          continue;
        }

        // Calculate booking dates for next month
        const bookingDates = calculateBookingDatesForMonth(schedule, nextYear, nextMonth);

        // Filter dates that fall within schedule's start_date and end_date
        const validDates = bookingDates.filter((date) => {
          if (date < scheduleStartDate) return false;
          if (schedule.end_date && date > new Date(schedule.end_date)) return false;
          return true;
        });

        if (validDates.length === 0) {
          console.log(`[Cron] Schedule ${schedule.id}: No valid dates for ${nextMonthYear}`);
          // Still update last_generated_month to avoid retrying
          await svc
            .from('recurring_schedules')
            .update({ last_generated_month: nextMonthYear })
            .eq('id', schedule.id);
          continue;
        }

        // Calculate pricing
        const pricingFrequency = mapFrequencyToPricingFrequency(schedule.frequency);
        const pricing = await calcTotalAsync(
          {
            service: schedule.service_type as any,
            bedrooms: schedule.bedrooms,
            bathrooms: schedule.bathrooms,
            extras: schedule.extras || [],
            extrasQuantities: schedule.extras_quantities || schedule.extrasQuantities || {},
          },
          pricingFrequency
        );

        // Build price snapshot
        const priceSnapshot = {
          service_type: schedule.service_type,
          bedrooms: schedule.bedrooms,
          bathrooms: schedule.bathrooms,
          extras: schedule.extras || [],
          extrasQuantities: schedule.extras_quantities || schedule.extrasQuantities || {},
          notes: schedule.notes || null,
          subtotal: pricing.subtotal,
          serviceFee: pricing.serviceFee,
          frequencyDiscount: pricing.frequencyDiscount,
          total: pricing.total,
          snapshot_date: new Date().toISOString(),
        };

        // Check for existing bookings to avoid duplicates
        const dateStrings = validDates.map((d) => d.toISOString().split('T')[0]);
        const { data: existingBookings } = await svc
          .from('bookings')
          .select('booking_date')
          .eq('recurring_schedule_id', schedule.id)
          .in('booking_date', dateStrings);

        const existingDates = new Set(
          (existingBookings || []).map((b: any) => b.booking_date)
        );

        // Create bookings for each valid date
        const bookingsToCreate = validDates
          .filter((date) => {
            const dateStr = date.toISOString().split('T')[0];
            return !existingDates.has(dateStr);
          })
          .map((date) => {
            const bookingId = generateUniqueBookingId();
            const dateStr = date.toISOString().split('T')[0];
            const timeStr = schedule.preferred_time; // Already in HH:MM format

            // Determine if team booking
            const requiresTeam = schedule.service_type === 'Deep' || schedule.service_type === 'Move In/Out';
            const cleanerIdForInsert = requiresTeam || !schedule.cleaner_id || schedule.cleaner_id === 'manual'
              ? null
              : schedule.cleaner_id;

            return {
              id: bookingId,
              customer_id: schedule.customer_id,
              cleaner_id: cleanerIdForInsert,
              booking_date: dateStr,
              booking_time: timeStr,
              service_type: schedule.service_type,
              customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown Customer',
              customer_email: customer.email || '',
              customer_phone: customer.phone || '',
              address_line1: schedule.address_line1,
              address_suburb: schedule.address_suburb,
              address_city: schedule.address_city,
              total_amount: pricing.total * 100, // Convert to cents
              requires_team: requiresTeam,
              price_snapshot: priceSnapshot,
              status: 'pending',
              recurring_schedule_id: schedule.id,
            };
          });

        if (bookingsToCreate.length === 0) {
          console.log(`[Cron] Schedule ${schedule.id}: All dates already have bookings`);
          // Still update last_generated_month
          await svc
            .from('recurring_schedules')
            .update({ last_generated_month: nextMonthYear })
            .eq('id', schedule.id);
          continue;
        }

        // Insert bookings in batch
        const { error: insertError } = await svc
          .from('bookings')
          .insert(bookingsToCreate);

        if (insertError) {
          errors.push(`Schedule ${schedule.id}: Failed to create bookings - ${insertError.message}`);
          console.error(`[Cron] Schedule ${schedule.id}: Insert error:`, insertError);
          continue;
        }

        // Update last_generated_month
        const { error: updateError } = await svc
          .from('recurring_schedules')
          .update({ last_generated_month: nextMonthYear })
          .eq('id', schedule.id);

        if (updateError) {
          errors.push(`Schedule ${schedule.id}: Failed to update last_generated_month - ${updateError.message}`);
          console.error(`[Cron] Schedule ${schedule.id}: Update error:`, updateError);
        } else {
          totalGenerated += bookingsToCreate.length;
          console.log(`[Cron] Schedule ${schedule.id}: Created ${bookingsToCreate.length} bookings for ${nextMonthYear}`);
        }
      } catch (error: any) {
        const errorMsg = `Schedule ${schedule.id}: ${error.message || 'Unknown error'}`;
        errors.push(errorMsg);
        console.error(`[Cron] Error processing schedule ${schedule.id}:`, error);
        // Continue with next schedule
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Processed ${processed} schedules, generated ${totalGenerated} bookings for ${nextMonthYear}`,
      processed,
      generated: totalGenerated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e: any) {
    console.error('[Cron] Fatal error in generate-recurring-bookings:', e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

