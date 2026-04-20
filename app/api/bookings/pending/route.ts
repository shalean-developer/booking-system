import { NextResponse } from 'next/server';
import { BookingState } from '@/types/booking';
import { supabase } from '@/lib/supabase';
import { validatePendingBookingEnv } from '@/lib/env-validation';
import { getServerAuthUser } from '@/lib/supabase-server';
import { buildEarningsInsertFields } from '@/lib/earnings-v2';
import { deriveCompanyOnlyCostsCents } from '@/lib/earnings-company-costs';
import { generateUniqueBookingId } from '@/lib/booking-id';
import { validateBookingDiscountAmount } from '@/lib/discount-booking-server';
import { runBookingCheckoutAvailability } from '@/lib/booking-checkout-pricing';
import { resolveCustomerIdForPricing } from '@/lib/booking-server-pricing';
import { validateBookingUsePointsAgainstServer } from '@/lib/loyalty/booking-points-validation';
import { createServiceClient } from '@/lib/supabase-server';
import { resolveBookingCleanerAndSchedule } from '@/lib/dispatch/resolve-booking-cleaner';
import { jsonFromDispatchFailure } from '@/lib/matching/dispatch-http';
import {
  recomputeEngineFinalCentsFromBookingBody,
  validatePricingEngineRequest,
} from '@/lib/pricing-engine';
import { fetchQuickCleanSettings } from '@/lib/quick-clean-settings';
import { runSupplyActivationCheck } from '@/lib/supply/run-check';
import { runSlotSupplyInviteForArea } from '@/lib/cron/supply-check';
import { logFinalPriceCheck } from '@/lib/pricing/final-price-check-log';
import { appliedRulesForLog } from '@/lib/pricing/admin-rule-utils';
import { buildFinalPriceSnapshotPayload } from '@/lib/pricing/final-pricing';
import { buildPriceSnapshotV4AnalyticsFromUnified } from '@/lib/pricing/v4/price-snapshot-analytics';
import type { BookingBodyForPricing } from '@/lib/booking-server-pricing';
import { rejectLegacyBookingPricingFields } from '@/lib/reject-legacy-booking-fields';
import { resolveBookingSelectedTeam } from '@/lib/booking-team-payload';
import {
  buildPricingExpiresAt,
  logPricingIntegrityDiscrepancy,
  verifyPricingLockToken,
  runPricingIntegrityPipeline,
} from '@/lib/pricing/pricing-integrity-pipeline';
import { findBookingByIdempotencyKey, normalizeIdempotencyKey } from '@/lib/booking-idempotency';

/**
 * Create a booking without payment (status pending, no Paystack reference).
 * Customer completes payment via Edge Functions → verify-payment / webhook.
 */
