import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';
import { calculateBookingDatesForMonth, generateBookingId } from '@/lib/recurring-bookings';

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to generate bookings for all active recurring schedules
 */
export async function POST(request: NextRequest) {
  console.log('=== ADMIN GENERATE ALL RECURRING BOOKINGS ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { month, year } = body;
    
    if (!month || !year) {
      return NextResponse.json(
        { ok: false, error: 'Month and year are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const monthYear = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Get all active recurring schedules that haven't been generated for this month
    const { data: schedules, error: schedulesError } = await supabase
      .from('recurring_schedules')
      .select('*')
      .eq('is_active', true)
      .or(`last_generated_month.is.null,last_generated_month.neq.${monthYear}`);
    
    if (schedulesError) throw schedulesError;
    
    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        ok: true,
        schedules_processed: 0,
        bookings_created: 0,
        message: 'No active schedules found or all schedules already generated for this month',
      });
    }

    console.log(`Processing ${schedules.length} active schedules for ${monthYear}`);

    let totalBookingsCreated = 0;
    const errors: string[] = [];
    const allBookings: Array<{
      id: string;
      booking_date: string;
      booking_time: string;
      customer_name: string;
    }> = [];

    // Process each schedule
    for (const schedule of schedules) {
      try {
        // Calculate booking dates for this schedule
        const bookingDates = calculateBookingDatesForMonth(schedule, year, month);
        
        if (bookingDates.length === 0) {
          console.log(`No dates to generate for schedule ${schedule.id}`);
          continue;
        }

        // Check for existing bookings to avoid conflicts
        const existingBookings = await supabase
          .from('bookings')
          .select('booking_date, booking_time')
          .eq('customer_id', schedule.customer_id)
          .in('booking_date', bookingDates.map(date => date.toISOString().split('T')[0]));

        const conflictingDates = new Set(
          existingBookings.data?.map(b => `${b.booking_date}_${b.booking_time}`) || []
        );

        // Get customer details for the bookings
        const { data: customer } = await supabase
          .from('customers')
          .select('first_name, last_name, email, phone')
          .eq('id', schedule.customer_id)
          .single();

        // Prepare cleaner_id with proper UUID handling
        let cleanerIdForInsert = null;
        if (schedule.cleaner_id) {
          cleanerIdForInsert = schedule.cleaner_id;
        }

        // Create price snapshot
        const priceSnapshot = {
          service: {
            type: schedule.service_type,
            bedrooms: schedule.bedrooms,
            bathrooms: schedule.bathrooms,
          },
          extras: schedule.extras || [],
          frequency: schedule.frequency,
          service_fee: 0,
          frequency_discount: 0,
          subtotal: 0,
          total: 0,
          snapshot_date: new Date().toISOString(),
        };

        // Create bookings for non-conflicting dates
        const bookings = bookingDates
          .filter(date => {
            const dateStr = date.toISOString().split('T')[0];
            const timeStr = schedule.preferred_time;
            return !conflictingDates.has(`${dateStr}_${timeStr}`);
          })
          .map(date => ({
            id: generateBookingId(),
            customer_id: schedule.customer_id,
            cleaner_id: cleanerIdForInsert,
            service_type: schedule.service_type,
            customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
            customer_email: customer?.email || '',
            customer_phone: customer?.phone || '',
            address_line1: schedule.address_line1,
            address_suburb: schedule.address_suburb,
            address_city: schedule.address_city,
            booking_date: date.toISOString().split('T')[0],
            booking_time: schedule.preferred_time,
            payment_reference: generateBookingId(),
            status: 'pending', // All bookings start as pending for cleaner workflow
            total_amount: 0,
            service_fee: 0,
            frequency: schedule.frequency,
            frequency_discount: 0,
            cleaner_earnings: 0,
            price_snapshot: priceSnapshot,
            recurring_schedule_id: schedule.id,
          }));

        if (bookings.length > 0) {
          // Insert bookings
          const { error: bookingsError } = await supabase
            .from('bookings')
            .insert(bookings);

          if (bookingsError) {
            console.error(`Error creating bookings for schedule ${schedule.id}:`, bookingsError);
            errors.push(`Schedule ${schedule.id}: ${bookingsError.message}`);
            continue;
          }

          const customerName = customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown';

          // Add to results
          allBookings.push(...bookings.map(b => ({
            id: b.id,
            booking_date: b.booking_date,
            booking_time: b.booking_time,
            customer_name: customerName,
          })));

          totalBookingsCreated += bookings.length;
          console.log(`✅ Generated ${bookings.length} bookings for schedule ${schedule.id}`);
        }

        // Update last generated month for this schedule
        await supabase
          .from('recurring_schedules')
          .update({ last_generated_month: monthYear })
          .eq('id', schedule.id);

      } catch (scheduleError) {
        console.error(`Error processing schedule ${schedule.id}:`, scheduleError);
        errors.push(`Schedule ${schedule.id}: ${scheduleError instanceof Error ? scheduleError.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ Generated ${totalBookingsCreated} bookings across ${schedules.length} schedules`);

    return NextResponse.json({
      ok: true,
      schedules_processed: schedules.length,
      bookings_created: totalBookingsCreated,
      errors,
      bookings: allBookings,
      message: `Successfully generated ${totalBookingsCreated} bookings for ${monthYear}`,
    });

  } catch (error) {
    console.error('=== ADMIN GENERATE ALL RECURRING BOOKINGS ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate recurring bookings' },
      { status: 500 }
    );
  }
}
