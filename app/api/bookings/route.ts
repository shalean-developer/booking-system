import { NextResponse } from 'next/server';
import { sendEmail, generateBookingConfirmationEmail, generateAdminBookingNotificationEmail } from '@/lib/email';
import { BookingState } from '@/types/booking';
import { supabase } from '@/lib/supabase';
import { validateBookingEnv } from '@/lib/env-validation';
import { getServerAuthUser } from '@/lib/supabase-server';
import { calculateCleanerEarnings } from '@/lib/cleaner-earnings';
import { generateUniqueBookingId } from '@/lib/booking-id';

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

    // STEP 4: Generate unique booking ID and handle customer profile
    const bookingId = body.paymentReference || generateUniqueBookingId();
    console.log('Step 4: Generated booking ID:', bookingId);
    
    let customerId = (body as any).customer_id || null;
    
    // STEP 4a: Create or get customer profile (with optional auth linking)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Step 4a: Managing customer profile...');
      
      // Check if user is authenticated - declare outside so available in all blocks
      const authUser = await getServerAuthUser();
      
      if (authUser) {
        console.log('🔐 Authenticated user detected:', authUser.email, '(ID:', authUser.id + ')');
        
        // First, try to find profile by auth_user_id
        const { data: authProfile } = await supabase
          .from('customers')
          .select('id, email, total_bookings, auth_user_id')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();
        
        if (authProfile) {
          console.log('✅ Customer profile found by auth_user_id:', authProfile.id);
          customerId = authProfile.id;
          
          // Update with latest info and increment bookings
          const { error: updateError } = await supabase
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
          
          if (!updateError) {
            console.log('✅ Auth user profile updated');
          }
        } else {
          console.log('ℹ️ No profile found by auth_user_id, will check by email...');
        }
      } else {
        console.log('ℹ️ No authenticated user - guest checkout');
      }
      
      // Only check email if we didn't find auth profile
      if (!customerId) {
      
      // Fallback: Check if customer already exists by email (guest or new auth user)
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id, email, total_bookings, auth_user_id')
        .ilike('email', body.email)
        .maybeSingle();

      if (existingCustomer) {
        console.log('✅ Existing customer found by email:', existingCustomer.id);
        customerId = existingCustomer.id;
        
        // Update customer profile with latest info and increment bookings
        const updateData: any = {
          phone: body.phone,
          first_name: body.firstName,
          last_name: body.lastName,
          address_line1: body.address.line1,
          address_suburb: body.address.suburb,
          address_city: body.address.city,
          total_bookings: (existingCustomer.total_bookings || 0) + 1,
        };
        
        // If auth user and profile not linked, link it now
        if (authUser && !existingCustomer.auth_user_id) {
          console.log('🔗 Linking guest profile to auth user...');
          updateData.auth_user_id = authUser.id;
        }
        
        const { error: updateError } = await supabase
          .from('customers')
          .update(updateData)
          .eq('id', existingCustomer.id);

        if (updateError) {
          console.error('⚠️ Failed to update customer profile:', updateError);
          // Continue anyway - not critical
        } else {
          console.log('✅ Customer profile updated');
          if (authUser && !existingCustomer.auth_user_id) {
            console.log('✅ Guest profile successfully linked to auth user');
          }
        }
      } else {
        console.log('ℹ️ Creating new customer profile...');
        
        // Create new customer profile (with auth link if authenticated)
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
            auth_user_id: authUser?.id || null,  // Link to auth if authenticated
            total_bookings: 1,
          })
          .select()
          .single();

        if (customerError) {
          console.error('⚠️ Failed to create customer profile:', customerError);
          // Continue anyway - we'll still save booking with customer_* fields
        } else {
          customerId = newCustomer.id;
          console.log('✅ New customer profile created:', customerId);
          if (authUser) {
            console.log('🔗 Profile linked to auth user:', authUser.id);
          }
        }
      }
      }  // Close if (!customerId) block
    }
    
    // STEP 5: Save booking to database (REQUIRED if configured)
    console.log('Step 5: Saving booking to database...');
    console.log('Cleaner ID:', body.cleaner_id);
    console.log('Customer ID:', customerId);
    
    if (body.cleaner_id === 'manual') {
      console.log('⚠️ MANUAL CLEANER ASSIGNMENT REQUESTED');
      console.log('Admin will need to assign a cleaner for this booking');
    }
    
    let bookingData = null;
    let dbSaved = false;
    
    // Check if Supabase is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Create price snapshot for historical record
      const priceSnapshot = {
        service: {
          type: body.service,
          bedrooms: body.bedrooms,
          bathrooms: body.bathrooms,
        },
        extras: body.extras || [],
        frequency: body.frequency || 'one-time',
        service_fee: body.serviceFee || 0,
        frequency_discount: body.frequencyDiscount || 0,
        subtotal: body.totalAmount ? body.totalAmount - (body.serviceFee || 0) + (body.frequencyDiscount || 0) : 0,
        total: body.totalAmount || 0,
        snapshot_date: new Date().toISOString(),
      };

      // Calculate cleaner earnings based on experience
      let cleanerHireDate = null;
      if (body.cleaner_id && body.cleaner_id !== 'manual') {
        const { data: cleanerData } = await supabase
          .from('cleaners')
          .select('hire_date')
          .eq('id', body.cleaner_id)
          .single();
        
        cleanerHireDate = cleanerData?.hire_date || null;
      }

      const cleanerEarnings = calculateCleanerEarnings(
        body.totalAmount ?? null,
        body.serviceFee ?? null,
        cleanerHireDate
      );

      const { data, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          customer_id: customerId,
          cleaner_id: body.cleaner_id === 'manual' ? null : body.cleaner_id,
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
          total_amount: body.totalAmount,
          cleaner_earnings: cleanerEarnings,
          frequency: body.frequency || 'one-time',
          service_fee: body.serviceFee || 0,
          frequency_discount: body.frequencyDiscount || 0,
          price_snapshot: priceSnapshot,
          status: body.cleaner_id === 'manual' ? 'pending' : 'confirmed',
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