export async function POST(req: Request) {
  try {
    const envValidation = validatePendingBookingEnv();
    if (!envValidation.valid) {
      return NextResponse.json(
        { ok: false, error: 'Server configuration error', details: envValidation.errors },
        { status: 500 },
      );
    }

    const body: BookingState = await req.json();
    const legacyPending = rejectLegacyBookingPricingFields(body as unknown as Record<string, unknown>);
    if (legacyPending) return legacyPending;
    const pricingExpiresAtRaw = (body as unknown as Record<string, unknown>).pricing_expires_at;
    const pricingExpiresAtClient =
      typeof pricingExpiresAtRaw === 'string' ? pricingExpiresAtRaw : null;
    if (pricingExpiresAtClient && new Date(pricingExpiresAtClient).getTime() < Date.now()) {
      return NextResponse.json(
        {
          ok: false,
          code: 'PRICING_EXPIRED',
          error: 'Pricing verification expired. Please re-verify before continuing.',
        },
        { status: 409 },
      );
    }
    const idempotencyKey = normalizeIdempotencyKey((body as { idempotency_key?: unknown }).idempotency_key);

    if (idempotencyKey) {
      const existing = await findBookingByIdempotencyKey(supabase, idempotencyKey);
      if (existing?.id) {
        return NextResponse.json({
          ok: true,
          bookingId: existing.id,
          totalAmount:
            typeof existing.price === 'number'
              ? existing.price
              : Math.round(Number(existing.total_amount || 0)) / 100,
          message: 'Booking already created for this idempotency key.',
          idempotent: true,
        });
      }
    }

    Object.assign(body, { selected_team: resolveBookingSelectedTeam(body) });

    const supabaseService = createServiceClient();
    const quickCleanSettings = await fetchQuickCleanSettings(supabaseService);

    if (body.paymentReference) {
      return NextResponse.json(
        { ok: false, error: 'Remove paymentReference for pay-later booking' },
        { status: 400 },
      );
    }

    if (!body.totalAmount || body.totalAmount <= 0) {
      return NextResponse.json({ ok: false, error: 'Total amount is required' }, { status: 400 });
    }
    if (!body.date || !body.time) {
      return NextResponse.json({ ok: false, error: 'Booking date and time are required' }, { status: 400 });
    }
    if (!body.service) {
      return NextResponse.json({ ok: false, error: 'Service is required' }, { status: 400 });
    }

    const engineValidation = validatePricingEngineRequest(body, quickCleanSettings);
    if (!engineValidation.ok) {
      return NextResponse.json({ ok: false, error: engineValidation.error }, { status: 400 });
    }

    const authEarly = await getServerAuthUser();
    const pricingCustomerId = await resolveCustomerIdForPricing(supabase, {
      bodyCustomerId: (body as { customer_id?: string }).customer_id,
      authUserId: authEarly?.id ?? null,
    });

    const tipAmountEarly = body.tipAmount || 0;
    const discountAmountClaimed = body.discountAmount || 0;

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
        tipAmount: tipAmountEarly,
        discountAmount: discountAmountClaimed,
        numberOfCleaners: body.numberOfCleaners,
        pricingMode: body.pricingMode,
        provideEquipment: body.provideEquipment,
        carpetDetails: body.carpetDetails ?? undefined,
        date: body.date,
        time: body.time,
        address: body.address,
        discountCode: body.discountCode,
        promo_code: body.promo_code,
        email: body.email,
        customer_id: pricingCustomerId ?? undefined,
        use_points: body.use_points,
      });
      serverCart = integrity.serverCart;
      pricingSnapshot = integrity.pricingSnapshot;
      pricingHash = integrity.pricingHash;
      pricingVersion = integrity.pricingVersion;
    } catch (e) {
      console.error('[bookings/pending] server pricing', e);
      return NextResponse.json(
        { ok: false, error: 'Pricing is temporarily unavailable. Please try again.' },
        { status: 503 },
      );
    }

    const engineCents = recomputeEngineFinalCentsFromBookingBody(body, quickCleanSettings);
    const engineZar = engineCents != null ? engineCents / 100 : null;
    const subtotalBeforeDiscount =
      engineZar != null
        ? engineZar
        : (body.totalAmount ?? 0) - tipAmountEarly + discountAmountClaimed;

    const discountCheck = await validateBookingDiscountAmount(supabase, {
      discountCode: body.discountCode,
      promo_code: body.promo_code,
      discountAmountClaimedZar: discountAmountClaimed,
      subtotalBeforeDiscountZar: subtotalBeforeDiscount,
      serviceType: body.service,
      ...(serverCart.calc.unifiedPricing != null
        ? { serverExpectedDiscountZar: serverCart.calc.unifiedPricing.discount_amount_zar }
        : {}),
    });
    if (!discountCheck.ok) {
      return NextResponse.json({ ok: false, error: discountCheck.error }, { status: discountCheck.status });
    }

    const ptsCheck = validateBookingUsePointsAgainstServer(
      body.service,
      body.use_points,
      serverCart.calc.unifiedPricing ?? null,
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

    let serverChargeZar = serverCart.price_zar;
    let serverChargeCents = serverCart.total_amount_cents;
    const clientCents = Math.round(Number(body.totalAmount) * 100);
    const bodyExtras = body as unknown as Record<string, unknown>;
    const clientHash =
      typeof bodyExtras.pricing_hash === 'string' ? bodyExtras.pricing_hash : undefined;
    const pricingLockTokenRaw = bodyExtras.pricing_lock_token;
    const pricingLockToken =
      typeof pricingLockTokenRaw === 'string' ? pricingLockTokenRaw : null;
    const lockClaims =
      pricingLockToken && body.service && body.date && body.time
        ? verifyPricingLockToken(pricingLockToken, {
            service: String(body.service),
            date: String(body.date),
            time: String(body.time),
          })
        : null;
    const canHonorLockedPrice =
      lockClaims != null &&
      typeof clientHash === 'string' &&
      clientHash === lockClaims.pricing_hash &&
      clientCents === lockClaims.total_amount_cents;
    if (typeof clientHash === 'string' && clientHash && clientHash !== pricingHash) {
      await logPricingIntegrityDiscrepancy(supabase, {
        route: 'POST /api/bookings/pending',
        booking_id: null,
        client_total: Number(body.totalAmount),
        server_total: serverChargeZar,
        client_hash: clientHash,
        server_hash: pricingHash,
        reason: 'pricing_hash_mismatch',
      });
      // If totals still match, accept and auto-correct to latest server hash.
      if (clientCents !== serverChargeCents && !canHonorLockedPrice) {
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
    if (clientCents !== serverChargeCents && !canHonorLockedPrice) {
      await logPricingIntegrityDiscrepancy(supabase, {
        route: 'POST /api/bookings/pending',
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
    if (canHonorLockedPrice && lockClaims) {
      serverChargeCents = lockClaims.total_amount_cents;
      serverChargeZar = lockClaims.total_amount_cents / 100;
      pricingHash = lockClaims.pricing_hash;
      pricingVersion = lockClaims.pricing_version;
    }

    const authUser = authEarly;

    /**
     * One active checkout per email + slot in a short window.
     * Use `status = 'pending'` so paid / cancelled rows never block a new booking.
     * (Older queries only checked `payment_reference IS NULL`, which could mis-classify rows.)
     */
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: duplicate } = await supabase
      .from('bookings')
      .select('id')
      .eq('customer_email', body.email.trim().toLowerCase())
      .eq('booking_date', body.date)
      .eq('booking_time', body.time)
      .eq('status', 'pending')
      .gte('created_at', since)
      .maybeSingle();

    if (duplicate?.id) {
      return NextResponse.json(
        {
          ok: false,
          code: 'DUPLICATE_UNPAID_SLOT',
          existingBookingId: duplicate.id,
          error: 'You already have an unpaid booking for this slot. Pay for it or cancel it, then try again.',
        },
        { status: 409 },
      );
    }

    const bookingId = generateUniqueBookingId();
    const pricingExpiresAt = buildPricingExpiresAt();
    const adjustedTotalAmount = serverChargeZar;
    const unifiedSnapPending = serverCart.calc.unifiedPricing;
    const surgePricingApplied = (unifiedSnapPending?.surge_amount_zar ?? 0) > 0.001;
    const surgeAmount = unifiedSnapPending?.surge_amount_zar ?? 0;

    let customerId: string | null = (body as { customer_id?: string }).customer_id || null;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
          const updateData: Record<string, unknown> = {
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
          await supabase.from('customers').update(updateData).eq('id', existingCustomer.id);
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
              auth_user_id: authUser?.id || null,
              total_bookings: 1,
            })
            .select()
            .single();

          if (!customerError && newCustomer) {
            customerId = newCustomer.id;
          }
        }
      }
    }

    const numberOfCleaners = Math.max(1, Math.round((body as { numberOfCleaners?: number }).numberOfCleaners ?? 1));
    const tipAmount = body.tipAmount || 0;
    const tipAmountInCents = Math.round(tipAmount * 100);
    const serviceTotal = adjustedTotalAmount - tipAmount;
    const frequencyForSnapshot = body.frequency === 'one-time' ? null : body.frequency;
    const discountAmount = (body.discountAmount || 0) * 100;

    const bodyPending = body as BookingBodyForPricing & { rugs?: number; carpets?: number };
    const v4Analytics = buildPriceSnapshotV4AnalyticsFromUnified(
      {
        service: body.service,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        extraRooms: bodyPending.extraRooms,
        pricingMode: bodyPending.pricingMode,
        rugs: bodyPending.rugs,
        carpets: bodyPending.carpets,
      },
      serverCart.calc.unifiedPricing,
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
        numberOfCleaners,
      },
      extras: body.extras || [],
      extras_quantities: body.extrasQuantities || {},
      frequency: frequencyForSnapshot,
      base_price: Math.round(serverCart.basePriceZar * 100),
      extras_total: Math.round(serverCart.extrasTotalZar * 100),
      service_fee: 0,
      frequency_discount: Math.round(serverCart.frequencyDiscountZar * 100),
      discount_code: body.discountCode || null,
      discount_amount: discountAmount,
      tip_amount: tipAmountInCents,
      subtotal: Math.round((serverCart.coreTotalZar - (body.discountAmount || 0)) * 100),
      total: adjustedTotalAmount * 100,
      snapshot_date: new Date().toISOString(),
      ...(v4Analytics ?? {}),
      ...(serverCart.calc.unifiedPricing && {
        table_price_zar: serverCart.calc.unifiedPricing.table_price_zar,
        extra_room_price_zar: serverCart.calc.unifiedPricing.extra_room_price_zar,
        extras_price_zar: serverCart.calc.unifiedPricing.extras_price_zar,
        base_price_zar: serverCart.calc.unifiedPricing.base_price_zar,
        forecast_multiplier: serverCart.calc.unifiedPricing.forecast_multiplier,
        forecast_adjustment_zar: serverCart.calc.unifiedPricing.forecast_adjustment_zar,
        price_after_forecast_zar: serverCart.calc.unifiedPricing.price_after_forecast_zar,
        surge_multiplier: serverCart.calc.unifiedPricing.surge_multiplier,
        surge_amount_zar: serverCart.calc.unifiedPricing.surge_amount_zar,
        ...(serverCart.calc.unifiedPricing.surge_breakdown !== undefined
          ? { surge_breakdown: serverCart.calc.unifiedPricing.surge_breakdown }
          : {}),
        ...(serverCart.calc.unifiedPricing.surge_pricing_note != null
          ? { surge_pricing_note: serverCart.calc.unifiedPricing.surge_pricing_note }
          : {}),
        referral_discount_zar: serverCart.calc.unifiedPricing.referral_discount_zar,
        loyalty_points_used: serverCart.calc.unifiedPricing.loyalty_points_used,
        loyalty_discount_zar: serverCart.calc.unifiedPricing.loyalty_discount_zar,
        unified_hours: serverCart.calc.unifiedPricing.hours,
        duration_hours: serverCart.calc.unifiedPricing.duration,
        team_size: serverCart.calc.unifiedPricing.team_size,
      }),
    };

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
      pricingMode: body.pricingMode ?? null,
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

    let cleanerHireDate: string | null = null;
    const cleanerIdForInsert: string | null = assignedCleanerIds[0] ?? null;

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
    const pb = serverCart.calc.breakdown;
    let equipmentCostCentsForEarnings: number;
    let extraCleanerFeeCentsForEarnings: number;
    if (engineCents != null) {
      equipmentCostCentsForEarnings = Math.max(0, Math.round(Number(body.equipmentCostCents) || 0));
      extraCleanerFeeCentsForEarnings = Math.max(0, Math.round(Number(body.extraCleanerFeeCents) || 0));
    } else {
      const companyCosts = deriveCompanyOnlyCostsCents({
        serviceType: body.service ?? null,
        equipmentChargeZar: pb.equipmentCharge,
        laborSubtotalOneCleanerZar: pb.laborSubtotalOneCleaner,
        numberOfCleaners: pb.numberOfCleaners,
      });
      equipmentCostCentsForEarnings = companyCosts.equipmentCostCents;
      extraCleanerFeeCentsForEarnings = companyCosts.extraCleanerFeeCents;
    }

    const earningsTeamSize =
      engineCents != null && body.pricingTeamSize != null && Number.isFinite(body.pricingTeamSize)
        ? Math.max(1, Math.round(body.pricingTeamSize))
        : numberOfCleaners;

    const earningsDurationMinutes =
      engineCents != null && body.pricingTotalHours != null && Number.isFinite(body.pricingTotalHours)
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

    const frequencyForDb = body.frequency === 'one-time' ? null : body.frequency;
    const bookingNotes = body.notes?.trim() ? body.notes.trim() : null;

    console.log('[bookings/pending] pricing breakdown before insert', {
      bookingId,
      basePriceZar: serverCart.basePriceZar,
      extrasTotalZar: serverCart.extrasTotalZar,
      serviceFeeZar: 0,
      frequencyDiscountZar: serverCart.frequencyDiscountZar,
      discountZar: body.discountAmount || 0,
      surgeZar: surgeAmount,
      total_amount_cents: totalAmountCents,
      price_zar: adjustedTotalAmount,
      total_amount_equals_price_times_100:
        totalAmountCents === Math.round(adjustedTotalAmount * 100),
    });

    const pricingRulesPending = appliedRulesForLog(unifiedSnapPending?.admin_rule_applied);
    if (pricingRulesPending.length > 0) {
      console.log('[PRICING RULES]', { bookingId, rules: pricingRulesPending });
    }

    logFinalPriceCheck({
      route: 'POST /api/bookings/pending',
      bookingId,
      price_zar: adjustedTotalAmount,
      total_amount_cents: totalAmountCents,
    });

    const pointsRedeemedPending = Math.max(
      0,
      Math.floor(Number(serverCart.calc.unifiedPricing?.loyalty_points_used) || 0),
    );

    const { data: bookingRows, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        customer_id: customerId,
        points_redeemed: pointsRedeemedPending,
        user_id: authUser?.id ?? null,
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
        payment_reference: null,
        total_amount: Math.round(adjustedTotalAmount * 100),
        price: adjustedTotalAmount,
        tip_amount: tipAmountInCents,
        ...earningsFields,
        requires_team: requiresTeam,
        surge_pricing_applied: surgePricingApplied,
        surge_amount: Math.round(surgeAmount * 100),
        frequency: frequencyForDb,
        notes: bookingNotes,
        service_fee: 0,
        frequency_discount: Math.round(serverCart.frequencyDiscountZar * 100),
        price_snapshot: priceSnapshot,
        pricing_snapshot: pricingSnapshot,
        pricing_hash: pricingHash,
        pricing_version: pricingVersion,
        ...(idempotencyKey ? { idempotency_key: idempotencyKey } : {}),
        status: 'pending',
        tracking_status: cleanerIdForInsert ? 'assigned' : null,
      })
      .select();

    if (bookingError) {
      return NextResponse.json(
        { ok: false, error: `Failed to save booking: ${bookingError.message}` },
        { status: 500 },
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

    if (requiresTeam && body.selected_team) {
      await supabase.from('booking_teams').insert({
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
        console.warn('[supply] pending booking check failed', e);
      }
    })();

    return NextResponse.json({
      ok: true,
      bookingId,
      totalAmount: adjustedTotalAmount,
      message: 'Booking saved. Proceed to payment.',
      booking: bookingRows?.[0] ?? null,
      pricing_hash: pricingHash,
      pricing_version: pricingVersion,
      pricing_expires_at: pricingExpiresAt,
      pricing_snapshot: pricingSnapshot,
      assigned_cleaners: assignedCleanerIds,
      start: body.time,
      end: expectedEndTime,
      duration: durationMinutes,
    });
  } catch (error) {
    console.error('[bookings/pending]', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to create pending booking' },
      { status: 500 },
    );
  }
}
