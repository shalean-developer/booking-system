import { NextResponse } from 'next/server';
import { sendEmail, generateBookingConfirmationEmail, generateAdminBookingNotificationEmail } from '@/lib/email';
import { supabase } from '@/lib/supabase';
import { generateUniqueBookingId } from '@/lib/booking-id';
import { buildEarningsInsertFields } from '@/lib/earnings-v2';
import { deriveCompanyOnlyCostsCents } from '@/lib/earnings-company-costs';
import type { BookingStateV2 } from '@/lib/useBookingV2';
import { isPayLaterAllowed } from '@/lib/booking-env';
import { validateBookingDiscountAmount } from '@/lib/discount-booking-server';
import { runBookingCheckoutAvailability } from '@/lib/booking-checkout-pricing';
import { resolveCustomerIdForPricing } from '@/lib/booking-server-pricing';
import { validateBookingUsePointsAgainstServer } from '@/lib/loyalty/booking-points-validation';
import { createBookingLookupToken } from '@/lib/booking-lookup-token';
import { generateManageToken } from '@/lib/manage-booking-token';
import { createServiceClient, getServerAuthUser } from '@/lib/supabase-server';
import { resolveBookingCleanerAndSchedule } from '@/lib/dispatch/resolve-booking-cleaner';
import { jsonFromDispatchFailure } from '@/lib/matching/dispatch-http';
import { sendCleanerNotification } from '@/lib/notifications/sendCleanerNotification';
import { runSupplyActivationCheck } from '@/lib/supply/run-check';
import { runSlotSupplyInviteForArea } from '@/lib/cron/supply-check';
import { logFinalPriceCheck } from '@/lib/pricing/final-price-check-log';
import { buildFinalPriceSnapshotPayload } from '@/lib/pricing/final-pricing';
import { buildPriceSnapshotV4AnalyticsFromUnified } from '@/lib/pricing/v4/price-snapshot-analytics';
import type { BookingBodyForPricing } from '@/lib/booking-server-pricing';
import { rejectLegacyBookingPricingFields } from '@/lib/reject-legacy-booking-fields';
import { resolveBookingSelectedTeam } from '@/lib/booking-team-payload';
import {
  buildPricingExpiresAt,
  logPricingIntegrityDiscrepancy,
  runPricingIntegrityPipeline,
} from '@/lib/pricing/pricing-integrity-pipeline';
import { findBookingByIdempotencyKey, normalizeIdempotencyKey } from '@/lib/booking-idempotency';
/**
 * Guest booking API — pay-later path (no Paystack). Disabled in production unless
 * `ALLOW_PAY_LATER_BOOKINGS=true`.
 *
 * Email + equipment flow (high level):
 * - Booking wizard (V2) tracks `provideEquipment` based on the equipment toggle in the form.
 * - When this API is called, the request body may additionally include:
 *   - `equipment_required` (boolean) and `equipment_fee` (ZAR) for clearer downstream usage.
 * - We persist these into:
 *   - `bookings.provide_equipment` / `bookings.equipment_charge` (legacy)
 *   - and the normalized `bookings.equipment_required` / `bookings.equipment_fee`.
 * - We forward the same fields into `generateBookingConfirmationEmail` and
 *   `generateAdminBookingNotificationEmail` so the email template can show a
 *   dynamic “equipment will be provided…” line without changing the rest of the copy.
 */
