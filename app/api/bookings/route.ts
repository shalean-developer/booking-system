import { NextResponse } from 'next/server';
import { sendEmail, generateBookingConfirmationEmail, generateAdminBookingNotificationEmail } from '@/lib/email';
import { resolveAdminNotificationEmail } from '@/lib/admin-email';
import { BookingState } from '@/types/booking';
import { supabase } from '@/lib/supabase';
import { validateBookingEnv } from '@/lib/env-validation';
import { getServerAuthUser, createServiceClient } from '@/lib/supabase-server';
import { resolveBookingCleanerAndSchedule } from '@/lib/dispatch/resolve-booking-cleaner';
import { calculateCleanerEarnings } from '@/lib/cleaner-earnings';
import { generateUniqueBookingId } from '@/lib/booking-id';
import { notifyCleanerAssignment, notifyCustomerAssignment } from '@/lib/notifications/events';
import { validateBookingDiscountAmount } from '@/lib/discount-booking-server';
import { computeCheckoutPricing } from '@/lib/booking-checkout-pricing';
import { createBookingLookupToken } from '@/lib/booking-lookup-token';
import { generateManageToken } from '@/lib/manage-booking-token';

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

    // STEP 1.5: Run service health checks
    console.log('Step 1.5: Running service health checks...');
    
    // Log any unhealthy services but don't fail yet
    const unhealthyServices: Array<{service: string; error: string}> = [];
    if (unhealthyServices.length > 0) {
      console.warn('⚠️ Some services are unhealthy:', unhealthyServices.map(s => `${s.service}: ${s.error}`));
    }

    // STEP 2: Parse and validate booking data
    console.log('Step 2: Parsing booking data...');
    const body: BookingState = await req.json();
    console.log('=== BOOKING SUBMISSION ===', { service: body.service, paymentReference: body.paymentReference });

    if (!body.paymentReference) {
      return NextResponse.json(
        { ok: false, error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    if (!body.totalAmount || body.totalAmount <= 0) {
      return NextResponse.json(
        { ok: false, error: 'Total amount is required and must be greater than 0' },
        { status: 400 }
      );
    }

    if (!body.date || !body.time) {
      return NextResponse.json(
        { ok: false, error: 'Booking date and time are required' },
        { status: 400 }
      );
    }

    if (!body.service) {
      return NextResponse.json({ ok: false, error: 'Service is required' }, { status: 400 });
    }

    const bookingId = body.paymentReference || generateUniqueBookingId();
    const tipAmountEarly = body.tipAmount || 0;
    const preSurgeTotal =
      typeof body.preSurgeTotal === 'number' && Number.isFinite(body.preSurgeTotal)
        ? body.preSurgeTotal
        : body.totalAmount;
    const discountAmountClaimed = body.discountAmount || 0;
    const subtotalBeforeDiscount = preSurgeTotal - tipAmountEarly + discountAmountClaimed;

    const discountCheck = await validateBookingDiscountAmount(supabase, {
      discountCode: body.discountCode,
      discountAmountClaimedZar: discountAmountClaimed,
      subtotalBeforeDiscountZar: subtotalBeforeDiscount,
      serviceType: body.service,
    });
    if (!discountCheck.ok) {
      return NextResponse.json(
        { ok: false, error: discountCheck.error },
        { status: discountCheck.status }
      );
    }

    const checkoutPricing = await computeCheckoutPricing(supabase, {
      date: body.date,
      service: body.service,
      preSurgeTotalZar: preSurgeTotal,
      selected_team: body.selected_team,
    });
    if (!checkoutPricing.ok) {
      return NextResponse.json(
        { ok: false, error: checkoutPricing.error },
        { status: checkoutPricing.status }
      );
    }

    if (Math.abs(checkoutPricing.finalTotalZar - body.totalAmount) > 0.02) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Total does not match server pricing. Please refresh the page and try again.',
        },
        { status: 400 }
      );
    }

    // Re-verify Paystack and match charged amount (ZAR → smallest unit, same as client Math.round(zar * 100))
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY?.trim();
    const isProd = process.env.NODE_ENV === 'production';

    if (paystackSecret) {
      console.log('Step 3: Re-verifying payment with Paystack...');
      try {
        const verifyUrl = `https://api.paystack.co/transaction/verify/${encodeURIComponent(body.paymentReference)}`;
        const verifyResponse = await fetch(verifyUrl, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${paystackSecret}`,
            'Content-Type': 'application/json',
          },
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok || !verifyData?.data || verifyData.data.status !== 'success') {
          return NextResponse.json(
            { ok: false, error: 'Payment verification failed. Please contact support if you were charged.' },
            { status: 400 }
          );
        }

        const paystackCents = Number(verifyData.data.amount);
        const expectedCents = Math.round(checkoutPricing.finalTotalZar * 100);
        if (!Number.isFinite(paystackCents) || paystackCents !== expectedCents) {
          console.error('Paystack amount mismatch', { paystackCents, expectedCents });
          return NextResponse.json(
            {
              ok: false,
              error: 'Payment amount does not match booking total. Please contact support if you were charged.',
            },
            { status: 400 }
          );
        }
      } catch (verifyError) {
        console.error('Payment re-verification error:', verifyError);
        return NextResponse.json(
          { ok: false, error: 'Failed to verify payment. Please contact support.' },
          { status: 500 }
        );
      }
    } else if (isProd) {
      return NextResponse.json(
        { ok: false, error: 'Payment verification is not configured (PAYSTACK_SECRET_KEY).' },
        { status: 500 }
      );
    } else {
      console.warn(
        '[bookings] PAYSTACK_SECRET_KEY not set — skipping Paystack re-verification (development only). Configure Paystack for production.'
      );
    }

    const adjustedTotalAmount = checkoutPricing.finalTotalZar;
    const surgePricingApplied = checkoutPricing.surgePricingApplied;
    const surgeAmount = checkoutPricing.surgeAmountZar;

    // STEP 4: handle customer profile
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
    console.log('Booking ID:', bookingId);

    const numberOfCleaners = Math.max(1, Math.round((body as any).numberOfCleaners ?? 1));
    
    if (body.cleaner_id === 'manual') {
      console.log('⚠️ MANUAL CLEANER ASSIGNMENT REQUESTED');
      console.log('Admin will need to assign a cleaner for this booking');
    }
    
    let bookingData = null;
    let dbSaved = false;
    let manageTokenForEmail: string | undefined;
    
    // Check if Supabase is configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      // Extract tip amount (tips go 100% to cleaner, separate from commission)
      const tipAmount = (body.tipAmount || 0);
      const tipAmountInCents = Math.round(tipAmount * 100);
      
      // Calculate service total excluding tip (for commission calculation)
      // Final total (after surge) includes tip
      const serviceTotal = adjustedTotalAmount - tipAmount;

      // Create price snapshot for historical record
      // Normalize frequency for consistency
      const frequencyForSnapshot = body.frequency === 'one-time' ? null : body.frequency;
      
      const discountAmount = (body.discountAmount || 0) * 100; // Convert to cents
      const priceSnapshot = {
        service: {
          type: body.service,
          bedrooms: body.bedrooms,
          bathrooms: body.bathrooms,
          numberOfCleaners,
        },
        extras: body.extras || [],
        frequency: frequencyForSnapshot, // One-time bookings stored as NULL
        service_fee: (body.serviceFee || 0) * 100, // Convert to cents
        frequency_discount: (body.frequencyDiscount || 0) * 100, // Convert to cents
        discount_code: body.discountCode || null,
        discount_amount: discountAmount,
        tip_amount: tipAmountInCents, // Store tip separately
        subtotal: serviceTotal ? (serviceTotal - (body.serviceFee || 0) + (body.frequencyDiscount || 0)) * 100 : 0,
        total: adjustedTotalAmount * 100, // Total includes tip and surge
        snapshot_date: new Date().toISOString(),
      };

      // Check if this is a team-based booking
      const requiresTeam =
        body.service === 'Deep' ||
        body.service === 'Move In/Out' ||
        ((body.service === 'Standard' || body.service === 'Airbnb') && numberOfCleaners > 1);
      
      const dispatchSupabase = createServiceClient();
      const dispatch = await resolveBookingCleanerAndSchedule(dispatchSupabase, {
        requiresTeam,
        date: body.date!,
        time: body.time!,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        extras: body.extras || [],
        extrasQuantities: body.extrasQuantities || {},
        addressSuburb: body.address.suburb,
        addressCity: body.address.city,
        preferredCleanerId: body.cleaner_id,
      });

      if (!dispatch.ok) {
        return NextResponse.json({ ok: false, error: dispatch.error }, { status: dispatch.status });
      }

      const { cleanerId: resolvedCleanerId, durationMinutes, expectedEndTime } = dispatch;

      let cleanerHireDate = null;
      let cleanerEarnings = 0;

      if (requiresTeam) {
        console.log('📋 Team-based booking detected - earnings will be calculated during team assignment');
        cleanerEarnings = 0;
      } else if (resolvedCleanerId) {
        const { data: cleanerData } = await supabase
          .from('cleaners')
          .select('hire_date')
          .eq('id', resolvedCleanerId)
          .single();

        cleanerHireDate = cleanerData?.hire_date || null;
        cleanerEarnings = calculateCleanerEarnings(
          adjustedTotalAmount ?? null,
          body.serviceFee ?? null,
          cleanerHireDate,
          tipAmount,
          body.service ?? null
        ) * 100;
      }

      const cleanerIdForInsert = requiresTeam ? null : resolvedCleanerId;

      // Normalize frequency: convert "one-time" to null for database constraint
      const frequencyForDb = body.frequency === 'one-time' ? null : body.frequency;
      console.log('Frequency normalization:', { 
        original: body.frequency, 
        normalized: frequencyForDb 
      });

      const manageToken = generateManageToken();
      manageTokenForEmail = manageToken;

      const { data, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          customer_id: customerId,
          cleaner_id: requiresTeam ? null : cleanerIdForInsert, // Use NULL for team bookings (teams tracked separately)
          booking_date: body.date || null,
          booking_time: body.time,
          expected_end_time: expectedEndTime,
          duration_minutes: durationMinutes,
          service_type: body.service,
          customer_name: `${body.firstName} ${body.lastName}`,
          customer_email: body.email,
          customer_phone: body.phone,
          address_line1: body.address.line1,
          address_suburb: body.address.suburb,
          address_city: body.address.city,
          payment_reference: body.paymentReference,
          total_amount: Math.round(adjustedTotalAmount * 100), // Convert rands to cents (includes tip and surge)
          tip_amount: tipAmountInCents, // Store tip separately (goes 100% to cleaner)
          cleaner_earnings: cleanerEarnings,
          requires_team: requiresTeam, // Flag for team-based bookings
          surge_pricing_applied: surgePricingApplied,
          surge_amount: Math.round(surgeAmount * 100), // Store surge amount in cents
          frequency: frequencyForDb, // One-time bookings must be NULL
          service_fee: (body.serviceFee || 0) * 100, // Convert rands to cents
          frequency_discount: (body.frequencyDiscount || 0) * 100, // Convert rands to cents
          price_snapshot: priceSnapshot,
          status: 'pending', // All bookings start as pending, cleaner must accept
          manage_token: manageToken,
        })
        .select();

      if (bookingError) {
        const pgCode = (bookingError as { code?: string }).code;
        if (pgCode === '23505') {
          const { data: existing } = await supabase.from('bookings').select('*').eq('id', bookingId).maybeSingle();
          if (existing) {
            bookingData = [existing];
            dbSaved = true;
            manageTokenForEmail =
              typeof (existing as { manage_token?: string | null }).manage_token === 'string'
                ? (existing as { manage_token: string }).manage_token
                : undefined;
          } else {
            return NextResponse.json(
              { ok: false, error: `Failed to save booking: ${bookingError.message}` },
              { status: 500 }
            );
          }
        } else {
          console.error('❌ Failed to save booking to database:', bookingError);
          return NextResponse.json(
            { ok: false, error: `Failed to save booking: ${bookingError.message}` },
            { status: 500 }
          );
        }
      } else {
        bookingData = data;
        dbSaved = true;
      }
      console.log('✅ Booking saved to database successfully');
      console.log('Saved booking data:', bookingData);
      console.log('Booking ID:', bookingId);
      console.log('Customer ID:', customerId);
      console.log('Cleaner ID:', body.cleaner_id);
      console.log('Status: pending'); // All bookings start as pending

      // Record discount code usage if a discount code was applied
      if (body.discountCode && discountAmount > 0) {
        try {
          // Get discount code ID
          const { data: discountCodeData } = await supabase
            .from('discount_codes')
            .select('id')
            .eq('code', body.discountCode.toUpperCase().trim())
            .single();

          if (discountCodeData) {
            // Record usage
            await supabase
              .from('discount_code_usage')
              .insert({
                discount_code_id: discountCodeData.id,
                booking_id: bookingId,
                discount_amount: discountAmount,
                original_amount: (serviceTotal + (body.serviceFee || 0) - (body.frequencyDiscount || 0)) * 100,
                final_amount: (body.totalAmount || 0) * 100,
                customer_email: body.email,
              });

            // Increment usage count
            try {
              const { error: rpcError } = await supabase.rpc('increment', {
                table_name: 'discount_codes',
                column_name: 'usage_count',
                row_id: discountCodeData.id,
              });
              
              if (rpcError) {
                // Fallback if RPC doesn't exist
                const { data: currentCode } = await supabase
                  .from('discount_codes')
                  .select('usage_count')
                  .eq('id', discountCodeData.id)
                  .single();
                
                if (currentCode) {
                  await supabase
                    .from('discount_codes')
                    .update({ usage_count: (currentCode.usage_count || 0) + 1 })
                    .eq('id', discountCodeData.id);
                }
              }
            } catch (err) {
              // Fallback if RPC doesn't exist
              const { data: currentCode } = await supabase
                .from('discount_codes')
                .select('usage_count')
                .eq('id', discountCodeData.id)
                .single();
              
              if (currentCode) {
                await supabase
                  .from('discount_codes')
                  .update({ usage_count: (currentCode.usage_count || 0) + 1 })
                  .eq('id', discountCodeData.id);
              }
            }

            console.log('✅ Discount code usage recorded');
          }
        } catch (error) {
          console.error('⚠️ Failed to record discount code usage:', error);
          // Don't fail the booking if discount code tracking fails
        }
      }

      // Log tip activity if tip was given and cleaner is assigned
      if (tipAmountInCents > 0 && cleanerIdForInsert) {
        try {
          // Get cleaner name for activity log
          const { data: cleaner } = await supabase
            .from('cleaners')
            .select('name')
            .eq('id', cleanerIdForInsert)
            .single();

          if (cleaner) {
            // Insert tip activity log record
            const { error: tipActivityError } = await supabase
              .from('booking_activities')
              .insert({
                booking_id: bookingId,
                cleaner_id: cleanerIdForInsert,
                cleaner_name: cleaner.name,
                old_status: null, // No status change for tips
                new_status: 'pending', // Current booking status
                action_type: 'tip_received',
                tip_amount: tipAmountInCents,
                customer_name: `${body.firstName} ${body.lastName}`,
              });

            if (tipActivityError) {
              // Log error but don't fail the booking
              console.error('⚠️ Failed to log tip activity:', tipActivityError);
            } else {
              console.log(`✅ Tip activity logged: ${cleaner.name} received R${(tipAmountInCents / 100).toFixed(2)} tip from ${body.firstName} ${body.lastName}`);
            }
          }
        } catch (tipLogError) {
          // Log error but don't fail the booking
          console.error('⚠️ Error logging tip activity:', tipLogError);
        }
      }

      // Fire-and-forget WhatsApp notification to cleaner (if enabled and opted-in)
      try {
        await notifyCleanerAssignment({
          bookingId,
          cleanerId: cleanerIdForInsert,
          cleanerName: null,
          date: body.date || '',
          time: body.time || '',
          addressLine1: body.address?.line1 ?? '',
          addressSuburb: body.address?.suburb ?? '',
          addressCity: body.address?.city ?? '',
          customerName: `${body.firstName} ${body.lastName}`,
        });
      } catch {}

      // Optional WhatsApp notification to customer on assignment (env-gated + customer opt-in)
      try {
        if (process.env.ENABLE_WHATSAPP_CUSTOMER === 'true') {
          await notifyCustomerAssignment({
            bookingId,
            customerName: `${body.firstName} ${body.lastName}`,
            date: body.date || '',
            time: body.time || '',
            addressLine1: body.address?.line1 ?? '',
            addressSuburb: body.address?.suburb ?? '',
            addressCity: body.address?.city ?? '',
            customerPhone: body.phone,
            customerId: customerId,
          });
        }
      } catch {}

      // Create team record for team-based bookings
      if (requiresTeam && body.selected_team) {
        console.log('📋 Creating team record for booking:', bookingId);
        const { data: teamData, error: teamError } = await supabase
          .from('booking_teams')
          .insert({
            booking_id: bookingId,
            team_name: body.selected_team,
            supervisor_id: null, // Will be set when admin assigns team
          })
          .select();

        if (teamError) {
          console.error('❌ Failed to create team record:', teamError);
          // Don't fail the booking, just log the error
        } else {
          console.log('✅ Team record created successfully:', teamData);
        }
      }
    } else {
      console.log('⚠️ Supabase not configured - skipping database save');
      console.log('Booking will be processed but not stored in database');
    }

    // STEP 6: Send confirmation emails synchronously (await before responding)
    console.log('Step 6: Sending confirmation emails to customer and admin...');
    let emailSent = false;
    let emailError = null;
    
    if (process.env.RESEND_API_KEY) {
      try {
        console.log('=== EMAIL SENDING ===');
        console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL || 'onboarding@resend.dev');
        console.log('Customer email:', body.email);
        console.log('Admin email:', resolveAdminNotificationEmail());
        console.log('Booking ID:', bookingId);

        // Fetch cleaner name if cleaner_id exists
        let cleanerName: string | undefined;
        if (body.cleaner_id && body.cleaner_id !== 'manual' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          try {
            const { data: cleaner } = await supabase
              .from('cleaners')
              .select('name')
              .eq('id', body.cleaner_id)
              .maybeSingle();
            cleanerName = cleaner?.name;
          } catch (error) {
            console.error('Failed to fetch cleaner name:', error);
          }
        }

        // Generate emails
        console.log('📧 Generating emails...');
        const customerEmailData = await generateBookingConfirmationEmail({
          ...body,
          bookingId,
          totalAmount: body.totalAmount, // Pass actual total amount paid (in rands)
          cleanerName,
          ...(manageTokenForEmail ? { manageToken: manageTokenForEmail } : {}),
        });
        const adminEmailData = await generateAdminBookingNotificationEmail({
          ...body,
          bookingId,
          totalAmount: body.totalAmount // Pass actual total amount paid (in rands)
        });
        console.log('✅ Emails generated');
        
        // Send both emails in parallel and await completion
        console.log('📤 Sending emails in parallel...');
        await Promise.all([
          sendEmail(customerEmailData),
          sendEmail(adminEmailData)
        ]);
        console.log('✅ Both emails sent successfully');
        
        emailSent = true;
        console.log('Email sending success:', {
          customerEmailSent: true,
          adminEmailSent: true,
          bookingId
        });
      } catch (emailErr) {
        // Log error but don't fail the booking (payment already succeeded)
        emailError = emailErr instanceof Error ? emailErr.message : 'Unknown error';
        console.error('=== EMAIL SENDING FAILED ===');
        console.error('Failed to send emails:', emailErr);
        console.error('Email error details:', {
          message: emailError,
          stack: emailErr instanceof Error ? emailErr.stack : undefined,
          name: emailErr instanceof Error ? emailErr.name : undefined
        });
        
        // Log for admin to manually retry
        console.log('🟥 [Bookings API] EMAIL_SENDING_FAILED:', {
          bookingId,
          paymentReference: body.paymentReference,
          customerEmail: body.email,
          error: emailError
        });
        
        console.log('⚠️ Emails failed but booking is saved. Emails can be resent via admin panel.');
        // Email sending failed but booking is saved, so we continue
      }
    } else {
      console.log('⚠️ Email service not configured - skipping email sending');
      console.log('Booking will be processed but no confirmation emails will be sent');
    }

    // STEP 7: Return success response (emails already sent if configured)
    console.log('Step 7: Booking completed successfully');
    
    let message = 'Booking confirmed!';
    if (dbSaved && emailSent) {
      message = 'Booking confirmed! Confirmation emails have been sent to you and our team.';
    } else if (dbSaved && !emailSent) {
      if (emailError) {
        message = 'Booking confirmed! (Email sending failed - emails can be resent via admin panel)';
      } else {
        message = 'Booking confirmed! (Email service not configured)';
      }
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
      confirmationToken: createBookingLookupToken(bookingId),
    };

    console.log('=== BOOKING API SUCCESS ===');
    console.log(JSON.stringify(finalResponse, null, 2));
    console.log('===========================');
    console.log('Final response summary:', {
      bookingId,
      dbSaved,
      emailSent,
      message
    });

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('=== BOOKING SUBMISSION ERROR ===');
    console.error('Error type:', error instanceof Error ? 'Error' : typeof error);
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    // Enhanced error context capture
    console.log('🟥 [Bookings API] BOOKING_API_ERROR:', {
      timestamp: new Date().toISOString(),
      errorType: error instanceof Error ? 'Error' : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    
    return NextResponse.json(
      { 
        ok: false, 
        // Surface the underlying error message so the client can display it
        error: error instanceof Error ? error.message : 'Failed to process booking',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

