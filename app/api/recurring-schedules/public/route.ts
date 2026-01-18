import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

type WeekdayRule = {
  day_of_week: number; // 0=Sunday ... 6=Saturday
  preferred_time: string; // "HH:MM"
};

type CreatePublicRecurringScheduleRequest = {
  // Customer
  first_name: string;
  last_name: string;
  email: string;
  phone: string;

  // Address
  address_line1: string;
  address_suburb: string;
  address_city: string;

  // Service
  service_type: string;
  bedrooms: number;
  bathrooms: number;
  extras?: string[];
  notes?: string;

  // Recurrence
  frequency: 'custom-weekly' | 'custom-bi-weekly';
  start_date: string; // YYYY-MM-DD
  end_date?: string | null;

  // Rules (preferred)
  rules: WeekdayRule[];

  // Optional cleaner assignment (usually null/undefined for public flow)
  cleaner_id?: string | null;
};

function isValidIsoDate(date: string): boolean {
  // Minimal YYYY-MM-DD check (server will still validate on insert)
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isValidTime(time: string): boolean {
  // Accept "HH:MM" 24h format (00:00 - 23:59)
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CreatePublicRecurringScheduleRequest>;

    // Basic validation
    if (!body.email || !body.first_name || !body.last_name) {
      return NextResponse.json({ ok: false, error: 'Missing customer details' }, { status: 400 });
    }
    if (!body.phone) {
      return NextResponse.json({ ok: false, error: 'Missing phone number' }, { status: 400 });
    }
    if (!body.address_line1 || !body.address_suburb || !body.address_city) {
      return NextResponse.json({ ok: false, error: 'Missing address details' }, { status: 400 });
    }
    if (!body.service_type) {
      return NextResponse.json({ ok: false, error: 'Missing service type' }, { status: 400 });
    }
    if (!body.frequency || (body.frequency !== 'custom-weekly' && body.frequency !== 'custom-bi-weekly')) {
      return NextResponse.json({ ok: false, error: 'Invalid frequency' }, { status: 400 });
    }
    if (!body.start_date || !isValidIsoDate(body.start_date)) {
      return NextResponse.json({ ok: false, error: 'Invalid start_date' }, { status: 400 });
    }
    if (body.end_date && !isValidIsoDate(body.end_date)) {
      return NextResponse.json({ ok: false, error: 'Invalid end_date' }, { status: 400 });
    }
    if (!Array.isArray(body.rules) || body.rules.length === 0) {
      return NextResponse.json({ ok: false, error: 'At least one weekday rule is required' }, { status: 400 });
    }

    const normalizedEmail = body.email.toLowerCase().trim();

    // Normalize + validate rules
    const rules: WeekdayRule[] = body.rules
      .map((r) => ({
        day_of_week: Number(r.day_of_week),
        preferred_time: String(r.preferred_time),
      }))
      .filter((r) => Number.isInteger(r.day_of_week) && r.day_of_week >= 0 && r.day_of_week <= 6 && isValidTime(r.preferred_time));

    if (rules.length === 0) {
      return NextResponse.json({ ok: false, error: 'No valid weekday rules provided' }, { status: 400 });
    }

    // De-dupe by day_of_week (last one wins)
    const rulesByDay = new Map<number, WeekdayRule>();
    for (const r of rules) rulesByDay.set(r.day_of_week, r);
    const dedupedRules = Array.from(rulesByDay.values()).sort((a, b) => a.day_of_week - b.day_of_week);

    const supabase = createServiceClient();

    // Upsert customer by email (guest-friendly)
    const { data: existingCustomer, error: customerLookupError } = await supabase
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
      await supabase
        .from('customers')
        .update({
          first_name: body.first_name,
          last_name: body.last_name,
          phone: body.phone,
          address_line1: body.address_line1,
          address_suburb: body.address_suburb,
          address_city: body.address_city,
        })
        .eq('id', customerId);
    } else {
      const { data: createdCustomer, error: createCustomerError } = await supabase
        .from('customers')
        .insert({
          email: normalizedEmail,
          first_name: body.first_name,
          last_name: body.last_name,
          phone: body.phone,
          address_line1: body.address_line1,
          address_suburb: body.address_suburb,
          address_city: body.address_city,
          total_bookings: 0,
        })
        .select('id')
        .single();

      if (createCustomerError || !createdCustomer?.id) {
        return NextResponse.json({ ok: false, error: 'Failed to create customer' }, { status: 500 });
      }

      customerId = createdCustomer.id;
    }

    const daysOfWeek = dedupedRules.map((r) => r.day_of_week);
    const preferredTimeForSchedule = dedupedRules[0]?.preferred_time;

    // Create parent schedule (keep days_of_week populated for existing constraint/back-compat)
    const { data: schedule, error: scheduleError } = await supabase
      .from('recurring_schedules')
      .insert({
        customer_id: customerId,
        service_type: body.service_type,
        frequency: body.frequency,
        day_of_week: null,
        day_of_month: null,
        days_of_week: daysOfWeek,
        preferred_time: preferredTimeForSchedule,
        bedrooms: Math.max(1, Number(body.bedrooms || 1)),
        bathrooms: Math.max(1, Number(body.bathrooms || 1)),
        extras: Array.isArray(body.extras) ? body.extras : [],
        notes: body.notes || null,
        address_line1: body.address_line1,
        address_suburb: body.address_suburb,
        address_city: body.address_city,
        cleaner_id: body.cleaner_id || null,
        is_active: true,
        start_date: body.start_date,
        end_date: body.end_date || null,
      })
      .select('*')
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json({ ok: false, error: 'Failed to create recurring schedule' }, { status: 500 });
    }

    // Create per-day rules
    const { data: insertedRules, error: rulesError } = await supabase
      .from('recurring_schedule_rules')
      .insert(
        dedupedRules.map((r) => ({
          schedule_id: schedule.id,
          day_of_week: r.day_of_week,
          preferred_time: r.preferred_time,
        }))
      )
      .select('*');

    if (rulesError) {
      // Best-effort rollback (schedule exists but rules missing) - surface error clearly
      return NextResponse.json(
        { ok: false, error: 'Schedule created but failed to create weekday rules', schedule_id: schedule.id },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      schedule,
      rules: insertedRules || [],
    });
  } catch (error: any) {
    console.error('Error creating public recurring schedule:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