export async function POST(req: Request) {
  try {
    if (!isPayLaterAllowed()) {
      return NextResponse.json(
        { ok: false, error: 'Pay-later bookings are not available. Please pay online to confirm.' },
        { status: 403 }
      );
    }

    const body: BookingStateV2 & {
      totalAmount: number;
      serviceFee?: number;
      frequencyDiscount?: number;
      // Optional equipment payload surfaced from the booking wizard
      equipment_required?: boolean;
      equipment_fee?: number; // ZAR
    } = await req.json();

    const legacyGuest = rejectLegacyBookingPricingFields(body as unknown as Record<string, unknown>);
    if (legacyGuest) return legacyGuest;
    const pricingExpiresAtRaw = (body as unknown as Record<string, unknown>).pricing_expires_at;
    const pricingExpiresAtClient = typeof pricingExpiresAtRaw === 'string' ? pricingExpiresAtRaw : null;
    if (pricingExpiresAtClient && new Date(pricingExpiresAtClient).getTime() < Date.now()) {
      return NextResponse.json(
        {
          ok: false,
          code: 'PRICING_EXPIRED',
          error: 'Pricing verification expired. Please re-verify before continuing.',
        },
        { status: 409 }
      );
    }
    const idempotencyKey = normalizeIdempotencyKey((body as { idempotency_key?: unknown }).idempotency_key);

    if (idempotencyKey) {
      const existing = await findBookingByIdempotencyKey(supabase, idempotencyKey);
      if (existing?.id) {
        return NextResponse.json({
          ok: true,
          bookingId: existing.id,
          message: 'Booking already created for this idempotency key.',
          idempotent: true,
          totalAmount:
            typeof existing.price === 'number'
              ? existing.price
              : Math.round(Number(existing.total_amount || 0)) / 100,
        });
      }
    }

    Object.assign(body, { selected_team: resolveBookingSelectedTeam(body) });

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

    const tipAmt = body.tipAmount || 0;

    const authGuest = await getServerAuthUser();
    const pricingCustomerId = await resolveCustomerIdForPricing(supabase, {
      bodyCustomerId: (body as { customer_id?: string }).customer_id,
      authUserId: authGuest?.id ?? null,
    });

    let serverCart: Awaited<ReturnType<typeof runPricingIntegrityPipeline>>['serverCart'];
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
        tipAmount: tipAmt,
        discountAmount: body.discountAmount || 0,
        numberOfCleaners: body.numberOfCleaners,
        provideEquipment: body.provideEquipment,
        carpetDetails: body.carpetDetails ?? undefined,
        pricingMode: (body as { pricingMode?: 'basic' | 'premium' }).pricingMode,
        date: body.date,
        time: body.time,
        address: body.address,
        discountCode: body.discountCode ?? undefined,
        promo_code: (body as { promo_code?: string }).promo_code,
        email: body.email,
        customer_id: pricingCustomerId ?? undefined,
        use_points: (body as { use_points?: number }).use_points,
      });
      serverCart = integrity.serverCart;
      pricingSnapshot = integrity.pricingSnapshot;
      pricingHash = integrity.pricingHash;
      pricingVersion = integrity.pricingVersion;
    } catch (e) {
      console.error('[bookings/guest] server pricing', e);
      return NextResponse.json(
        { ok: false, error: 'Pricing is temporarily unavailable. Please try again.' },
        { status: 503 }
      );
    }

    const discountCheck = await validateBookingDiscountAmount(supabase, {
      discountCode: body.discountCode ?? undefined,
      promo_code: (body as { promo_code?: string }).promo_code,
      discountAmountClaimedZar: body.discountAmount || 0,
      subtotalBeforeDiscountZar: body.totalAmount - tipAmt + (body.discountAmount || 0),
      serviceType: body.service,
      ...(serverCart.calc.unifiedPricing != null
        ? { serverExpectedDiscountZar: serverCart.calc.unifiedPricing.discount_amount_zar }
        : {}),
    });
    if (!discountCheck.ok) {
      return NextResponse.json(
        { ok: false, error: discountCheck.error },
        { status: discountCheck.status }
      );
    }

    const ptsGuest = validateBookingUsePointsAgainstServer(
      body.service,
      (body as { use_points?: number }).use_points,
      serverCart.calc.unifiedPricing ?? null,
    );
    if (!ptsGuest.ok) {
      return NextResponse.json({ ok: false, error: ptsGuest.message }, { status: 400 });
    }

    const checkoutPricing = await runBookingCheckoutAvailability(supabase, {
      date: body.date,
      service: body.service,
      selected_team: body.selected_team ?? undefined,
    });
    if (!checkoutPricing.ok) {
      return NextResponse.json(
        { ok: false, error: checkoutPricing.reason },
        { status: checkoutPricing.status }
      );
    }

    const serverChargeZar = serverCart.price_zar;
    const serverChargeCents = serverCart.total_amount_cents;
    const clientCents = Math.round(Number(body.totalAmount) * 100);
    const clientHash = (body as { pricing_hash?: string }).pricing_hash;
    if (typeof clientHash === 'string' && clientHash && clientHash !== pricingHash) {
      await logPricingIntegrityDiscrepancy(supabase, {
        route: 'POST /api/bookings/guest',
        booking_id: null,
        client_total: Number(body.totalAmount),
        server_total: serverChargeZar,
        client_hash: clientHash,
        server_hash: pricingHash,
        reason: 'pricing_hash_mismatch',
      });
      // If totals match, continue and persist the newest server hash.
      if (clientCents !== serverChargeCents) {
        return NextResponse.json(
          {
            ok: false,
            code: 'PRICE_MISMATCH',
            error: 'Total does not match server pricing. Please refresh and try again.',
            client_total: Number(body.totalAmount),
            server_total: serverChargeZar,
            difference_reason: 'pricing_hash_mismatch',
            server_pricing_hash: pricingHash,
          },
          { status: 400 }
        );
      }
    }
    if (clientCents !== serverChargeCents) {
      await logPricingIntegrityDiscrepancy(supabase, {
        route: 'POST /api/bookings/guest',
        booking_id: null,
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
          error: 'Total does not match server pricing. Please refresh and try again.',
          client_total: Number(body.totalAmount),
          server_total: serverChargeZar,
          difference_reason: 'authoritative_recalculation_changed_total',
          server_pricing_hash: pricingHash,
        },
        { status: 400 }
      );
    }

    const adjustedTotalAmount = serverChargeZar;
    const pricingExpiresAt = buildPricingExpiresAt();

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

    const numberOfCleaners = Math.max(1, Math.round(body.numberOfCleaners ?? 1));
    const requiresTeam =
      body.service === 'Deep' ||
      body.service === 'Move In/Out' ||
      ((body.service === 'Standard' || body.service === 'Airbnb') && numberOfCleaners > 1);

    // Extract tip amount (tips go 100% to cleaner, separate from commission)
    const tipAmount = body.tipAmount || 0;
    const tipAmountInCents = Math.round(tipAmount * 100);
    const serviceTotal = adjustedTotalAmount - tipAmount;

    const dispatchSupabase = createServiceClient();
    const pm = (body as { pricingMode?: 'basic' | 'premium' }).pricingMode ?? 'premium';
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
      date: body.date,
      time: body.time,
      bedrooms: body.bedrooms,
      bathrooms: body.bathrooms,
      extras: body.extras || [],
      extrasQuantities: body.extrasQuantities || {},
      addressSuburb: body.address.suburb,
      addressCity: body.address.city,
      preferredCleanerId: body.cleaner_id,
      service: body.service ?? null,
      pricingMode: pm,
      extraRooms: body.extraRooms ?? 0,
      bookingLocation,
    });

    if (!dispatch.ok) {
      return jsonFromDispatchFailure(dispatch, {
        area: body.address?.suburb ?? null,
        time: body.time ?? null,
      });
    }

    const { durationMinutes, expectedEndTime, cleanerIds: assignedCleanerIds } = dispatch;
    const cleanerIdForInsert: string | null = assignedCleanerIds[0] ?? null;

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
    const freqDiscZarGuest = serverCart.calc.frequencyDiscount;
    const b = serverCart.calc.breakdown;
    const companyCosts = deriveCompanyOnlyCostsCents({
      serviceType: body.service ?? null,
      equipmentChargeZar: b.equipmentCharge,
      laborSubtotalOneCleanerZar: b.laborSubtotalOneCleaner,
      numberOfCleaners: b.numberOfCleaners,
    });
    const earningsFields = buildEarningsInsertFields({
      totalAmountCents,
      serviceFeeCents,
      tipCents: tipAmountInCents,
      hireDate: cleanerHireDate,
      serviceType: body.service ?? null,
      requiresTeam,
      teamSize: numberOfCleaners,
      durationMinutes: durationMinutes ?? null,
      equipmentCostCents: companyCosts.equipmentCostCents,
      extraCleanerFeeCents: companyCosts.extraCleanerFeeCents,
    });

    const frequencyForDb = body.frequency === 'one-time' ? null : body.frequency;

    const unifiedGuest = serverCart.calc.unifiedPricing ?? null;

    const bodyGuest = body as BookingBodyForPricing & { rugs?: number; carpets?: number };
    const v4Analytics = buildPriceSnapshotV4AnalyticsFromUnified(
      {
        service: body.service,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        extraRooms: bodyGuest.extraRooms,
        pricingMode: bodyGuest.pricingMode,
        rugs: bodyGuest.rugs,
        carpets: bodyGuest.carpets,
      },
      unifiedGuest,
      serviceTotal
    );

    const priceSnapshot = {
      total_amount_cents: Math.round(adjustedTotalAmount * 100),
      price_zar: adjustedTotalAmount,
      pricing_v5_2: buildFinalPriceSnapshotPayload(serverCart.finalPrice),
      service: {
        type: body.service,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
      },
      extras: body.extras || [],
      frequency: frequencyForDb,
      service_fee: 0,
      frequency_discount: Math.round(freqDiscZarGuest * 100),
      tip_amount: tipAmountInCents,
      subtotal: Math.round(serviceTotal * 100),
      total: adjustedTotalAmount * 100,
      snapshot_date: new Date().toISOString(),
      ...(v4Analytics ?? {}),
      ...(unifiedGuest && {
        pricing_mode: pm,
        extra_rooms: body.extraRooms ?? 0,
        table_price_zar: unifiedGuest.table_price_zar,
        extra_room_price_zar: unifiedGuest.extra_room_price_zar,
        extras_price_zar: unifiedGuest.extras_price_zar,
        base_price_zar: unifiedGuest.base_price_zar,
        forecast_multiplier: unifiedGuest.forecast_multiplier,
        forecast_adjustment_zar: unifiedGuest.forecast_adjustment_zar,
        price_after_forecast_zar: unifiedGuest.price_after_forecast_zar,
        surge_multiplier: unifiedGuest.surge_multiplier,
        surge_amount_zar: unifiedGuest.surge_amount_zar,
        ...(unifiedGuest.surge_breakdown !== undefined
          ? { surge_breakdown: unifiedGuest.surge_breakdown }
          : {}),
        ...(unifiedGuest.surge_pricing_note != null
          ? { surge_pricing_note: unifiedGuest.surge_pricing_note }
          : {}),
        referral_discount_zar: unifiedGuest.referral_discount_zar,
        loyalty_points_used: unifiedGuest.loyalty_points_used,
        loyalty_discount_zar: unifiedGuest.loyalty_discount_zar,
        unified_hours: unifiedGuest.hours,
        duration_hours: unifiedGuest.duration,
        team_size: unifiedGuest.team_size,
      }),
    };

    const equipmentRequired =
      (body as any).equipment_required ??
      body.provideEquipment ??
      false;
    const equipmentFeeZar: number =
      typeof (body as any).equipment_fee === 'number'
        ? (body as any).equipment_fee
        : 0;

    const manageToken = generateManageToken();

    const pointsRedeemedGuest = Math.max(
      0,
      Math.floor(Number(unifiedGuest?.loyalty_points_used) || 0),
    );

    logFinalPriceCheck({
      route: 'POST /api/bookings/guest',
      bookingId,
      price_zar: adjustedTotalAmount,
      total_amount_cents: totalAmountCents,
    });

    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        customer_id: customerId,
        points_redeemed: pointsRedeemedGuest,
        cleaner_id: cleanerIdForInsert,
        assigned_cleaner_id: cleanerIdForInsert,
        assigned_cleaners: assignedCleanerIds.length > 0 ? assignedCleanerIds : null,
        booking_date: body.date,
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
        payment_reference: null,
        total_amount: totalAmountCents,
        price: adjustedTotalAmount,
        tip_amount: tipAmountInCents,
        ...earningsFields,
        requires_team: requiresTeam,
        surge_pricing_applied: (unifiedGuest?.surge_amount_zar ?? 0) > 0.001,
        surge_amount: Math.round((unifiedGuest?.surge_amount_zar ?? 0) * 100),
        frequency: frequencyForDb,
        service_fee: 0,
        frequency_discount: Math.round(freqDiscZarGuest * 100),
        price_snapshot: priceSnapshot,
        // Legacy equipment fields
        provide_equipment: equipmentRequired,
        equipment_charge: equipmentFeeZar ? Math.round(equipmentFeeZar * 100) : 0,
        // Normalized equipment fields
        equipment_required: equipmentRequired,
        equipment_fee: equipmentFeeZar,
        pricing_snapshot: pricingSnapshot,
        pricing_hash: pricingHash,
        pricing_version: pricingVersion,
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
        status: 'pending',
        tracking_status: cleanerIdForInsert ? 'assigned' : null,
        manage_token: manageToken,
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { ok: false, error: `Failed to save booking: ${bookingError.message}` },
        { status: 500 }
      );
    }

    if (assignedCleanerIds.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('[assignment]', {
        booking_id: bookingId,
        assigned_cleaners: assignedCleanerIds,
        duration: durationMinutes,
        team_size: assignedCleanerIds.length,
      });
    }

    if (cleanerIdForInsert && bookingData) {
      try {
        const { data: cleanerRow } = await supabase
          .from('cleaners')
          .select('id, name, phone')
          .eq('id', cleanerIdForInsert)
          .maybeSingle();
        if (cleanerRow) {
          await sendCleanerNotification({
            type: 'assigned',
            cleaner: cleanerRow,
            booking: bookingData,
          });
        }
      } catch (e) {
        console.warn('[guest booking] cleaner assigned notification failed', e);
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

    // Send confirmation emails
    let emailSent = false;
    if (process.env.RESEND_API_KEY) {
      try {
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

        const customerEmailData = await generateBookingConfirmationEmail({
          manageToken,
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
          totalAmount: adjustedTotalAmount,
          // Surface normalized equipment fields to the email template
          equipment_required: equipmentRequired,
          equipment_fee: equipmentFeeZar,
          cleanerName
        });
        
        const adminEmailData = await generateAdminBookingNotificationEmail({
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
          totalAmount: adjustedTotalAmount,
          equipment_required: equipmentRequired,
          equipment_fee: equipmentFeeZar,
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
        console.warn('[supply] guest booking check failed', e);
      }
    })();

    return NextResponse.json({
      ok: true,
      bookingId,
      message: 'Booking created successfully',
      emailSent,
      pricing_hash: pricingHash,
      pricing_version: pricingVersion,
      pricing_expires_at: pricingExpiresAt,
      pricing_snapshot: pricingSnapshot,
      confirmationToken: createBookingLookupToken(bookingId),
      assigned_cleaners: assignedCleanerIds,
      start: body.time,
      end: expectedEndTime,
      duration: durationMinutes,
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
  const ct = searchParams.get('ct');

  if (!id) {
    return NextResponse.json(
      { ok: false, error: 'Booking ID is required' },
      { status: 400 }
    );
  }

  try {
    const { isSafeBookingLookupId } = await import('@/lib/booking-lookup-id');
    const { verifyBookingLookupToken, isBookingLookupTokenConfigured } = await import(
      '@/lib/booking-lookup-token'
    );

    if (!isSafeBookingLookupId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid reference' }, { status: 400 });
    }

    if (isBookingLookupTokenConfigured() && !verifyBookingLookupToken(id, ct)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const r1 = await supabase.from('bookings').select('*').eq('id', id).maybeSingle();
    if (r1.error) {
      console.error('guest GET booking:', r1.error);
      return NextResponse.json({ ok: false, error: 'Failed to fetch booking' }, { status: 500 });
    }
    let booking = r1.data;
    if (!booking) {
      const r2 = await supabase.from('bookings').select('*').eq('payment_reference', id).maybeSingle();
      if (r2.error) {
        return NextResponse.json({ ok: false, error: 'Failed to fetch booking' }, { status: 500 });
      }
      booking = r2.data;
    }

    if (!booking) {
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

