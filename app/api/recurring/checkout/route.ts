import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { generateUniqueBookingId } from '@/lib/booking-id';
import { calculateBookingOccurrencesForRollingWindow } from '@/lib/recurring-bookings';
import type { Frequency, RecurringSchedule } from '@/types/recurring';

export const dynamic = 'force-dynamic';

type WeekdayRule = { day_of_week: number; preferred_time: string };

type RecurringCheckoutRequest = {
  // Payment (Paystack reference generated client-side)
  paymentReference: string;

  // Pricing (per booking)
  perBookingTotalCents: number;
  priceSnapshot?: any;

  // Customer
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Address
  address: {
    line1: string;
    suburb: string;
    city: string;
  };

  // Service
  service: string;
  bedrooms: number;
  bathrooms: number;
  extras?: string[];
  extrasQuantities?: Record<string, number>;
  notes?: string;

  // Booking cadence
  frequency: 'weekly' | 'bi-weekly' | 'monthly';

  // Optional custom multi-day recurring schedule (for weekly/bi-weekly only)
  recurringFrequency?: 'custom-weekly' | 'custom-bi-weekly' | null;
  recurringDays?: number[];
  recurringTimesByDay?: Record<number, string>;

  // Selected first occurrence
  start_date: string; // YYYY-MM-DD
  preferred_time: string; // HH:MM

  // Optional cleaner assignment
  cleaner_id?: string | null;
};

type PaystackVerifyResponse = {
  status: boolean;
  message?: string;
  data?: {
    status: string;
    reference: string;
    amount: number; // subunits (cents)
    currency: string;
    customer?: { email?: string };
    authorization?: {
      authorization_code?: string;
      reusable?: boolean;
      signature?: string;
    };
  };
};

function isValidIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function verifyPaystack(reference: string): Promise<PaystackVerifyResponse> {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackSecretKey) {
    throw new Error('PAYSTACK_SECRET_KEY not configured');
  }

  const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`;
  const verifyResponse = await fetch(verifyUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
  });

  const data = (await verifyResponse.json()) as PaystackVerifyResponse;
  if (!verifyResponse.ok) {
    throw new Error(data?.message || 'Paystack verification failed');
  }
  return data;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<RecurringCheckoutRequest>;

    if (!body.paymentReference) {
      return NextResponse.json({ ok: false, error: 'Missing paymentReference' }, { status: 400 });
    }
    if (typeof body.perBookingTotalCents !== 'number' || body.perBookingTotalCents <= 0) {
      return NextResponse.json({ ok: false, error: 'Missing perBookingTotalCents' }, { status: 400 });
    }
    if (!body.email || !body.firstName || !body.lastName || !body.phone) {
      return NextResponse.json({ ok: false, error: 'Missing customer details' }, { status: 400 });
    }
    if (!body.address?.line1 || !body.address?.suburb || !body.address?.city) {
      return NextResponse.json({ ok: false, error: 'Missing address details' }, { status: 400 });
    }
    if (!body.service) {
      return NextResponse.json({ ok: false, error: 'Missing service type' }, { status: 400 });
    }
    if (!body.frequency || !['weekly', 'bi-weekly', 'monthly'].includes(body.frequency)) {
      return NextResponse.json({ ok: false, error: 'Invalid frequency' }, { status: 400 });
    }
    if (!body.start_date || !isValidIsoDate(body.start_date)) {
      return NextResponse.json({ ok: false, error: 'Invalid start_date' }, { status: 400 });
    }
    if (!body.preferred_time || !isValidTime(body.preferred_time)) {
      return NextResponse.json({ ok: false, error: 'Invalid preferred_time' }, { status: 400 });
    }

    // Build schedule frequency (single-day vs custom multi-day)
    const isCustom =
      (body.recurringFrequency === 'custom-weekly' || body.recurringFrequency === 'custom-bi-weekly') &&
      (body.frequency === 'weekly' || body.frequency === 'bi-weekly');

    const scheduleFrequency: Frequency = isCustom
      ? (body.recurringFrequency as Frequency)
      : (body.frequency as Frequency);

    // Custom rules (if enabled)
    const rules: WeekdayRule[] = [];
    if (isCustom) {
      const recurringDays = Array.isArray(body.recurringDays) ? body.recurringDays : [];
      const timesByDay = body.recurringTimesByDay || {};
      for (const day of recurringDays) {
        const time = (timesByDay as any)[day];
        if (Number.isInteger(day) && day >= 0 && day <= 6 && typeof time === 'string' && isValidTime(time)) {
          rules.push({ day_of_week: day, preferred_time: time });
        }
      }
      if (rules.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'Custom recurring enabled but no valid day/time rules provided' },
          { status: 400 }
        );
      }
    }

    // Determine cadence fields
    const startDateObj = new Date(`${body.start_date}T00:00:00`);
    const derivedDayOfWeek = startDateObj.getDay(); // 0=Sunday..6=Saturday
    const derivedDayOfMonth = startDateObj.getDate(); // 1-31

    const day_of_week =
      scheduleFrequency === 'weekly' || scheduleFrequency === 'bi-weekly' ? derivedDayOfWeek : null;
    const day_of_month = scheduleFrequency === 'monthly' ? derivedDayOfMonth : null;
    const days_of_week =
      scheduleFrequency === 'custom-weekly' || scheduleFrequency === 'custom-bi-weekly'
        ? rules.map((r) => r.day_of_week)
        : null;

    const perBookingTotalCents = Math.round(body.perBookingTotalCents);
    const cleanerEarningsCents = Math.round(perBookingTotalCents * 0.6);

    // Build schedule object (for occurrence calculation)
    const scheduleForCalc: RecurringSchedule = {
      id: 'temp',
      customer_id: 'temp',
      service_type: String(body.service),
      frequency: scheduleFrequency,
      day_of_week: day_of_week === null ? undefined : day_of_week,
      day_of_month: day_of_month === null ? undefined : day_of_month,
      days_of_week: days_of_week === null ? undefined : days_of_week,
      preferred_time: String(body.preferred_time),
      bedrooms: Math.max(1, Number(body.bedrooms || 1)),
      bathrooms: Math.max(1, Number(body.bathrooms || 1)),
      extras: Array.isArray(body.extras) ? body.extras : [],
      extrasQuantities: body.extrasQuantities || {},
      notes: body.notes || undefined,
      address_line1: body.address.line1,
      address_suburb: body.address.suburb,
      address_city: body.address.city,
      cleaner_id: body.cleaner_id || undefined,
      is_active: true,
      start_date: body.start_date,
      end_date: undefined,
      last_generated_month: undefined,
      total_amount: perBookingTotalCents,
      cleaner_earnings: cleanerEarningsCents,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const occurrences = calculateBookingOccurrencesForRollingWindow(
      scheduleForCalc,
      startDateObj,
      isCustom ? rules : undefined,
      { days: 30 }
    );

    if (occurrences.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No recurring booking dates found for the next 30 days' },
        { status: 400 }
      );
    }

    const invoiceTotalCents = perBookingTotalCents * occurrences.length;

    // Verify payment with Paystack and check expected amount
    const verified = await verifyPaystack(body.paymentReference);
    const status = verified?.data?.status;
    const paidAmount = verified?.data?.amount;
    const currency = verified?.data?.currency;

    if (status !== 'success') {
      return NextResponse.json({ ok: false, error: 'Payment verification failed' }, { status: 400 });
    }
    if (currency && currency !== 'ZAR') {
      return NextResponse.json({ ok: false, error: `Unsupported currency: ${currency}` }, { status: 400 });
    }
    if (typeof paidAmount === 'number' && paidAmount !== invoiceTotalCents) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Payment amount mismatch',
          expectedAmountCents: invoiceTotalCents,
          paidAmountCents: paidAmount,
        },
        { status: 400 }
      );
    }

    const svc = createServiceClient();
    const normalizedEmail = body.email.toLowerCase().trim();

    // Idempotency: if invoice exists for this payment reference, return it
    const { data: existingInvoice } = await svc
      .from('recurring_invoices')
      .select('id, payment_reference, status')
      .eq('payment_reference', body.paymentReference)
      .maybeSingle();

    if (existingInvoice?.id) {
      return NextResponse.json({
        ok: true,
        bookingId: body.paymentReference,
        invoiceId: existingInvoice.id,
        message: 'Recurring checkout already processed',
      });
    }

    // Upsert customer by email
    const { data: existingCustomer, error: customerLookupError } = await svc
      .from('customers')
      .select('id, email')
      .ilike('email', normalizedEmail)
      .maybeSingle();

    if (customerLookupError) {
      return NextResponse.json({ ok: false, error: 'Failed to lookup customer' }, { status: 500 });
    }

    let customerId: string;
    if (existingCustomer?.id) {
      customerId = existingCustomer.id;

      const updateData: any = {
        first_name: body.firstName,
        last_name: body.lastName,
        phone: body.phone,
        address_line1: body.address.line1,
        address_suburb: body.address.suburb,
        address_city: body.address.city,
      };

      const auth = verified?.data?.authorization;
      if (auth?.authorization_code) {
        updateData.paystack_authorization_code = auth.authorization_code;
        updateData.paystack_authorization_email = normalizedEmail;
        updateData.paystack_authorization_reusable = auth.reusable ?? null;
        updateData.paystack_authorization_signature = auth.signature ?? null;
      }

      await svc.from('customers').update(updateData).eq('id', customerId);
    } else {
      const insertData: any = {
        email: normalizedEmail,
        first_name: body.firstName,
        last_name: body.lastName,
        phone: body.phone,
        address_line1: body.address.line1,
        address_suburb: body.address.suburb,
        address_city: body.address.city,
        total_bookings: 0,
      };

      const auth = verified?.data?.authorization;
      if (auth?.authorization_code) {
        insertData.paystack_authorization_code = auth.authorization_code;
        insertData.paystack_authorization_email = normalizedEmail;
        insertData.paystack_authorization_reusable = auth.reusable ?? null;
        insertData.paystack_authorization_signature = auth.signature ?? null;
      }

      const { data: createdCustomer, error: createCustomerError } = await svc
        .from('customers')
        .insert(insertData)
        .select('id')
        .single();

      if (createCustomerError || !createdCustomer?.id) {
        return NextResponse.json({ ok: false, error: 'Failed to create customer' }, { status: 500 });
      }
      customerId = createdCustomer.id;
    }

    // Create recurring schedule
    const scheduleInsert: any = {
      customer_id: customerId,
      service_type: body.service,
      frequency: scheduleFrequency,
      day_of_week,
      day_of_month,
      days_of_week,
      preferred_time: isCustom ? rules[0].preferred_time : body.preferred_time,
      bedrooms: Math.max(1, Number(body.bedrooms || 1)),
      bathrooms: Math.max(1, Number(body.bathrooms || 1)),
      extras: Array.isArray(body.extras) ? body.extras : [],
      notes: body.notes || null,
      address_line1: body.address.line1,
      address_suburb: body.address.suburb,
      address_city: body.address.city,
      cleaner_id: body.cleaner_id || null,
      is_active: true,
      start_date: body.start_date,
      end_date: null,
      total_amount: perBookingTotalCents,
      cleaner_earnings: cleanerEarningsCents,
    };

    const { data: schedule, error: scheduleError } = await svc
      .from('recurring_schedules')
      .insert(scheduleInsert)
      .select('*')
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ ok: false, error: 'Failed to create recurring schedule' }, { status: 500 });
    }

    // Create per-day rules for custom schedules
    if (isCustom) {
      const { error: rulesError } = await svc
        .from('recurring_schedule_rules')
        .insert(
          rules.map((r) => ({
            schedule_id: schedule.id,
            day_of_week: r.day_of_week,
            preferred_time: r.preferred_time,
          }))
        );

      if (rulesError) {
        // Best-effort rollback
        await svc.from('recurring_schedules').delete().eq('id', schedule.id);
        return NextResponse.json({ ok: false, error: 'Failed to create recurring schedule rules' }, { status: 500 });
      }
    }

    // Create invoice for rolling 30-day window
    const periodStart = formatDateYYYYMMDD(startDateObj);
    const endExclusive = new Date(startDateObj);
    endExclusive.setDate(endExclusive.getDate() + 30);
    const periodEndObj = new Date(endExclusive);
    periodEndObj.setDate(periodEndObj.getDate() - 1);
    const periodEnd = formatDateYYYYMMDD(periodEndObj);

    const { data: invoice, error: invoiceError } = await svc
      .from('recurring_invoices')
      .insert({
        customer_id: customerId,
        recurring_schedule_id: schedule.id,
        period_start: periodStart,
        period_end: periodEnd,
        month_year: null,
        total_amount: invoiceTotalCents,
        payment_reference: body.paymentReference,
        status: 'paid',
      })
      .select('*')
      .single();

    if (invoiceError || !invoice) {
      // Best-effort rollback
      await svc.from('recurring_schedules').delete().eq('id', schedule.id);
      return NextResponse.json({ ok: false, error: 'Failed to create invoice' }, { status: 500 });
    }

    // Create bookings (paid via invoice)
    const requiresTeam = body.service === 'Deep' || body.service === 'Move In/Out';
    const cleanerIdForInsert =
      requiresTeam || !body.cleaner_id || body.cleaner_id === 'manual' ? null : body.cleaner_id;

    const priceSnapshot = body.priceSnapshot || {
      service_type: body.service,
      bedrooms: Math.max(1, Number(body.bedrooms || 1)),
      bathrooms: Math.max(1, Number(body.bathrooms || 1)),
      extras: Array.isArray(body.extras) ? body.extras : [],
      extrasQuantities: body.extrasQuantities || {},
      notes: body.notes || null,
      total_amount_cents: perBookingTotalCents,
      snapshot_date: new Date().toISOString(),
    };

    const bookingsToCreate = occurrences.map((occ) => ({
      id: generateUniqueBookingId(),
      customer_id: customerId,
      cleaner_id: cleanerIdForInsert,
      booking_date: formatDateYYYYMMDD(occ.date),
      booking_time: occ.time,
      service_type: body.service,
      customer_name: `${body.firstName} ${body.lastName}`,
      customer_email: normalizedEmail,
      customer_phone: body.phone,
      address_line1: body.address!.line1,
      address_suburb: body.address!.suburb,
      address_city: body.address!.city,
      payment_reference: null, // payment tracked on invoice
      total_amount: perBookingTotalCents,
      requires_team: requiresTeam,
      price_snapshot: priceSnapshot,
      status: 'pending',
      recurring_schedule_id: schedule.id,
      invoice_id: invoice.id,
    }));

    const { error: bookingsError } = await svc.from('bookings').insert(bookingsToCreate);
    if (bookingsError) {
      // Best-effort rollback
      await svc.from('recurring_invoices').delete().eq('id', invoice.id);
      await svc.from('recurring_schedules').delete().eq('id', schedule.id);
      return NextResponse.json({ ok: false, error: 'Failed to create bookings' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      bookingId: body.paymentReference,
      invoiceId: invoice.id,
      scheduleId: schedule.id,
      bookingsCreated: bookingsToCreate.length,
      perBookingTotalCents,
      invoiceTotalCents,
    });
  } catch (error: any) {
    console.error('Error in recurring checkout:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

