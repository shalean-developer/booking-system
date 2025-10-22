import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';
import { calculateBookingDatesForMonth, generateBookingId, getMonthYearString } from '@/lib/recurring-bookings';

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to generate bookings for a specific recurring schedule
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== ADMIN GENERATE SCHEDULE BOOKINGS ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { month, year } = body;
    
    if (!month || !year) {
      return NextResponse.json(
        { ok: false, error: 'Month and year are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get the recurring schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('recurring_schedules')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (scheduleError || !schedule) {
      return NextResponse.json(
        { ok: false, error: 'Recurring schedule not found or inactive' },
        { status: 404 }
      );
    }

    const monthYear = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Check if already generated for this month
    if (schedule.last_generated_month === monthYear) {
      return NextResponse.json(
        { ok: false, error: `Bookings already generated for ${monthYear}` },
        { status: 400 }
      );
    }

    // Calculate booking dates for the month
    const bookingDates = calculateBookingDatesForMonth(schedule, year, month);
    
    if (bookingDates.length === 0) {
      return NextResponse.json({
        ok: true,
        bookings_created: 0,
        message: `No bookings to generate for ${monthYear}`,
      });
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

    if (bookings.length === 0) {
      return NextResponse.json({
        ok: true,
        bookings_created: 0,
        message: `All dates for ${monthYear} have conflicting bookings`,
      });
    }

    // Insert bookings
    const { error: bookingsError } = await supabase
      .from('bookings')
      .insert(bookings);

    if (bookingsError) {
      console.error('Error creating bookings:', bookingsError);
      throw bookingsError;
    }

    // Update last generated month
    await supabase
      .from('recurring_schedules')
      .update({ last_generated_month: monthYear })
      .eq('id', id);

    console.log(`✅ Generated ${bookings.length} bookings for schedule ${id}`);

    return NextResponse.json({
      ok: true,
      bookings_created: bookings.length,
      conflicting_dates: bookingDates.length - bookings.length,
      bookings: bookings.map(b => ({
        id: b.id,
        booking_date: b.booking_date,
        booking_time: b.booking_time,
      })),
      message: `Successfully generated ${bookings.length} bookings for ${monthYear}`,
    });

  } catch (error) {
    console.error('=== ADMIN GENERATE SCHEDULE BOOKINGS ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to generate bookings' },
      { status: 500 }
    );
  }
}
