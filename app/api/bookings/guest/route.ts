import { NextResponse } from 'next/server';
import { sendEmail, generateBookingConfirmationEmail, generateAdminBookingNotificationEmail } from '@/lib/email';
import { supabase } from '@/lib/supabase';
import { generateUniqueBookingId } from '@/lib/booking-id';
import { calculateCleanerEarnings } from '@/lib/cleaner-earnings';
import type { BookingStateV2 } from '@/lib/useBookingV2';

/**
 * Guest booking API endpoint (no authentication required)
 * Creates bookings without payment verification for testing/development
 */
export async function POST(req: Request) {
  try {
    const body: BookingStateV2 & { totalAmount: number; serviceFee?: number; frequencyDiscount?: number } = await req.json();
    
    if (!body.service || !body.date || !body.time || !body.email || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { ok: false, error: 'Missing required booking fields' },
        { status: 400 }
      );
    }

    if (!body.totalAmount || body.totalAmount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Total amount is required and must be greater than 0' },
        { status: 400 }
      );
    }

    const bookingId = generateUniqueBookingId();
    let customerId = null;

    // Create or get customer profile (no auth required for guests)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id, email, total_bookings')
        .ilike('email', body.email)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        await supabase
          .from('customers')
          .update({
            phone: body.phone,
            first_name: body.firstName,
            last_name: body.lastName,
            address_line1: body.address.line1,
            address_suburb: body.address.suburb,
            address_city: body.address.city,
            total_bookings: (existingCustomer.total_bookings || 0) + 1,
          })
          .eq('id', existingCustomer.id);
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            email: body.email.toLowerCase().trim(),
            phone: body.phone,
            first_name: body.firstName,
            last_name: body.lastName,
            address_line1: body.address.line1,
            address_suburb: body.address.suburb,
            address_city: body.address.city,
            total_bookings: 1,
          })
          .select()
          .single();

        if (!customerError && newCustomer) {
          customerId = newCustomer.id;
        }
      }
    }

    // Save booking to database
    const requiresTeam = body.service === 'Deep' || body.service === 'Move In/Out';
    
    // Extract tip amount (tips go 100% to cleaner, separate from commission)
    const tipAmount = (body.tipAmount || 0);
    const tipAmountInCents = Math.round(tipAmount * 100);
    const serviceTotal = (body.totalAmount || 0) - tipAmount;
    
    let cleanerEarnings = 0;
    let cleanerIdForInsert = null;
    
    if (!requiresTeam && body.cleaner_id && body.cleaner_id !== 'manual') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(body.cleaner_id)) {
        cleanerIdForInsert = body.cleaner_id;
        
        const { data: cleanerData } = await supabase
          .from('cleaners')
          .select('hire_date')
          .eq('id', body.cleaner_id)
          .single();
        
        const cleanerHireDate = cleanerData?.hire_date || null;
        // Calculate earnings: commission on service + 100% of tip
        cleanerEarnings = calculateCleanerEarnings(
          body.totalAmount ?? null, // Total includes tip
          body.serviceFee ?? null,
          cleanerHireDate,
          tipAmount, // Pass tip amount to exclude from commission calculation
          body.service ?? null // Pass service type for minimum commission check
        ) * 100;
      }
    }

    const frequencyForDb = body.frequency === 'one-time' ? null : body.frequency;
    
    const priceSnapshot = {
      service: {
        type: body.service,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
      },
      extras: body.extras || [],
      frequency: frequencyForDb,
      service_fee: (body.serviceFee || 0) * 100,
      frequency_discount: (body.frequencyDiscount || 0) * 100,
      tip_amount: tipAmountInCents, // Store tip separately
      subtotal: serviceTotal ? (serviceTotal - (body.serviceFee || 0) + (body.frequencyDiscount || 0)) * 100 : 0,
      total: (body.totalAmount || 0) * 100, // Total includes tip
      snapshot_date: new Date().toISOString(),
    };

    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        customer_id: customerId,
        cleaner_id: requiresTeam ? null : cleanerIdForInsert,
        booking_date: body.date,
        booking_time: body.time,
        service_type: body.service,
        customer_name: `${body.firstName} ${body.lastName}`,
        customer_email: body.email,
        customer_phone: body.phone,
        address_line1: body.address.line1,
        address_suburb: body.address.suburb,
        address_city: body.address.city,
        payment_reference: null, // No payment for guest bookings
        total_amount: (body.totalAmount || 0) * 100, // Total includes tip
        tip_amount: tipAmountInCents, // Store tip separately (goes 100% to cleaner)
        cleaner_earnings: cleanerEarnings,
        requires_team: requiresTeam,
        frequency: frequencyForDb,
        service_fee: (body.serviceFee || 0) * 100,
        frequency_discount: (body.frequencyDiscount || 0) * 100,
        price_snapshot: priceSnapshot,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { ok: false, error: `Failed to save booking: ${bookingError.message}` },
        { status: 500 }
      );
    }

    // Create team record if needed
    if (requiresTeam && body.selected_team) {
      await supabase
        .from('booking_teams')
        .insert({
          booking_id: bookingId,
          team_name: body.selected_team,
          supervisor_id: null,
        });
    }

    // Send confirmation emails
    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
        const customerEmailData = generateBookingConfirmationEmail({
          step: 6,
          service: body.service,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          address: body.address,
          date: body.date,
          time: body.time,
          bedrooms: body.bedrooms,
          bathrooms: body.bathrooms,
          extras: body.extras || [],
          extrasQuantities: body.extrasQuantities || {},
          notes: body.notes || '',
          frequency: body.frequency || 'one-time',
          cleaner_id: body.cleaner_id || undefined,
          selected_team: body.selected_team || undefined,
          requires_team: body.requires_team || false,
          bookingId,
        });
        
        const adminEmailData = generateAdminBookingNotificationEmail({
          step: 6,
          service: body.service,
          firstName: body.firstName,
          lastName: body.lastName,
          email: body.email,
          phone: body.phone,
          address: body.address,
          date: body.date,
          time: body.time,
          bedrooms: body.bedrooms,
          bathrooms: body.bathrooms,
          extras: body.extras || [],
          extrasQuantities: body.extrasQuantities || {},
          notes: body.notes || '',
          frequency: body.frequency || 'one-time',
          cleaner_id: body.cleaner_id || undefined,
          selected_team: body.selected_team || undefined,
          requires_team: body.requires_team || false,
          bookingId,
        });

        await Promise.all([
          sendEmail(customerEmailData),
          sendEmail(adminEmailData)
        ]);
        
        emailSent = true;
      } catch (emailErr) {
        console.error('Failed to send emails:', emailErr);
      }
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      message: 'Booking created successfully',
      emailSent,
    });
  } catch (error) {
    console.error('Guest booking error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to create booking',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { ok: false, error: 'Booking ID is required' },
      { status: 400 }
    );
  }

  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Extract extras from price_snapshot if available
    const priceSnapshot = booking.price_snapshot as any;
    const extras = priceSnapshot?.extras || [];
    const extrasQuantities = priceSnapshot?.extras_quantities || {};

    // Extract bedrooms and bathrooms from booking or price_snapshot
    const bedrooms = booking.bedrooms ?? priceSnapshot?.service?.bedrooms ?? null;
    const bathrooms = booking.bathrooms ?? priceSnapshot?.service?.bathrooms ?? null;

    // Extract payment reference if payment was successful
    const paymentReference = booking.payment_reference || null;

    return NextResponse.json({
      ok: true,
      booking: {
        id: booking.id,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        service_type: booking.service_type,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        address_line1: booking.address_line1,
        address_suburb: booking.address_suburb,
        address_city: booking.address_city,
        total_amount: booking.total_amount / 100, // Convert cents to rands
        status: booking.status,
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        payment_reference: paymentReference,
        extras: extras.map((e: any) => {
          const extraName = typeof e === 'object' && e !== null && e.name ? e.name : String(e);
          const quantity = extrasQuantities[extraName] ?? 1;
          const unitPrice = typeof e === 'object' && e !== null && e.price != null 
            ? (e.price > 100 ? e.price / 100 : e.price) 
            : 0;
          return {
            name: extraName,
            quantity: quantity,
            unitPrice: unitPrice,
            totalPrice: unitPrice * Math.max(quantity, 1),
          };
        }),
      },
    });
  } catch (error) {
    console.error('Get booking error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

