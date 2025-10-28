import { NextResponse } from 'next/server';
import { sendEmail, generateBookingConfirmationEmail, generateAdminBookingNotificationEmail } from '@/lib/email';
import { BookingState } from '@/types/booking';
import { supabase } from '@/lib/supabase';
import { validateBookingEnv } from '@/lib/env-validation';
import { getServerAuthUser } from '@/lib/supabase-server';
import { calculateCleanerEarnings } from '@/lib/cleaner-earnings';
import { generateUniqueBookingId } from '@/lib/booking-id';

/**
 * Fast booking processing endpoint for background processing
 * - Single payment verification
 * - Parallel email sending
 * - Optimized for speed
 */
export async function POST(req: Request) {
  console.log('=== BACKGROUND BOOKING PROCESSING ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Parse booking data
    const body: BookingState & { paymentReference: string; totalAmount: number; serviceFee?: number; frequencyDiscount?: number } = await req.json();
    
    const { paymentReference, totalAmount } = body;
    
    if (!paymentReference) {
      return NextResponse.json(
        { ok: false, error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Total amount is required' },
        { status: 400 }
      );
    }

    console.log('Processing booking for payment reference:', paymentReference);

    // STEP 1: Verify payment with Paystack (single verification)
    console.log('Step 1: Verifying payment with Paystack...');
    try {
      const verifyUrl = `https://api.paystack.co/transaction/verify/${paymentReference}`;
      const verifyResponse = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok || verifyData.data?.status !== 'success') {
        console.error('❌ Payment verification failed');
        return NextResponse.json(
          { ok: false, error: 'Payment verification failed' },
          { status: 400 }
        );
      }

      console.log('✅ Payment verified successfully');
    } catch (verifyError) {
      console.error('❌ Payment verification error:', verifyError);
      return NextResponse.json(
        { ok: false, error: 'Failed to verify payment' },
        { status: 500 }
      );
    }

    // STEP 2: Generate booking ID and handle customer
    const bookingId = paymentReference || generateUniqueBookingId();
    let customerId = (body as any).customer_id || null;
    
    // Handle customer profile creation/update
    const authUser = await getServerAuthUser();
    
    if (authUser) {
      const { data: authProfile } = await supabase
        .from('customers')
        .select('id, email, total_bookings, auth_user_id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      
      if (authProfile) {
        customerId = authProfile.id;
        await supabase
          .from('customers')
          .update({
            phone: body.phone,
            first_name: body.firstName,
            last_name: body.lastName,
            address_line1: body.address.line1,
            address_suburb: body.address.suburb,
            address_city: body.address.city,
            total_bookings: (authProfile.total_bookings || 0) + 1,
          })
          .eq('id', authProfile.id);
      }
    }

    if (!customerId) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id, email, total_bookings, auth_user_id')
        .ilike('email', body.email)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        const updateData: any = {
          phone: body.phone,
          first_name: body.firstName,
          last_name: body.lastName,
          address_line1: body.address.line1,
          address_suburb: body.address.suburb,
          address_city: body.address.city,
          total_bookings: (existingCustomer.total_bookings || 0) + 1,
        };
        
        if (authUser && !existingCustomer.auth_user_id) {
          updateData.auth_user_id = authUser.id;
        }
        
        await supabase
          .from('customers')
          .update(updateData)
          .eq('id', existingCustomer.id);
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            email: body.email,
            phone: body.phone,
            first_name: body.firstName,
            last_name: body.lastName,
            address_line1: body.address.line1,
            address_suburb: body.address.suburb,
            address_city: body.address.city,
            total_bookings: 1,
            auth_user_id: authUser?.id || null,
          })
          .select()
          .single();
        
        if (newCustomer) {
          customerId = newCustomer.id;
        }
      }
    }

    // STEP 3: Prepare booking data
    const requiresTeam = body.service === 'Deep' || body.service === 'Move In/Out';
    
    let cleanerEarnings = 0;
    if (!requiresTeam && body.cleaner_id && body.cleaner_id !== 'manual') {
      const { data: cleanerData } = await supabase
        .from('cleaners')
        .select('hire_date')
        .eq('id', body.cleaner_id)
        .maybeSingle();
      
      const cleanerHireDate = cleanerData?.hire_date || null;
      cleanerEarnings = calculateCleanerEarnings(
        totalAmount ?? null,
        body.serviceFee ?? null,
        cleanerHireDate
      ) * 100;
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
      subtotal: totalAmount ? (totalAmount - (body.serviceFee || 0) + (body.frequencyDiscount || 0)) * 100 : 0,
      total: (totalAmount || 0) * 100,
      snapshot_date: new Date().toISOString(),
    };

    let cleanerIdForInsert = null;
    if (body.cleaner_id && body.cleaner_id !== 'manual') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(body.cleaner_id)) {
        cleanerIdForInsert = body.cleaner_id;
      }
    }

    // STEP 4: Save to database and send emails in parallel
    console.log('Step 4: Saving booking and sending emails in parallel...');
    
    const [dbResult, emailResult] = await Promise.all([
      // Database operation
      (async () => {
        try {
          const { data, error } = await supabase
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
              payment_reference: paymentReference,
              total_amount: (totalAmount || 0) * 100,
              cleaner_earnings: cleanerEarnings,
              requires_team: requiresTeam,
              frequency: frequencyForDb,
              service_fee: (body.serviceFee || 0) * 100,
              frequency_discount: (body.frequencyDiscount || 0) * 100,
              price_snapshot: priceSnapshot,
              status: 'pending',
            })
            .select();

          if (error) throw error;

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

          return { ok: true, data };
        } catch (error) {
          console.error('Database error:', error);
          return { ok: false, error };
        }
      })(),

      // Email operations (parallel)
      (async () => {
        try {
          if (!process.env.RESEND_API_KEY) {
            return { ok: false, error: 'Email service not configured' };
          }

          const [customerEmailResult, adminEmailResult] = await Promise.all([
            sendEmail(generateBookingConfirmationEmail({
              ...body,
              bookingId
            })),
            sendEmail(generateAdminBookingNotificationEmail({
              ...body,
              bookingId
            })),
          ]);

          return { ok: true, customerEmailResult, adminEmailResult };
        } catch (error) {
          console.error('Email error:', error);
          return { ok: false, error };
        }
      })(),
    ]);

    // Handle results
    if (!dbResult.ok) {
      return NextResponse.json(
        { ok: false, error: 'Failed to save booking', details: dbResult.error },
        { status: 500 }
      );
    }

    console.log('✅ Booking processed successfully');
    
    // Fetch full booking data for response
    const { data: bookingData } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    return NextResponse.json({
      ok: true,
      bookingId,
      booking: bookingData,
      dbSaved: true,
      emailSent: emailResult.ok,
      message: 'Booking processed successfully',
    });
  } catch (error) {
    console.error('Background processing error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to process booking',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

