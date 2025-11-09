import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, isAdmin } from '@/lib/supabase-server';
import { CreateBookingFormData } from '@/types/recurring';
import { generateBookingId, calculateBookingDatesForMonth, validateRecurringSchedule } from '@/lib/recurring-bookings';
import { calcTotalAsync } from '@/lib/pricing';
import { calculateCleanerEarnings } from '@/lib/cleaner-earnings';
import { ServiceType } from '@/types/booking';

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to create bookings (both one-time and recurring)
 */
export async function POST(request: NextRequest) {
  console.log('=== ADMIN CREATE BOOKING ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body: CreateBookingFormData = await request.json();
    const supabase = createServiceClient();

    console.log('Creating booking:', {
      type: body.booking_type,
      customer_id: body.customer_id,
      service_type: body.service_type,
    });

    if (body.booking_type === 'one-time') {
      return await createOneTimeBooking(supabase, body);
    } else {
      return await createRecurringBooking(supabase, body);
    }

  } catch (error) {
    console.error('=== ADMIN CREATE BOOKING ERROR ===', error);
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to create booking',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate cleaner earnings
async function calculateCleanerEarningsForCleaner(supabase: any, cleanerId: string, totalAmount: number, serviceFee: number): Promise<number> {
  try {
    const { data: cleaner } = await supabase
      .from('cleaners')
      .select('hire_date')
      .eq('id', cleanerId)
      .single();
    
    return calculateCleanerEarnings(totalAmount, serviceFee, cleaner?.hire_date);
  } catch (error) {
    console.warn('Failed to fetch cleaner hire date, using default commission rate:', error);
    return calculateCleanerEarnings(totalAmount, serviceFee, null);
  }
}

async function createOneTimeBooking(supabase: any, data: CreateBookingFormData) {
  const bookingId = generateBookingId();
  
  // Get customer details for the booking
  const { data: customer } = await supabase
    .from('customers')
    .select('first_name, last_name, email, phone')
    .eq('id', data.customer_id)
    .single();

  // Prepare cleaner_id with proper UUID handling
  let cleanerIdForInsert = null;
  if (data.cleaner_id && data.cleaner_id !== 'manual') {
    cleanerIdForInsert = data.cleaner_id;
  }

  // Use manual pricing if provided, otherwise calculate automatically
  let totalInCents, serviceFeeInCents, frequencyDiscountInCents, cleanerEarnings;
  
  const extrasQuantities = (data.extrasQuantities || data.extras_quantities || {}) as Record<string, number>;

  if (data.total_amount && data.total_amount > 0) {
    // Use manual pricing
    totalInCents = Math.round(data.total_amount * 100);
    serviceFeeInCents = Math.round((data.service_fee || 0) * 100);
    frequencyDiscountInCents = 0; // Manual pricing doesn't include frequency discounts
    cleanerEarnings = Math.round((data.cleaner_earnings || 0) * 100);
  } else {
    // Calculate pricing automatically
    const pricingDetails = await calcTotalAsync(
      {
        service: data.service_type as ServiceType,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        extras: data.extras || [],
        extrasQuantities,
      },
      'one-time'
    );

    // Convert pricing details from rands to cents
    totalInCents = Math.round(pricingDetails.total * 100);
    serviceFeeInCents = Math.round(pricingDetails.serviceFee * 100);
    frequencyDiscountInCents = Math.round(pricingDetails.frequencyDiscount * 100);

    // Calculate cleaner earnings (in cents)
    cleanerEarnings = cleanerIdForInsert 
      ? await calculateCleanerEarningsForCleaner(supabase, cleanerIdForInsert, pricingDetails.total, pricingDetails.serviceFee) * 100
      : 0;
  }

  // Check if this is a team-based booking
  const requiresTeam = data.service_type === 'Deep' || data.service_type === 'Move In/Out';
  
  // For team bookings, earnings will be calculated when team is assigned
  if (requiresTeam) {
    cleanerEarnings = 0;
  }

  // Create price snapshot for historical record (in cents)
  const priceSnapshot = {
    service: {
      type: data.service_type,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
    },
    extras: data.extras || [],
    extras_quantities: extrasQuantities,
    frequency: 'one-time', // Keep 'one-time' in snapshot for historical record
    service_fee: serviceFeeInCents,
    frequency_discount: frequencyDiscountInCents,
    subtotal: totalInCents - serviceFeeInCents + frequencyDiscountInCents, // Calculate subtotal
    total: totalInCents,
    snapshot_date: new Date().toISOString(),
    manual_pricing: data.total_amount && data.total_amount > 0, // Flag to indicate manual pricing
  };
  
  const bookingData = {
    id: bookingId,
    customer_id: data.customer_id,
    cleaner_id: requiresTeam ? null : cleanerIdForInsert, // Use NULL for team bookings
    service_type: data.service_type,
    customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
    customer_email: customer?.email || '',
    customer_phone: customer?.phone || '',
    address_line1: data.address_line1,
    address_suburb: data.address_suburb,
    address_city: data.address_city,
    booking_date: data.booking_date,
    booking_time: data.booking_time,
    payment_reference: bookingId, // Use booking ID as reference for admin-created bookings
    status: 'pending', // All bookings start as pending for cleaner workflow
    total_amount: totalInCents,
    service_fee: serviceFeeInCents,
    frequency: null, // One-time bookings have NULL frequency
    frequency_discount: frequencyDiscountInCents,
    cleaner_earnings: cleanerEarnings,
    requires_team: requiresTeam, // Flag for team-based bookings
    price_snapshot: priceSnapshot,
  };

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert([bookingData])
    .select()
    .single();

  if (error) {
    console.error('Error creating one-time booking:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create booking', details: error.message },
      { status: 500 }
    );
  }

  console.log('✅ One-time booking created:', bookingId);

  return NextResponse.json({
    ok: true,
    booking,
    message: 'One-time booking created successfully',
  });
}

async function createRecurringBooking(supabase: any, data: CreateBookingFormData) {
  // Validate recurring schedule data
  const validationErrors = validateRecurringSchedule(data);
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { ok: false, error: 'Validation failed', details: validationErrors },
      { status: 400 }
    );
  }

  // Create recurring schedule
  const scheduleData = {
    customer_id: data.customer_id,
    service_type: data.service_type,
    frequency: data.frequency,
    day_of_week: (data.frequency === 'custom-weekly' || data.frequency === 'custom-bi-weekly') ? null : data.day_of_week,
    day_of_month: data.day_of_month,
    days_of_week: (data.frequency === 'custom-weekly' || data.frequency === 'custom-bi-weekly') ? data.days_of_week : null,
    preferred_time: data.preferred_time,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    extras: data.extras,
    notes: data.notes,
    address_line1: data.address_line1,
    address_suburb: data.address_suburb,
    address_city: data.address_city,
    cleaner_id: data.cleaner_id || null,
    start_date: data.start_date,
    end_date: data.end_date || null,
    is_active: true,
  };

  const { data: schedule, error: scheduleError } = await supabase
    .from('recurring_schedules')
    .insert([scheduleData])
    .select()
    .single();

  if (scheduleError) {
    console.error('Error creating recurring schedule:', scheduleError);
    console.error('Schedule error details:', JSON.stringify(scheduleError, null, 2));
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to create recurring schedule', 
        details: scheduleError.message,
        debug: process.env.NODE_ENV === 'development' ? scheduleError : undefined
      },
      { status: 500 }
    );
  }

  console.log('✅ Recurring schedule created:', schedule.id);

  // Generate bookings for current month if requested
  let bookingsCreated = 0;
  if (data.generate_current_month) {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const bookingDates = calculateBookingDatesForMonth(schedule, year, month);
    
    // Get customer details for the bookings
    const { data: customer } = await supabase
      .from('customers')
      .select('first_name, last_name, email, phone')
      .eq('id', data.customer_id)
      .single();

    // Prepare cleaner_id with proper UUID handling
    let cleanerIdForInsert = null;
    if (data.cleaner_id && data.cleaner_id !== 'manual') {
      cleanerIdForInsert = data.cleaner_id;
    }

    // Use manual pricing if provided, otherwise calculate automatically
    let totalWithoutServiceFee, serviceFeeInCents, frequencyDiscountInCents, cleanerEarnings;
    
    if (data.total_amount && data.total_amount > 0) {
      // Use manual pricing for recurring bookings
      totalWithoutServiceFee = Math.round(data.total_amount * 100);
      serviceFeeInCents = 0; // Recurring bookings always have no service fee
      frequencyDiscountInCents = 0; // Manual pricing doesn't include frequency discounts
      cleanerEarnings = Math.round((data.cleaner_earnings || 0) * 100);
    } else {
      // Calculate pricing automatically
      const pricingFrequency = data.frequency === 'custom-weekly' ? 'weekly' :
                             data.frequency === 'custom-bi-weekly' ? 'bi-weekly' :
                             data.frequency;

      const pricingDetails = await calcTotalAsync(
        {
          service: data.service_type as ServiceType,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          extras: data.extras || [],
          extrasQuantities,
        },
        pricingFrequency as 'weekly' | 'bi-weekly' | 'monthly'
      );

      // Recurring bookings have NO service fee
      serviceFeeInCents = 0;
      totalWithoutServiceFee = Math.round((pricingDetails.subtotal - pricingDetails.frequencyDiscount) * 100);
      frequencyDiscountInCents = Math.round(pricingDetails.frequencyDiscount * 100);

      // Calculate cleaner earnings (60% or 70% based on experience)
      cleanerEarnings = cleanerIdForInsert 
        ? await calculateCleanerEarningsForCleaner(supabase, cleanerIdForInsert, pricingDetails.subtotal - pricingDetails.frequencyDiscount, 0) * 100
        : 0;
    }

    // Create price snapshot for historical record (in cents)
    const priceSnapshot = {
      service: {
        type: data.service_type,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
      },
      extras: data.extras || [],
      extras_quantities: extrasQuantities,
      frequency: data.frequency,
      service_fee: serviceFeeInCents, // 0 for recurring
      frequency_discount: frequencyDiscountInCents,
      subtotal: totalWithoutServiceFee,
      total: totalWithoutServiceFee,
      snapshot_date: new Date().toISOString(),
      manual_pricing: data.total_amount && data.total_amount > 0, // Flag to indicate manual pricing
    };
    
    const bookings = bookingDates.map(date => ({
      id: generateBookingId(),
      customer_id: data.customer_id,
      cleaner_id: cleanerIdForInsert,
      service_type: data.service_type,
      customer_name: customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown',
      customer_email: customer?.email || '',
      customer_phone: customer?.phone || '',
      address_line1: data.address_line1,
      address_suburb: data.address_suburb,
      address_city: data.address_city,
      booking_date: date.toISOString().split('T')[0],
      booking_time: data.preferred_time,
      payment_reference: generateBookingId(), // Unique reference for each booking
      status: 'pending', // All bookings start as pending for cleaner workflow
      total_amount: totalWithoutServiceFee,
      service_fee: serviceFeeInCents, // 0 for recurring
      frequency: data.frequency,
      frequency_discount: frequencyDiscountInCents,
      cleaner_earnings: cleanerEarnings,
      price_snapshot: priceSnapshot,
      recurring_schedule_id: schedule.id,
    }));

    if (bookings.length > 0) {
      const { error: bookingsError } = await supabase
        .from('bookings')
        .insert(bookings);

      if (bookingsError) {
        console.error('Error creating recurring bookings:', bookingsError);
        console.error('Bookings error details:', JSON.stringify(bookingsError, null, 2));
        return NextResponse.json(
          { 
            ok: false, 
            error: 'Failed to create recurring bookings', 
            details: bookingsError.message,
            debug: process.env.NODE_ENV === 'development' ? bookingsError : undefined
          },
          { status: 500 }
        );
      }

      bookingsCreated = bookings.length;
      console.log(`✅ Created ${bookingsCreated} recurring bookings for current month`);
    }

    // Update last generated month
    const monthYear = `${year}-${month.toString().padStart(2, '0')}`;
    await supabase
      .from('recurring_schedules')
      .update({ last_generated_month: monthYear })
      .eq('id', schedule.id);
  }

  return NextResponse.json({
    ok: true,
    schedule,
    bookings_created: bookingsCreated,
    message: `Recurring schedule created successfully${bookingsCreated > 0 ? ` with ${bookingsCreated} bookings for this month` : ''}`,
  });
}
