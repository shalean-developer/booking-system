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
    const recurringFilter = searchParams.get('recurring'); // 'recurring', 'non-recurring', or null
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get customer IDs with recurring schedules (if filter is needed)
    let customerIdsWithRecurring: string[] = [];
    if (recurringFilter === 'recurring' || recurringFilter === 'non-recurring') {
      const { data: recurringSchedules } = await supabase
        .from('recurring_schedules')
        .select('customer_id')
        .eq('is_active', true);
      
      customerIdsWithRecurring = [
        ...new Set(
          (recurringSchedules || []).map((s: any) => s.customer_id).filter(Boolean)
        )
      ];
    }

    let query = supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply recurring filter
    if (recurringFilter === 'recurring') {
      if (customerIdsWithRecurring.length > 0) {
        query = query.in('id', customerIdsWithRecurring);
      } else {
        // No customers with recurring schedules, return empty
        return NextResponse.json({
          ok: true,
          customers: [],
          total: 0,
          page: 1,
          pageSize: limit,
          totalPages: 0,
        });
      }
    } else if (recurringFilter === 'non-recurring') {
      if (customerIdsWithRecurring.length > 0) {
        // Exclude each recurring customer id
        customerIdsWithRecurring.forEach((id) => {
          query = query.neq('id', id);
        });
      } else {
        // No customers with recurring schedules, so all are non-recurring -> no filter needed
      }
    }

    // Apply pagination after all filters
    query = query.range(offset, offset + limit - 1);

    let { data: customers, error } = await query;

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
    const bookingCounts = new Map<string, number>();
    const bookingTotals = new Map<string, number>(); // cents

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

      // Aggregate bookings count and total_amount per customer
      const { data: bookingsAgg, error: bookingsError } = await supabase
        .from('bookings')
        .select('customer_id, total_amount')
        .in('customer_id', customerIds);

      if (!bookingsError && bookingsAgg) {
        bookingsAgg.forEach((b: any) => {
          const cid = b.customer_id;
          const total = Number(b.total_amount) || 0;
          bookingCounts.set(cid, (bookingCounts.get(cid) || 0) + 1);
          bookingTotals.set(cid, (bookingTotals.get(cid) || 0) + total);
        });
      } else if (bookingsError) {
        console.error('Error aggregating bookings for customers:', bookingsError);
      }
    }

    // Add recurring schedule count to each customer
    const customersWithRecurring = (customers || []).map((customer: any) => ({
      ...customer,
      recurring_schedules_count: recurringScheduleCounts.get(customer.id) || 0,
      has_recurring: (recurringScheduleCounts.get(customer.id) || 0) > 0,
      total_bookings: bookingCounts.get(customer.id) || 0,
      total_spent: bookingTotals.get(customer.id) || 0, // cents
    }));

    // Get total count with same filters
    let count = 0;
    
    if (recurringFilter === 'recurring') {
      // Count only customers with recurring schedules
      if (customerIdsWithRecurring.length > 0) {
        let countQuery = supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })
          .in('id', customerIdsWithRecurring);
        
        if (search) {
          countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }
        
        const { count: recurringCount } = await countQuery;
        count = recurringCount || 0;
      } else {
        count = 0;
      }
    } else if (recurringFilter === 'non-recurring') {
      // Count customers that are not in the recurring list
      let countQuery = supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      if (search) {
        countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      
      if (customerIdsWithRecurring.length > 0) {
        customerIdsWithRecurring.forEach((id) => {
          countQuery = countQuery.neq('id', id);
        });
      }
      
      const { count: nonRecurringCount } = await countQuery;
      count = nonRecurringCount || 0;
    } else {
      // No recurring filter, count all
      let countQuery = supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      if (search) {
        countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { count: totalCount } = await countQuery;
      count = totalCount || 0;
    }

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
















