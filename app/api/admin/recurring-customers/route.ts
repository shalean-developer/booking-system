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

    // Fetch all active recurring schedules first (without joins to avoid syntax issues)
    const { data: allSchedules, error: schedulesError } = await supabase
      .from('recurring_schedules')
      .select('id, customer_id, frequency, start_date, is_active')
      .eq('is_active', true)
      .order('start_date', { ascending: false });

    if (schedulesError) {
      console.error('Error fetching recurring schedules:', schedulesError);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch recurring schedules: ${schedulesError.message}` },
        { status: 500 }
      );
    }

    if (!allSchedules || allSchedules.length === 0) {
      return NextResponse.json({
        ok: true,
        customers: [],
        total: 0,
        totalPages: 0,
      });
    }

    // Extract unique customer IDs
    const customerIds = [...new Set(allSchedules.map((s: any) => s.customer_id).filter(Boolean))];

    if (customerIds.length === 0) {
      return NextResponse.json({
        ok: true,
        customers: [],
        total: 0,
        totalPages: 0,
      });
    }

    // Fetch customers separately
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, phone')
      .in('id', customerIds);

    if (customersError) {
      console.error('Error fetching customers:', customersError);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch customers: ${customersError.message}` },
        { status: 500 }
      );
    }

    // Create customers map for quick lookup
    const customersMap = new Map();
    customersData?.forEach((customer: any) => {
      customersMap.set(customer.id, customer);
    });

    // First, group schedules by customer and apply search filter
    const scheduleGroups = new Map<string, any[]>();
    
    for (const schedule of allSchedules) {
      const customerId = schedule.customer_id;
      if (!customerId) continue;

      const customer = customersMap.get(customerId);
      if (!customer) continue;

      const name = customer.name || 
                   `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
                   'Unknown Customer';
      
      // Apply search filter if provided
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesSearch = 
          name.toLowerCase().includes(searchLower) ||
          customer.email?.toLowerCase().includes(searchLower) ||
          customer.phone?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) {
          continue; // Skip this schedule if it doesn't match search
        }
      }
      
      if (!scheduleGroups.has(customerId)) {
        scheduleGroups.set(customerId, []);
      }
      scheduleGroups.get(customerId)!.push(schedule);
    }

    // Fetch booking counts for all customers at once
    const { data: bookingCounts, error: bookingCountsError } = await supabase
      .from('bookings')
      .select('customer_id')
      .in('customer_id', Array.from(scheduleGroups.keys()));

    if (bookingCountsError) {
      console.error('Error fetching booking counts:', bookingCountsError);
      // Continue without booking counts rather than failing
    }

    // Count bookings per customer
    const bookingCountMap = new Map<string, number>();
    bookingCounts?.forEach((booking: any) => {
      const customerId = booking.customer_id;
      bookingCountMap.set(customerId, (bookingCountMap.get(customerId) || 0) + 1);
    });

    // Build customer map with aggregated data
    const customerMap = new Map<string, any>();
    
    for (const [customerId, schedules] of scheduleGroups.entries()) {
      const customer = customersMap.get(customerId);
      if (!customer) continue;

      const name = customer.name || 
                   `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
                   'Unknown Customer';

      // Find earliest start date
      const startDates = schedules.map((s: any) => new Date(s.start_date));
      const earliestStartDate = new Date(Math.min(...startDates.map((d: Date) => d.getTime())));

      customerMap.set(customerId, {
        id: customerId,
        name,
        email: customer.email || '',
        phone: customer.phone || '',
        frequency: schedules[0].frequency, // Use first schedule's frequency
        schedulesCount: schedules.length,
        totalBookings: bookingCountMap.get(customerId) || 0,
        startDate: earliestStartDate.toISOString(),
      });
    }

    // Convert map to array and sort
    let customers = Array.from(customerMap.values());
    customers.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

    // Get total count (unique customers)
    const count = customers.length;

    // Apply pagination
    const paginatedCustomers = customers.slice(offset, offset + limit);
    const totalPages = Math.ceil(count / limit);

    return NextResponse.json({
      ok: true,
      customers: paginatedCustomers,
      total: count,
      totalPages,
    });
  } catch (error: any) {
    console.error('Error in recurring customers API:', {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      name: error.name,
    });
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
