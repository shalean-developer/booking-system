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

    let query = supabase
      .from('recurring_schedules')
      .select(`
        *,
        customers:customer_id (
          id,
          name,
          first_name,
          last_name,
          email
        ),
        cleaners:cleaner_id (
          id,
          name,
          first_name,
          last_name
        )
      `)
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
        { ok: false, error: 'Failed to fetch recurring schedules' },
        { status: 500 }
      );
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

    const formattedSchedules = (schedules || []).map((schedule: any) => {
      const customers = schedule.customers;
      const customer = Array.isArray(customers) ? customers[0] : customers;
      const customerName = customer?.name || 
                          `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() ||
                          'Unknown Customer';
      
      const cleaners = schedule.cleaners;
      const cleaner = Array.isArray(cleaners) ? cleaners[0] : cleaners;
      const cleanerName = cleaner?.name ||
                          `${cleaner?.first_name || ''} ${cleaner?.last_name || ''}`.trim() ||
                          null;

      return {
        id: schedule.id,
        customer_id: schedule.customer_id,
        customer_name: customerName,
        customer_email: customer?.email || '',
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
  } catch (error) {
    console.error('Error in recurring schedules API:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

