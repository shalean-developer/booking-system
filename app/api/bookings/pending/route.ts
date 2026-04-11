import { NextResponse } from 'next/server';
import { BookingState } from '@/types/booking';
import { supabase } from '@/lib/supabase';
import { validatePendingBookingEnv } from '@/lib/env-validation';
import { getServerAuthUser } from '@/lib/supabase-server';
import { calculateCleanerEarnings } from '@/lib/cleaner-earnings';
import { generateUniqueBookingId } from '@/lib/booking-id';
import { validateBookingDiscountAmount } from '@/lib/discount-booking-server';
import { computeCheckoutPricing } from '@/lib/booking-checkout-pricing';
import { computeServerPreSurgeTotalZar } from '@/lib/booking-server-pricing';

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
      return NextResponse.json({ ok: false, error: discountCheck.error }, { status: discountCheck.status });
    }

    let serverCart: Awaited<ReturnType<typeof computeServerPreSurgeTotalZar>>;
    try {
      serverCart = await computeServerPreSurgeTotalZar(supabase, {
        service: body.service,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        extras: body.extras,
        extrasQuantities: body.extrasQuantities,
        frequency: body.frequency || 'one-time',
        tipAmount: tipAmountEarly,
        discountAmount: discountAmountClaimed,
        numberOfCleaners: body.numberOfCleaners,
        provideEquipment: body.provideEquipment,
        carpetDetails: body.carpetDetails ?? undefined,
      });
    } catch (e) {
      console.error('[bookings/pending] server pricing', e);
      return NextResponse.json(
        { ok: false, error: 'Pricing is temporarily unavailable. Please try again.' },
        { status: 503 },
      );
    }

    if (Math.abs(serverCart.preSurgeTotalZar - preSurgeTotal) > 0.02) {
      return NextResponse.json(
        { ok: false, error: 'Price mismatch. Please refresh the page and try again.' },
        { status: 400 },
      );
    }

    const checkoutPricing = await computeCheckoutPricing(supabase, {
      date: body.date,
      service: body.service,
      preSurgeTotalZar: serverCart.preSurgeTotalZar,
      selected_team: body.selected_team,
    });
    if (!checkoutPricing.ok) {
      return NextResponse.json({ ok: false, error: checkoutPricing.error }, { status: checkoutPricing.status });
    }

    if (Math.abs(checkoutPricing.finalTotalZar - body.totalAmount) > 0.02) {
      return NextResponse.json(
        { ok: false, error: 'Total does not match server pricing. Please refresh and try again.' },
        { status: 400 },
      );
    }

    const authUser = await getServerAuthUser();

    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: duplicate } = await supabase
      .from('bookings')
      .select('id')
      .eq('customer_email', body.email.trim().toLowerCase())
      .eq('booking_date', body.date)
      .eq('booking_time', body.time)
      .is('payment_reference', null)
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
    const adjustedTotalAmount = checkoutPricing.finalTotalZar;
    const surgePricingApplied = checkoutPricing.surgePricingApplied;
    const surgeAmount = checkoutPricing.surgeAmountZar;

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

    const priceSnapshot = {
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
      service_fee: Math.round(serverCart.serviceFeeZar * 100),
      frequency_discount: Math.round(serverCart.frequencyDiscountZar * 100),
      discount_code: body.discountCode || null,
      discount_amount: discountAmount,
      tip_amount: tipAmountInCents,
      subtotal: Math.round((serverCart.coreTotalZar - (body.discountAmount || 0)) * 100),
      total: adjustedTotalAmount * 100,
      snapshot_date: new Date().toISOString(),
    };

    const requiresTeam =
      body.service === 'Deep' ||
      body.service === 'Move In/Out' ||
      ((body.service === 'Standard' || body.service === 'Airbnb') && numberOfCleaners > 1);

    let cleanerHireDate = null;
    let cleanerEarnings = 0;
    let cleanerIdForInsert: string | null = null;

    if (requiresTeam) {
      cleanerEarnings = 0;
    } else if (body.cleaner_id && body.cleaner_id !== 'manual') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(body.cleaner_id)) {
        cleanerIdForInsert = body.cleaner_id;
        const { data: cleanerData } = await supabase.from('cleaners').select('hire_date').eq('id', body.cleaner_id).single();
        cleanerHireDate = cleanerData?.hire_date || null;
        cleanerEarnings =
          calculateCleanerEarnings(
            adjustedTotalAmount ?? null,
            serverCart.serviceFeeZar ?? null,
            cleanerHireDate,
            tipAmount,
            body.service ?? null,
          ) * 100;
      }
    }

    const frequencyForDb = body.frequency === 'one-time' ? null : body.frequency;

    const { data: bookingRows, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        customer_id: customerId,
        user_id: authUser?.id ?? null,
        cleaner_id: requiresTeam ? null : cleanerIdForInsert,
        booking_date: body.date || null,
        booking_time: body.time,
        expected_end_time: (body as { expectedEndTime?: string }).expectedEndTime || null,
        service_type: body.service,
        customer_name: `${body.firstName} ${body.lastName}`,
        customer_email: body.email,
        customer_phone: body.phone,
        address_line1: body.address.line1,
        address_suburb: body.address.suburb,
        address_city: body.address.city,
        payment_reference: null,
        total_amount: Math.round(adjustedTotalAmount * 100),
        price: adjustedTotalAmount,
        tip_amount: tipAmountInCents,
        cleaner_earnings: cleanerEarnings,
        requires_team: requiresTeam,
        surge_pricing_applied: surgePricingApplied,
        surge_amount: Math.round(surgeAmount * 100),
        frequency: frequencyForDb,
        service_fee: Math.round(serverCart.serviceFeeZar * 100),
        frequency_discount: Math.round(serverCart.frequencyDiscountZar * 100),
        price_snapshot: priceSnapshot,
        status: 'pending',
      })
      .select();

    if (bookingError) {
      return NextResponse.json(
        { ok: false, error: `Failed to save booking: ${bookingError.message}` },
        { status: 500 },
      );
    }

    if (requiresTeam && body.selected_team) {
      await supabase.from('booking_teams').insert({
        booking_id: bookingId,
        team_name: body.selected_team,
        supervisor_id: null,
      });
    }

    return NextResponse.json({
      ok: true,
      bookingId,
      totalAmount: adjustedTotalAmount,
      message: 'Booking saved. Proceed to payment.',
      booking: bookingRows?.[0] ?? null,
    });
  } catch (error) {
    console.error('[bookings/pending]', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to create pending booking' },
      { status: 500 },
    );
  }
}
