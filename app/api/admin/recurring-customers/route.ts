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
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('recurring_schedules')
      .select(`
        id,
        customer_id,
        frequency,
        start_date,
        is_active,
        customers:customer_id (
          id,
          name,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('is_active', true)
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: schedules, error } = await query;

    if (error) {
      console.error('Error fetching recurring customers:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch recurring customers' },
        { status: 500 }
      );
    }

    const { count } = await supabase
      .from('recurring_schedules')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const customerMap = new Map();
    
    for (const schedule of schedules || []) {
      const customerId = schedule.customer_id;
      if (!customerMap.has(customerId)) {
        const customers = schedule.customers;
        const customer = Array.isArray(customers) ? customers[0] : customers;
        const name = customer?.name || 
                     `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim() ||
                     'Unknown Customer';
        
        const { count: bookingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customerId);

        customerMap.set(customerId, {
          id: customerId,
          name,
          email: customer?.email || '',
          phone: customer?.phone || '',
          frequency: schedule.frequency,
          schedulesCount: 1,
          totalBookings: bookingCount || 0,
          startDate: schedule.start_date,
        });
      } else {
        const existing = customerMap.get(customerId);
        existing.schedulesCount += 1;
      }
    }

    let customers = Array.from(customerMap.values());

    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter((c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.email.toLowerCase().includes(searchLower) ||
        c.phone?.toLowerCase().includes(searchLower)
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      ok: true,
      customers,
      total: count || 0,
      totalPages,
    });
  } catch (error) {
    console.error('Error in recurring customers API:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

