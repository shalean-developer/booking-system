import { NextResponse } from 'next/server';
import { sendEmail, generateBookingConfirmationEmail, generateAdminBookingNotificationEmail } from '@/lib/email';
import { BookingState } from '@/types/booking';
import { supabase } from '@/lib/supabase';
import { validateBookingEnv } from '@/lib/env-validation';

/**
 * API endpoint to handle booking submissions
 * Requires payment verification before confirming booking
 * Database save and email sending are REQUIRED operations
 */
export async function POST(req: Request) {
  console.log('=== BOOKING API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // STEP 1: Validate environment variables
    console.log('Step 1: Validating environment configuration...');
    const envValidation = validateBookingEnv();
    if (!envValidation.valid) {
      console.error('❌ Environment validation failed:', envValidation.missing);
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Server configuration error: Required services not configured',
          details: envValidation.errors,
        },
        { status: 500 }
      );
    }
    console.log('✅ Environment validation passed');

    // STEP 2: Parse and validate booking data
    console.log('Step 2: Parsing booking data...');
    const body: BookingState = await req.json();
    
    console.log('=== BOOKING SUBMISSION ===');
    console.log('Service:', body.service);
    console.log('Customer:', body.firstName, body.lastName);
    console.log('Email:', body.email);
    console.log('Payment Reference:', body.paymentReference);
    console.log('Full booking data:', JSON.stringify(body, null, 2));
    console.log('========================');

    // Verify payment reference is provided
    if (!body.paymentReference) {
      console.error('❌ Payment reference missing in booking submission');
      return NextResponse.json(
        { ok: false, error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    console.log('✅ Payment reference found:', body.paymentReference);

    // STEP 3: Re-verify payment for extra security (REQUIRED)
    console.log('Step 3: Re-verifying payment with Paystack...');
    try {
      const verifyUrl = `https://api.paystack.co/transaction/verify/${body.paymentReference}`;
      console.log('Re-verification URL:', verifyUrl);
      
      const verifyResponse = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Re-verification response status:', verifyResponse.status);
      const verifyData = await verifyResponse.json();
      console.log('Re-verification data:', verifyData);
      
      if (!verifyResponse.ok || verifyData.data.status !== 'success') {
        console.error('❌ Payment re-verification failed on booking submission');
        console.error('Response ok:', verifyResponse.ok);
        console.error('Payment status:', verifyData.data?.status);
        return NextResponse.json(
          { ok: false, error: 'Payment verification failed. Please contact support if you were charged.' },
          { status: 400 }
        );
      }

      console.log('✅ Payment re-verified successfully:', body.paymentReference);
    } catch (verifyError) {
      console.error('❌ Payment re-verification error:', verifyError);
      return NextResponse.json(
        { ok: false, error: 'Failed to verify payment. Please contact support.' },
        { status: 500 }
      );
    }

    // STEP 4: Generate unique booking ID
    const bookingId = body.paymentReference || `BK-${Date.now()}`;
    console.log('Step 4: Generated booking ID:', bookingId);
    
    // STEP 5: Save booking to database (REQUIRED if configured)
    console.log('Step 5: Saving booking to database...');
    console.log('Cleaner ID:', body.cleaner_id);
    
    if (body.cleaner_id === 'manual') {
      console.log('⚠️ MANUAL CLEANER ASSIGNMENT REQUESTED');
      console.log('Admin will need to assign a cleaner for this booking');
    }
    
    let bookingData = null;
    let dbSaved = false;
    
    // Check if Supabase is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { data, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          cleaner_id: body.cleaner_id,
          booking_date: body.date,
          booking_time: body.time,
          service_type: body.service,
          customer_name: `${body.firstName} ${body.lastName}`,
          customer_email: body.email,
          customer_phone: body.phone,
          address_line1: body.address.line1,
          address_suburb: body.address.suburb,
          address_city: body.address.city,
          payment_reference: body.paymentReference,
          status: 'confirmed',
        })
        .select();

      if (bookingError) {
        console.error('❌ Failed to save booking to database:', bookingError);
        throw new Error(`Database error: ${bookingError.message}`);
      }
      
      bookingData = data;
      dbSaved = true;
      console.log('✅ Booking saved to database successfully');
      console.log('Saved booking data:', bookingData);
    } else {
      console.log('⚠️ Supabase not configured - skipping database save');
      console.log('Booking will be processed but not stored in database');
    }

    // STEP 6: Send confirmation emails (REQUIRED if configured)
    console.log('Step 6: Sending confirmation emails...');
    let emailSent = false;
    
    // Check if email service is configured
    if (process.env.RESEND_API_KEY) {
      try {
        console.log('=== EMAIL SENDING ===');
        console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL || 'onboarding@resend.dev');
        console.log('Customer email:', body.email);
        console.log('Admin email:', process.env.ADMIN_EMAIL || 'admin@shalean.com');
        console.log('Booking ID:', bookingId);

        // Send confirmation email to customer (REQUIRED)
        console.log('📧 Generating customer email...');
        const customerEmailData = generateBookingConfirmationEmail({
          ...body,
          bookingId
        });
        console.log('✅ Customer email generated');
        
        console.log('📤 Sending customer email...');
        await sendEmail(customerEmailData);
        console.log('✅ Customer confirmation email sent successfully');
        
        // Send notification email to admin (REQUIRED)
        console.log('📧 Generating admin email...');
        const adminEmailData = generateAdminBookingNotificationEmail({
          ...body,
          bookingId
        });
        console.log('✅ Admin email generated');
        
        console.log('📤 Sending admin email...');
        await sendEmail(adminEmailData);
        console.log('✅ Admin notification email sent successfully');
        
        emailSent = true;
        
      } catch (emailErr) {
        console.error('=== EMAIL SENDING FAILED ===');
        console.error('Failed to send emails:', emailErr);
        console.error('Email error details:', {
          message: emailErr instanceof Error ? emailErr.message : 'Unknown error',
          stack: emailErr instanceof Error ? emailErr.stack : undefined,
          name: emailErr instanceof Error ? emailErr.name : undefined
        });
        
        // ROLLBACK: Delete the booking from database since emails failed (only if DB was saved)
        if (dbSaved) {
          console.log('⚠️ Rolling back: Deleting booking from database...');
          try {
            const { error: deleteError } = await supabase
              .from('bookings')
              .delete()
              .eq('id', bookingId);
            
            if (deleteError) {
              console.error('❌ Failed to rollback booking:', deleteError);
              console.error('CRITICAL: Booking exists but emails not sent. Manual intervention required.');
            } else {
              console.log('✅ Booking successfully rolled back');
            }
          } catch (rollbackErr) {
            console.error('❌ Rollback failed:', rollbackErr);
            console.error('CRITICAL: Booking may exist without emails. Manual intervention required.');
          }
        }
        
        // Return error to client
        const errorMessage = emailErr instanceof Error ? emailErr.message : 'Unknown email error';
        throw new Error(`Email delivery failed: ${errorMessage}`);
      }
    } else {
      console.log('⚠️ Email service not configured - skipping email sending');
      console.log('Booking will be processed but no confirmation emails will be sent');
    }

    // STEP 7: Return success response
    console.log('Step 7: Booking completed successfully');
    
    let message = 'Booking confirmed!';
    if (dbSaved && emailSent) {
      message = 'Booking confirmed! Confirmation emails sent successfully.';
    } else if (dbSaved && !emailSent) {
      message = 'Booking confirmed! (Email service not configured)';
    } else if (!dbSaved && emailSent) {
      message = 'Booking confirmed! (Database not configured)';
    } else {
      message = 'Booking confirmed! (Limited functionality - configure database and email services)';
    }
    
    const finalResponse = { 
      ok: true,
      bookingId,
      message,
      dbSaved,
      emailSent,
    };

    console.log('=== BOOKING API SUCCESS ===');
    console.log(JSON.stringify(finalResponse, null, 2));
    console.log('===========================');

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('=== BOOKING SUBMISSION ERROR ===');
    console.error('Error type:', error instanceof Error ? 'Error' : typeof error);
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { ok: false, error: 'Failed to process booking', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

