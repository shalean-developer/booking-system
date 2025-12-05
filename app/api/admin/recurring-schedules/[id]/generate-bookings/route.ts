import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { calculateBookingDatesForMonth, getMonthYearString } from '@/lib/recurring-bookings';
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization first
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }
    
    const supabase = createServiceClient();

    // Get year and month from request body, default to next month
    const today = new Date();
    const targetYear = body?.year ? parseInt(String(body.year)) : (today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear());
    const targetMonth = body?.month ? parseInt(String(body.month)) : (today.getMonth() === 11 ? 1 : today.getMonth() + 2);
    
    // Validate year and month
    if (isNaN(targetYear) || targetYear < 2024 || targetYear > 2100) {
      return NextResponse.json(
        { ok: false, error: 'Invalid year. Must be between 2024 and 2100' },
        { status: 400 }
      );
    }
    
    if (isNaN(targetMonth) || targetMonth < 1 || targetMonth > 12) {
      return NextResponse.json(
        { ok: false, error: 'Invalid month. Must be between 1 and 12' },
        { status: 400 }
      );
    }
    
    const monthYear = getMonthYearString(new Date(targetYear, targetMonth - 1, 1));

    // Get the recurring schedule
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
        { ok: false, error: 'Cannot generate bookings for inactive schedule' },
        { status: 400 }
      );
    }

    // Fetch customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .eq('id', schedule.customer_id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate booking dates for target month
    const bookingDates = calculateBookingDatesForMonth(schedule as RecurringSchedule, targetYear, targetMonth);

    // Filter dates that fall within schedule's start_date and end_date
    const scheduleStartDate = new Date(schedule.start_date);
    const validDates = bookingDates.filter((date) => {
      if (date < scheduleStartDate) return false;
      if (schedule.end_date && date > new Date(schedule.end_date)) return false;
      return true;
    });

    if (validDates.length === 0) {
      return NextResponse.json({
        ok: true,
        message: `No valid booking dates for ${monthYear}`,
        generatedCount: 0,
        skippedCount: 0,
      });
    }

    // Use stored pricing if available, otherwise calculate
    let totalAmountCents: number;
    let cleanerEarningsCents: number | null = null;
    let priceSnapshot: any;

    if (schedule.total_amount && schedule.total_amount > 0) {
      // Use stored pricing from schedule
      totalAmountCents = schedule.total_amount;
      cleanerEarningsCents = schedule.cleaner_earnings || null;
      
      // Calculate price snapshot from stored values
      const totalAmountRands = totalAmountCents / 100;
      const serviceFee = 50; // Default service fee
      const subtotal = totalAmountRands - serviceFee;
      
      priceSnapshot = {
        service_type: schedule.service_type,
        bedrooms: schedule.bedrooms,
        bathrooms: schedule.bathrooms,
        extras: schedule.extras || [],
        extrasQuantities: schedule.extras_quantities || schedule.extrasQuantities || {},
        notes: schedule.notes || null,
        subtotal: Math.round(subtotal),
        serviceFee: serviceFee,
        frequencyDiscount: 0,
        total: totalAmountRands,
        snapshot_date: new Date().toISOString(),
        manual_pricing: true,
      };
    } else {
      // Calculate pricing dynamically
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

      totalAmountCents = pricing.total * 100;
      const subtotalAfterFee = pricing.total - pricing.serviceFee;
      cleanerEarningsCents = Math.round(subtotalAfterFee * 0.60 * 100);

      priceSnapshot = {
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
    }

    // Check for existing bookings to avoid duplicates
    const dateStrings = validDates.map((d) => d.toISOString().split('T')[0]);
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('booking_date')
      .eq('recurring_schedule_id', id)
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
        const timeStr = schedule.preferred_time;

        // Determine if team booking
        const requiresTeam = schedule.service_type === 'Deep' || schedule.service_type === 'Move In/Out';
        const cleanerIdForInsert = requiresTeam || !schedule.cleaner_id || schedule.cleaner_id === 'manual'
          ? null
          : schedule.cleaner_id;

        const bookingData: any = {
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
          total_amount: totalAmountCents,
          requires_team: requiresTeam,
          price_snapshot: priceSnapshot,
          status: 'pending',
          recurring_schedule_id: schedule.id,
        };

        if (cleanerEarningsCents !== null) {
          bookingData.cleaner_earnings = cleanerEarningsCents;
        }

        return bookingData;
      });

    if (bookingsToCreate.length === 0) {
      return NextResponse.json({
        ok: true,
        message: `All bookings for ${monthYear} already exist`,
        generatedCount: 0,
        skippedCount: validDates.length,
      });
    }

    // Insert bookings
    const { error: insertError } = await supabase
      .from('bookings')
      .insert(bookingsToCreate);

    if (insertError) {
      console.error('Error creating bookings:', insertError);
      return NextResponse.json(
        { ok: false, error: `Failed to create bookings: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Update last_generated_month
    await supabase
      .from('recurring_schedules')
      .update({ last_generated_month: monthYear })
      .eq('id', id);

    return NextResponse.json({
      ok: true,
      message: `Successfully generated ${bookingsToCreate.length} booking(s) for ${monthYear}`,
      generatedCount: bookingsToCreate.length,
      skippedCount: validDates.length - bookingsToCreate.length,
      monthYear,
    });
  } catch (error: any) {
    console.error('Error generating bookings:', error);
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

