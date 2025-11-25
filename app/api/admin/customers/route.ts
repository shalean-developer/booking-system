import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      console.error('[Customers API] Admin check failed - returning 403');
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: customers, error } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch customers' },
        { status: 500 }
      );
    }

    // Get recurring schedule counts for customers
    const customerIds = (customers || []).map((c: any) => c.id);
    const recurringScheduleCounts = new Map<string, number>();

    if (customerIds.length > 0) {
      const { data: recurringSchedules } = await supabase
        .from('recurring_schedules')
        .select('customer_id')
        .in('customer_id', customerIds)
        .eq('is_active', true);

      // Count recurring schedules per customer
      recurringSchedules?.forEach((schedule: any) => {
        const customerId = schedule.customer_id;
        recurringScheduleCounts.set(customerId, (recurringScheduleCounts.get(customerId) || 0) + 1);
      });
    }

    // Add recurring schedule count to each customer
    const customersWithRecurring = (customers || []).map((customer: any) => ({
      ...customer,
      recurring_schedules_count: recurringScheduleCounts.get(customer.id) || 0,
      has_recurring: (recurringScheduleCounts.get(customer.id) || 0) > 0,
    }));

    // Get total count
    let countQuery = supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      ok: true,
      customers: customersWithRecurring,
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error('Error in customers GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
















