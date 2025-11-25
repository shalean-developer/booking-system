import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const customerId = searchParams.get('customer');
    const status = searchParams.get('status');

    // First, fetch schedules without joins to avoid join syntax issues
    let query = supabase
      .from('recurring_schedules')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data: schedules, error } = await query;

    if (error) {
      console.error('Error fetching recurring schedules:', error);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch recurring schedules: ${error.message}` },
        { status: 500 }
      );
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        ok: true,
        schedules: [],
        total: 0,
        totalPages: 0,
      });
    }

    // Fetch customer and cleaner data separately
    const customerIds = [...new Set(schedules.map((s: any) => s.customer_id).filter(Boolean))];
    const scheduleIds = schedules.map((s: any) => s.id);
    
    // Get cleaner IDs from schedules
    const scheduleCleanerIds = [...new Set(
      schedules
        .map((s: any) => s.cleaner_id)
        .filter((id: any) => id && id !== 'manual' && id !== null && id !== undefined)
    )];
    
    // Also fetch cleaners from bookings generated from these schedules
    // Create a map of schedule_id -> cleaner_id from bookings (using most recent booking)
    const scheduleToCleanerMap = new Map<string, string>();
    let bookingCleanerIds: string[] = [];
    
    if (scheduleIds.length > 0) {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('cleaner_id, recurring_schedule_id, booking_date')
        .in('recurring_schedule_id', scheduleIds)
        .order('booking_date', { ascending: false });
      
      if (bookingsError) {
        console.error('Error fetching bookings for cleaner lookup:', bookingsError);
      }
      
      // Debug: log what we found
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Recurring Schedules] Found ${bookings?.length || 0} bookings for ${scheduleIds.length} schedules`);
        bookings?.forEach((b: any) => {
          console.log(`  Schedule ${b.recurring_schedule_id}: cleaner_id = ${b.cleaner_id}`);
        });
      }
      
      // Use the most recent booking's cleaner for each schedule
      (bookings || []).forEach((booking: any) => {
        if (booking.recurring_schedule_id && 
            booking.cleaner_id && 
            booking.cleaner_id !== 'manual' &&
            booking.cleaner_id !== null &&
            !scheduleToCleanerMap.has(booking.recurring_schedule_id)) {
          scheduleToCleanerMap.set(booking.recurring_schedule_id, booking.cleaner_id);
          bookingCleanerIds.push(booking.cleaner_id);
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Recurring Schedules] Created scheduleToCleanerMap:`, Array.from(scheduleToCleanerMap.entries()));
      }
    }
    
    // Combine both sets of cleaner IDs
    const cleanerIds = [...new Set([...scheduleCleanerIds, ...bookingCleanerIds])];

    const customersMap = new Map();
    const cleanersMap = new Map();

    if (customerIds.length > 0) {
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email')
        .in('id', customerIds);
      
      if (customersError) {
        console.error('Error fetching customers:', customersError);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Recurring Schedules] Fetching ${customerIds.length} customers:`, customerIds);
        console.log(`[Recurring Schedules] Found ${customers?.length || 0} customers:`, customers?.map((c: any) => ({ id: c.id, first_name: c.first_name, last_name: c.last_name, email: c.email })));
      }
      
      customers?.forEach((customer: any) => {
        customersMap.set(customer.id, customer);
      });
    }

    if (cleanerIds.length > 0) {
      const { data: cleaners, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, name')
        .in('id', cleanerIds);
      
      if (cleanersError) {
        console.error('Error fetching cleaners:', cleanersError);
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Recurring Schedules] Fetching ${cleanerIds.length} cleaners:`, cleanerIds);
        console.log(`[Recurring Schedules] Found ${cleaners?.length || 0} cleaners:`, cleaners?.map((c: any) => ({ id: c.id, name: c.name })));
      }
      
      cleaners?.forEach((cleaner: any) => {
        cleanersMap.set(cleaner.id, cleaner);
      });
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Recurring Schedules] No cleaner IDs to fetch');
        console.log('[Recurring Schedules] Schedule cleaner IDs:', scheduleCleanerIds);
        console.log('[Recurring Schedules] Booking cleaner IDs:', bookingCleanerIds);
      }
    }

    let countQuery = supabase
      .from('recurring_schedules')
      .select('*', { count: 'exact', head: true });

    if (customerId) {
      countQuery = countQuery.eq('customer_id', customerId);
    }

    if (status === 'active') {
      countQuery = countQuery.eq('is_active', true);
    } else if (status === 'inactive') {
      countQuery = countQuery.eq('is_active', false);
    }

    const { count } = await countQuery;

    const formattedSchedules = schedules.map((schedule: any) => {
      const customer = customersMap.get(schedule.customer_id);
      let customerName = 'Unknown Customer';
      let customerEmail = '';
      
      if (customer) {
        // Build name from first_name and last_name
        const firstName = customer.first_name || '';
        const lastName = customer.last_name || '';
        customerName = `${firstName} ${lastName}`.trim() || 'Unknown Customer';
        customerEmail = customer.email || '';
      }
      
      if (process.env.NODE_ENV === 'development' && !customer) {
        console.log(`[Recurring Schedules] Customer ID ${schedule.customer_id} not found in customersMap. Schedule ID: ${schedule.id}`);
      }
      
      // Get cleaner - first check schedule cleaner_id, then check bookings
      let cleanerId = schedule.cleaner_id;
      const fromSchedule = !!cleanerId && cleanerId !== 'manual';
      
      if (!cleanerId || cleanerId === 'manual') {
        // Fallback to cleaner from bookings generated from this schedule
        cleanerId = scheduleToCleanerMap.get(schedule.id) || null;
      }
      
      const cleaner = cleanerId ? cleanersMap.get(cleanerId) : null;
      const cleanerName = cleaner?.name || null;
      
      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Recurring Schedules] Schedule ${schedule.id}:`, {
          scheduleCleanerId: schedule.cleaner_id,
          fromSchedule,
          bookingCleanerId: scheduleToCleanerMap.get(schedule.id),
          finalCleanerId: cleanerId,
          cleanerFound: !!cleaner,
          cleanerName,
        });
      }

      return {
        id: schedule.id,
        customer_id: schedule.customer_id,
        customer_name: customerName,
        customer_email: customerEmail,
        service_type: schedule.service_type,
        frequency: schedule.frequency,
        day_of_week: schedule.day_of_week,
        day_of_month: schedule.day_of_month,
        days_of_week: schedule.days_of_week,
        preferred_time: schedule.preferred_time,
        bedrooms: schedule.bedrooms,
        bathrooms: schedule.bathrooms,
        extras: schedule.extras || [],
        address_line1: schedule.address_line1,
        address_suburb: schedule.address_suburb,
        address_city: schedule.address_city,
        cleaner_id: schedule.cleaner_id,
        cleaner_name: cleanerName,
        is_active: schedule.is_active,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        last_generated_month: schedule.last_generated_month,
        created_at: schedule.created_at,
        updated_at: schedule.updated_at,
      };
    });

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      ok: true,
      schedules: formattedSchedules,
      total: count || 0,
      totalPages,
    });
  } catch (error: any) {
    console.error('Error in recurring schedules API:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = await createClient();

    const {
      customer_id,
      service_type,
      bedrooms,
      bathrooms,
      extras,
      frequency,
      day_of_week,
      day_of_month,
      days_of_week,
      preferred_time,
      address_line1,
      address_suburb,
      address_city,
      cleaner_id,
      is_active,
      start_date,
      end_date,
      notes,
    } = body;

    // Validate required fields
    if (!customer_id || !service_type || !frequency || !preferred_time || !start_date) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate frequency-specific fields
    if ((frequency === 'weekly' || frequency === 'bi-weekly') && day_of_week === undefined) {
      return NextResponse.json(
        { ok: false, error: 'Day of week is required for weekly/bi-weekly schedules' },
        { status: 400 }
      );
    }

    if (frequency === 'monthly' && day_of_month === undefined) {
      return NextResponse.json(
        { ok: false, error: 'Day of month is required for monthly schedules' },
        { status: 400 }
      );
    }

    if ((frequency === 'custom-weekly' || frequency === 'custom-bi-weekly') && (!days_of_week || days_of_week.length === 0)) {
      return NextResponse.json(
        { ok: false, error: 'At least one day must be selected for custom frequency' },
        { status: 400 }
      );
    }

    // Build insert data
    const insertData: any = {
      customer_id,
      service_type,
      bedrooms: bedrooms || 1,
      bathrooms: bathrooms || 1,
      extras: extras || [],
      frequency,
      preferred_time,
      address_line1,
      address_suburb,
      address_city,
      cleaner_id: cleaner_id === 'unassigned' || cleaner_id === '' ? null : cleaner_id,
      is_active: is_active !== false,
      start_date,
      end_date: end_date || null,
      notes: notes || null,
    };

    // Add frequency-specific fields
    if (frequency === 'weekly' || frequency === 'bi-weekly') {
      insertData.day_of_week = day_of_week;
      insertData.day_of_month = null;
      insertData.days_of_week = null;
    } else if (frequency === 'monthly') {
      insertData.day_of_month = day_of_month;
      insertData.day_of_week = null;
      insertData.days_of_week = null;
    } else if (frequency === 'custom-weekly' || frequency === 'custom-bi-weekly') {
      insertData.days_of_week = days_of_week;
      insertData.day_of_week = null;
      insertData.day_of_month = null;
    }

    const { data, error } = await supabase
      .from('recurring_schedules')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating recurring schedule:', error);
      return NextResponse.json(
        { ok: false, error: `Failed to create recurring schedule: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      schedule: data,
    });
  } catch (error: any) {
    console.error('Error in recurring schedules POST API:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

