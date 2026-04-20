import { NextResponse } from 'next/server';
import { sendEmail, generateBookingConfirmationEmail, generateAdminBookingNotificationEmail } from '@/lib/email';
import { resolveAdminNotificationEmail } from '@/lib/admin-email';
import { BookingState } from '@/types/booking';
import { supabase } from '@/lib/supabase';
import { validateBookingEnv } from '@/lib/env-validation';
import { getServerAuthUser, createServiceClient } from '@/lib/supabase-server';
import { resolveBookingCleanerAndSchedule } from '@/lib/dispatch/resolve-booking-cleaner';
import { jsonFromDispatchFailure } from '@/lib/matching/dispatch-http';
import { buildEarningsInsertFields } from '@/lib/earnings-v2';
import { fetchCompanyOnlyCostsCents } from '@/lib/earnings-company-costs';
import {
  resolveCustomerIdForPricing,
  type BookingBodyForPricing,
} from '@/lib/booking-server-pricing';
import { validateBookingUsePointsAgainstServer } from '@/lib/loyalty/booking-points-validation';
import { generateUniqueBookingId } from '@/lib/booking-id';
import { notifyCleanerAssignment, notifyCustomerAssignment } from '@/lib/notifications/events';
import { validateBookingDiscountAmount } from '@/lib/discount-booking-server';
import { runBookingCheckoutAvailability } from '@/lib/booking-checkout-pricing';
import { createBookingLookupToken } from '@/lib/booking-lookup-token';
import { generateManageToken } from '@/lib/manage-booking-token';
import { validatePricingEngineRequest } from '@/lib/pricing-engine';
import { appliedRulesForLog } from '@/lib/pricing/admin-rule-utils';
import { logFinalPriceCheck } from '@/lib/pricing/final-price-check-log';
import { buildFinalPriceSnapshotPayload } from '@/lib/pricing/final-pricing';
import { buildPriceSnapshotV4AnalyticsFromUnified } from '@/lib/pricing/v4/price-snapshot-analytics';
import { rejectLegacyBookingPricingFields } from '@/lib/reject-legacy-booking-fields';
import { resolveBookingSelectedTeam } from '@/lib/booking-team-payload';
import { fetchQuickCleanSettings } from '@/lib/quick-clean-settings';
import { runSupplyActivationCheck } from '@/lib/supply/run-check';
import { runSlotSupplyInviteForArea } from '@/lib/cron/supply-check';
import {
  buildPricingExpiresAt,
  logPricingIntegrityDiscrepancy,
  runPricingIntegrityPipeline,
} from '@/lib/pricing/pricing-integrity-pipeline';
import { findBookingByIdempotencyKey, normalizeIdempotencyKey } from '@/lib/booking-idempotency';
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
    const legacyBooking = rejectLegacyBookingPricingFields(body as unknown as Record<string, unknown>);
    if (legacyBooking) return legacyBooking;
    const pricingExpiresAtRaw = (body as unknown as Record<string, unknown>).pricing_expires_at;
    const pricingExpiresAtClient =
      typeof pricingExpiresAtRaw === 'string' ? pricingExpiresAtRaw : null;
    const idempotencyKey = normalizeIdempotencyKey((body as { idempotency_key?: unknown }).idempotency_key);

    if (idempotencyKey) {
      const existing = await findBookingByIdempotencyKey(supabase, idempotencyKey);
      if (existing?.id) {
        return NextResponse.json({
          ok: true,
          bookingId: existing.id,
          message: 'Booking already processed for this idempotency key.',
          idempotent: true,
        });
      }
    }

    Object.assign(body, { selected_team: resolveBookingSelectedTeam(body) });

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

    const quickCleanSettings = await fetchQuickCleanSettings(createServiceClient());
    const engineValidation = validatePricingEngineRequest(body, quickCleanSettings);
    if (!engineValidation.ok) {
      return NextResponse.json({ ok: false, error: engineValidation.error }, { status: 400 });
    }

    const authEarly = await getServerAuthUser();
    const pricingCustomerId = await resolveCustomerIdForPricing(supabase, {
      bodyCustomerId: body.customer_id,
      authUserId: authEarly?.id ?? null,
    });

    const bookingId = body.paymentReference || generateUniqueBookingId();
    const tipAmountEarly = body.tipAmount || 0;
    const discountAmountClaimed = body.discountAmount || 0;
    const subtotalBeforeDiscount = body.totalAmount! - tipAmountEarly + discountAmountClaimed;

    let bookingServerCart: Awaited<ReturnType<typeof runPricingIntegrityPipeline>>['serverCart'];
    let pricingSnapshot: Record<string, unknown>;
    let pricingHash: string;
    let pricingVersion: string;
    try {
      const integrity = await runPricingIntegrityPipeline(supabase, {
        service: body.service,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        extraRooms: body.extraRooms,
        extras: body.extras,
        extrasQuantities: body.extrasQuantities,
        frequency: body.frequency || 'one-time',
        tipAmount: tipAmountEarly,
        discountAmount: discountAmountClaimed,
        numberOfCleaners: body.numberOfCleaners,
        provideEquipment: body.provideEquipment,
        carpetDetails: body.carpetDetails ?? undefined,
        pricingMode: body.pricingMode,
        date: body.date,
        time: body.time,
        address: body.address,
        discountCode: body.discountCode ?? undefined,
        promo_code: body.promo_code,
        email: body.email,
        customer_id: pricingCustomerId ?? undefined,
        use_points: body.use_points,
      });
      bookingServerCart = integrity.serverCart;
      pricingSnapshot = integrity.pricingSnapshot;
      pricingHash = integrity.pricingHash;
      pricingVersion = integrity.pricingVersion;
    } catch (e) {
      console.error('[bookings] authoritative pricing failed', e);
      return NextResponse.json(
        { ok: false, error: 'Pricing is temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    const serverChargeCents = bookingServerCart.total_amount_cents;
    const serverChargeZar = bookingServerCart.price_zar;
    const clientCents =
      body.totalAmount != null ? Math.round(Number(body.totalAmount) * 100) : null;
    const clientHashRaw = (body as unknown as Record<string, unknown>).pricing_hash;
    const clientHash = typeof clientHashRaw === 'string' ? clientHashRaw : undefined;
    const { data: storedPendingPricing } = await supabase
      .from('pending_bookings')
      .select('pricing_hash, pricing_expires_at, pricing_version')
      .eq('booking_id', bookingId)
      .maybeSingle();
    const storedHash =
      storedPendingPricing && typeof storedPendingPricing.pricing_hash === 'string'
        ? storedPendingPricing.pricing_hash
        : null;
    const storedExpiresAt =
      storedPendingPricing && typeof storedPendingPricing.pricing_expires_at === 'string'
        ? storedPendingPricing.pricing_expires_at
        : null;
    const storedVersion =
      storedPendingPricing && typeof storedPendingPricing.pricing_version === 'string'
        ? storedPendingPricing.pricing_version
        : null;
    if (pricingExpiresAtClient && new Date(pricingExpiresAtClient).getTime() < Date.now()) {
      return NextResponse.json(
        {
          ok: false,
          code: 'PRICING_EXPIRED',
          error: 'Pricing verification expired. Please re-verify the latest total before booking.',
          server_total: serverChargeZar,
          server_pricing_hash: pricingHash,
        },
        { status: 409 }
      );
    }
    if (storedExpiresAt && new Date(storedExpiresAt).getTime() < Date.now()) {
      await logPricingIntegrityDiscrepancy(supabase, {
        route: 'POST /api/bookings',
        booking_id: bookingId,
        client_total: Number(body.totalAmount),
        server_total: serverChargeZar,
        client_hash: storedHash,
        server_hash: pricingHash,
        reason: 'pricing_snapshot_expired',
      });
      return NextResponse.json(
        {
          ok: false,
          code: 'PRICING_EXPIRED',
          error: 'Pricing verification expired. Please re-verify the latest total before booking.',
          server_total: serverChargeZar,
          server_pricing_hash: pricingHash,
        },
        { status: 409 }
      );
    }
    if (storedVersion && storedVersion !== pricingVersion) {
      await logPricingIntegrityDiscrepancy(supabase, {
        route: 'POST /api/bookings',
        booking_id: bookingId,
        client_total: Number(body.totalAmount),
        server_total: serverChargeZar,
        client_hash: storedHash,
        server_hash: pricingHash,
        reason: 'pricing_version_mismatch',
      });
      return NextResponse.json(
        {
          ok: false,
          code: 'PRICING_EXPIRED',
          error: 'Pricing rules changed. Please re-verify the latest total before booking.',
          server_total: serverChargeZar,
          server_pricing_hash: pricingHash,
        },
        { status: 409 }
      );
    }
    if (storedHash && storedHash !== pricingHash) {
      await logPricingIntegrityDiscrepancy(supabase, {
        route: 'POST /api/bookings',
        booking_id: bookingId,
        client_total: Number(body.totalAmount),
        server_total: serverChargeZar,
        client_hash: storedHash,
        server_hash: pricingHash,
        reason: 'stored_hash_mismatch_on_confirmation',
      });
      return NextResponse.json(
        {
          ok: false,
          code: 'PRICE_MISMATCH',
          error: 'Total does not match server pricing. Please refresh the page and try again.',
          client_total: Number(body.totalAmount),
          server_total: serverChargeZar,
          difference_reason: 'stored_hash_mismatch_on_confirmation',
          server_pricing_hash: pricingHash,
        },
        { status: 400 }
      );
    }
    if (typeof clientHash === 'string' && clientHash && clientHash !== pricingHash) {
      await logPricingIntegrityDiscrepancy(supabase, {
        route: 'POST /api/bookings',
        booking_id: bookingId,
        client_total: Number(body.totalAmount),
        server_total: serverChargeZar,
        client_hash: clientHash,
        server_hash: pricingHash,
        reason: 'pricing_hash_mismatch',
      });
      // Allow benign hash drift when amount still matches.
      if (clientCents == null || clientCents !== serverChargeCents) {
        return NextResponse.json(
          {
            ok: false,
            code: 'PRICE_MISMATCH',
            error: 'Total does not match server pricing. Please refresh the page and try again.',
            client_total: Number(body.totalAmount),
            server_total: serverChargeZar,
            difference_reason: 'pricing_hash_mismatch',
            server_pricing_hash: pricingHash,
          },
          { status: 400 }
        );
      }
    }
    if (body.totalAmount != null && clientCents !== serverChargeCents) {
      await logPricingIntegrityDiscrepancy(supabase, {
        route: 'POST /api/bookings',
        booking_id: bookingId,
        client_total: Number(body.totalAmount),
        server_total: serverChargeZar,
        client_hash: typeof clientHash === 'string' ? clientHash : null,
        server_hash: pricingHash,
        reason: 'authoritative_recalculation_changed_total',
      });
      return NextResponse.json(
        {
          ok: false,
          code: 'PRICE_MISMATCH',
          error: 'Total does not match server pricing. Please refresh the page and try again.',
          client_total: Number(body.totalAmount),
          server_total: serverChargeZar,
          difference_reason: 'authoritative_recalculation_changed_total',
          server_pricing_hash: pricingHash,
        },
        { status: 400 }
      );
    }

    const discountCheck = await validateBookingDiscountAmount(supabase, {
      discountCode: body.discountCode ?? undefined,
      promo_code: body.promo_code,
      discountAmountClaimedZar: discountAmountClaimed,
      subtotalBeforeDiscountZar: subtotalBeforeDiscount,
      serviceType: body.service,
      ...(bookingServerCart.calc.unifiedPricing
        ? {
            serverExpectedDiscountZar: bookingServerCart.calc.unifiedPricing.discount_amount_zar,
          }
        : {}),
    });
    if (!discountCheck.ok) {
      return NextResponse.json(
        { ok: false, error: discountCheck.error },
        { status: discountCheck.status }
      );
    }

    const ptsCheck = validateBookingUsePointsAgainstServer(
      body.service,
      body.use_points,
      bookingServerCart.calc.unifiedPricing ?? null,
    );
    if (!ptsCheck.ok) {
      return NextResponse.json({ ok: false, error: ptsCheck.message }, { status: 400 });
    }

    const checkoutPricing = await runBookingCheckoutAvailability(supabase, {
      date: body.date,
      service: body.service,
      selected_team: body.selected_team,
    });
    if (!checkoutPricing.ok) {
      return NextResponse.json(
        { ok: false, error: checkoutPricing.reason },
        { status: checkoutPricing.status }
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
        const expectedCents = serverChargeCents;
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

    const adjustedTotalAmount = serverChargeZar;
    const pricingExpiresAt = buildPricingExpiresAt();
    const unifiedForSurge = bookingServerCart.calc.unifiedPricing;
    const surgePricingApplied = (unifiedForSurge?.surge_amount_zar ?? 0) > 0.001;
    const surgeAmount = unifiedForSurge?.surge_amount_zar ?? 0;

    // STEP 4: handle customer profile
    console.log('Step 4: Generated booking ID:', bookingId);
    
    let customerId = (body as any).customer_id || null;
    
    // STEP 4a: Create or get customer profile (with optional auth linking)
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Step 4a: Managing customer profile...');
      
      // Check if user is authenticated - declare outside so available in all blocks
      const authUser = authEarly;
      
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
    let assignedCleanerIds: string[] = [];
    let assignmentExpectedEnd: string | undefined;
    let assignmentDurationMinutes: number | undefined;

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
      const unifiedSnap = bookingServerCart.calc.unifiedPricing ?? null;

      const freqDiscZar =
        bookingServerCart.calc.frequencyDiscount ?? (body.frequencyDiscount || 0);
      const bodyExtras = body as BookingBodyForPricing & { rugs?: number; carpets?: number };
      const v4Analytics = buildPriceSnapshotV4AnalyticsFromUnified(
        {
          service: body.service,
          bedrooms: body.bedrooms,
          bathrooms: body.bathrooms,
          extraRooms: bodyExtras.extraRooms,
          pricingMode: body.pricingMode,
          rugs: bodyExtras.rugs,
          carpets: bodyExtras.carpets,
        },
        unifiedSnap,
        serviceTotal
      );
      const priceSnapshot = {
        /** Canonical mirror of row `total_amount` / `price` for audits */
        total_amount_cents: Math.round(adjustedTotalAmount * 100),
        price_zar: adjustedTotalAmount,
        ...(bookingServerCart.finalPrice
          ? { pricing_v5_2: buildFinalPriceSnapshotPayload(bookingServerCart.finalPrice) }
          : {}),
        service: {
          type: body.service,
          bedrooms: body.bedrooms,
          bathrooms: body.bathrooms,
          numberOfCleaners,
        },
        extras: body.extras || [],
        frequency: frequencyForSnapshot, // One-time bookings stored as NULL
        service_fee: 0,
        frequency_discount: Math.round(freqDiscZar * 100),
        discount_code: body.discountCode || null,
        discount_amount: discountAmount,
        tip_amount: tipAmountInCents, // Store tip separately
        subtotal: Math.round(serviceTotal * 100),
        total: adjustedTotalAmount * 100, // Total includes tip and surge
        snapshot_date: new Date().toISOString(),
        ...(v4Analytics ?? {}),
        ...(unifiedSnap && {
          pricing_mode: body.pricingMode ?? 'premium',
          extra_rooms: (body as { extraRooms?: number }).extraRooms ?? 0,
          table_price_zar: unifiedSnap.table_price_zar,
          extra_room_price_zar: unifiedSnap.extra_room_price_zar,
          extras_price_zar: unifiedSnap.extras_price_zar,
          base_price_zar: unifiedSnap.base_price_zar,
          forecast_multiplier: unifiedSnap.forecast_multiplier,
          forecast_adjustment_zar: unifiedSnap.forecast_adjustment_zar,
          price_after_forecast_zar: unifiedSnap.price_after_forecast_zar,
          surge_multiplier: unifiedSnap.surge_multiplier,
          surge_amount_zar: unifiedSnap.surge_amount_zar,
          ...(unifiedSnap.surge_breakdown !== undefined
            ? { surge_breakdown: unifiedSnap.surge_breakdown }
            : {}),
          ...(unifiedSnap.surge_pricing_note != null
            ? { surge_pricing_note: unifiedSnap.surge_pricing_note }
            : {}),
          promo_code: unifiedSnap.promo_code ?? body.discountCode ?? body.promo_code ?? null,
          discount_type: unifiedSnap.discount_type,
          discount_amount_zar: unifiedSnap.discount_amount_zar,
          final_price_zar: unifiedSnap.final_price_zar,
          referral_discount_zar: unifiedSnap.referral_discount_zar,
          loyalty_points_used: unifiedSnap.loyalty_points_used,
          loyalty_discount_zar: unifiedSnap.loyalty_discount_zar,
          unified_hours: unifiedSnap.hours,
          duration_hours: unifiedSnap.duration,
          team_size: unifiedSnap.team_size,
        }),
      };

      // Check if this is a team-based booking
      const requiresTeam =
        body.service === 'Deep' ||
        body.service === 'Move In/Out' ||
        ((body.service === 'Standard' || body.service === 'Airbnb') && numberOfCleaners > 1);
      
      const dispatchSupabase = createServiceClient();
      const addr = body.address as {
        suburb: string;
        city: string;
        latitude?: number;
        longitude?: number;
      };
      const bookingLocation =
        typeof addr.latitude === 'number' &&
        typeof addr.longitude === 'number' &&
        Number.isFinite(addr.latitude) &&
        Number.isFinite(addr.longitude)
          ? { latitude: addr.latitude, longitude: addr.longitude }
          : null;

      const dispatch = await resolveBookingCleanerAndSchedule(dispatchSupabase, {
        date: body.date!,
        time: body.time!,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        extras: body.extras || [],
        extrasQuantities: body.extrasQuantities || {},
        addressSuburb: body.address.suburb,
        addressCity: body.address.city,
        preferredCleanerId: body.cleaner_id,
        service: body.service ?? null,
        pricingMode: body.pricingMode ?? null,
        extraRooms: (body as { extraRooms?: number }).extraRooms ?? 0,
        bookingLocation,
      });

      if (!dispatch.ok) {
        return jsonFromDispatchFailure(dispatch, {
          area: body.address?.suburb ?? null,
          time: body.time ?? null,
        });
      }

      const { durationMinutes, expectedEndTime, cleanerIds } = dispatch;
      assignedCleanerIds = cleanerIds;
      assignmentExpectedEnd = expectedEndTime;
      assignmentDurationMinutes = durationMinutes;
      const cleanerIdForInsert = assignedCleanerIds[0] ?? null;

      let cleanerHireDate: string | null = null;
      if (cleanerIdForInsert) {
        const { data: cleanerData } = await supabase
          .from('cleaners')
          .select('hire_date')
          .eq('id', cleanerIdForInsert)
          .single();
        cleanerHireDate = cleanerData?.hire_date ?? null;
      }

      const totalAmountCents = Math.round(adjustedTotalAmount * 100);
      const serviceFeeCents = 0;
      const useEnginePricing =
        body.pricingEngineFinalCents != null && Number.isFinite(body.pricingEngineFinalCents);

      let equipmentCostCentsForEarnings: number;
      let extraCleanerFeeCentsForEarnings: number;
      if (useEnginePricing) {
        equipmentCostCentsForEarnings = Math.max(0, Math.round(Number(body.equipmentCostCents) || 0));
        extraCleanerFeeCentsForEarnings = Math.max(0, Math.round(Number(body.extraCleanerFeeCents) || 0));
      } else {
        const companyCosts = await fetchCompanyOnlyCostsCents(supabase, {
          service: body.service,
          bedrooms: body.bedrooms ?? 0,
          bathrooms: body.bathrooms ?? 0,
          extraRooms: (body as { extraRooms?: number }).extraRooms ?? 0,
          extras: body.extras || [],
          extrasQuantities: body.extrasQuantities || {},
          frequency: body.frequency || 'one-time',
          tipAmount: body.tipAmount,
          discountAmount: body.discountAmount || 0,
          numberOfCleaners,
          provideEquipment: (body as { provideEquipment?: boolean }).provideEquipment,
          carpetDetails: (body as BookingBodyForPricing).carpetDetails,
        });
        equipmentCostCentsForEarnings = companyCosts.equipmentCostCents;
        extraCleanerFeeCentsForEarnings = companyCosts.extraCleanerFeeCents;
      }

      const earningsTeamSize =
        useEnginePricing && body.pricingTeamSize != null && Number.isFinite(body.pricingTeamSize)
          ? Math.max(1, Math.round(body.pricingTeamSize))
          : numberOfCleaners;

      const earningsDurationMinutes =
        useEnginePricing && body.pricingTotalHours != null && Number.isFinite(body.pricingTotalHours)
          ? Math.max(30, Math.round(body.pricingTotalHours * 60))
          : durationMinutes ?? null;

      const earningsFields = buildEarningsInsertFields({
        totalAmountCents,
        serviceFeeCents,
        tipCents: tipAmountInCents,
        hireDate: cleanerHireDate,
        serviceType: body.service ?? null,
        requiresTeam,
        teamSize: earningsTeamSize,
        durationMinutes: earningsDurationMinutes,
        equipmentCostCents: equipmentCostCentsForEarnings,
        extraCleanerFeeCents: extraCleanerFeeCentsForEarnings,
      });

      // Normalize frequency: convert "one-time" to null for database constraint
      const frequencyForDb = body.frequency === 'one-time' ? null : body.frequency;
      console.log('Frequency normalization:', { 
        original: body.frequency, 
        normalized: frequencyForDb 
      });

      const manageToken = generateManageToken();
      manageTokenForEmail = manageToken;

      console.log('[bookings] pricing breakdown before insert', {
        route: 'POST /api/bookings',
        bookingId,
        discountZar: body.discountAmount || 0,
        serviceFeeZar: 0,
        frequencyDiscountZar:
          bookingServerCart.calc.frequencyDiscount ?? (body.frequencyDiscount || 0),
        tipZar: body.tipAmount || 0,
        surgeZar: unifiedSnap?.surge_amount_zar ?? 0,
        total_amount_cents: totalAmountCents,
        price_zar: adjustedTotalAmount,
        total_amount_equals_price_times_100:
          totalAmountCents === Math.round(adjustedTotalAmount * 100),
      });

      const pricingRulesBook = appliedRulesForLog(unifiedSnap?.admin_rule_applied);
      if (pricingRulesBook.length > 0) {
        console.log('[PRICING RULES]', { bookingId, rules: pricingRulesBook });
      }

      logFinalPriceCheck({
        route: 'POST /api/bookings',
        bookingId,
        price_zar: adjustedTotalAmount,
        total_amount_cents: totalAmountCents,
      });

      const pointsRedeemed = Math.max(
        0,
        Math.floor(Number(unifiedSnap?.loyalty_points_used) || 0),
      );

      const { data, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          id: bookingId,
          customer_id: customerId,
          points_redeemed: pointsRedeemed,
          cleaner_id: cleanerIdForInsert,
          assigned_cleaner_id: cleanerIdForInsert,
          assigned_cleaners: assignedCleanerIds.length > 0 ? assignedCleanerIds : null,
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
          latitude: bookingLocation?.latitude ?? null,
          longitude: bookingLocation?.longitude ?? null,
          payment_reference: body.paymentReference,
          total_amount: totalAmountCents, // Convert rands to cents (includes tip and surge)
          price: adjustedTotalAmount, // ZAR; mirror total_amount / 100
          tip_amount: tipAmountInCents, // Store tip separately (goes 100% to cleaner)
          ...earningsFields,
          requires_team: requiresTeam, // Flag for team-based bookings
          surge_pricing_applied: surgePricingApplied,
          surge_amount: Math.round(surgeAmount * 100), // Store surge amount in cents
          frequency: frequencyForDb, // One-time bookings must be NULL
          service_fee: 0,
          frequency_discount: Math.round(freqDiscZar * 100),
          price_snapshot: priceSnapshot,
          pricing_snapshot: pricingSnapshot,
          pricing_hash: pricingHash,
          pricing_version: pricingVersion,
          ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
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
      if (dbSaved && assignedCleanerIds.length > 0 && process.env.NODE_ENV === 'development') {
        console.log('[assignment]', {
          booking_id: bookingId,
          assigned_cleaners: assignedCleanerIds,
          duration: durationMinutes,
          team_size: assignedCleanerIds.length,
        });
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

      await supabase.from('pending_bookings').upsert({
        booking_id: bookingId,
        pricing_snapshot: pricingSnapshot,
        pricing_hash: pricingHash,
        pricing_version: pricingVersion,
        pricing_expires_at: pricingExpiresAt,
        server_total: serverChargeZar,
        total_amount_cents: serverChargeCents,
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
        status: 'pending',
      });
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
      ...(assignedCleanerIds.length > 0 || assignmentDurationMinutes != null
        ? {
            assigned_cleaners: assignedCleanerIds,
            start: body.time,
            end: assignmentExpectedEnd,
            duration: assignmentDurationMinutes,
          }
        : {}),
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

    if (dbSaved && body.address) {
      void (async () => {
        try {
          const svc = createServiceClient();
          await runSupplyActivationCheck(svc, {
            suburb: body.address.suburb ?? null,
            city: body.address.city ?? null,
          });
          await runSlotSupplyInviteForArea(svc, {
            suburb: body.address.suburb ?? null,
            city: body.address.city ?? null,
            dateYmd: String(body.date ?? '').slice(0, 10),
          });
        } catch (e) {
          console.warn('[supply] post-booking check failed', e);
        }
      })();
    }

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

