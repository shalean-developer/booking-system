import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';
import { RecurringScheduleWithCustomer } from '@/types/recurring';

export const dynamic = 'force-dynamic';

/**
 * Admin endpoint to manage recurring schedules
 * GET: List all recurring schedules
 * PUT: Update a recurring schedule
 * DELETE: Delete a recurring schedule
 */
export async function GET(request: NextRequest) {
  console.log('=== ADMIN RECURRING SCHEDULES GET ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const url = new URL(request.url);
    
    // Get query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const active = url.searchParams.get('active');
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('recurring_schedules')
      .select(`
        *,
        customer:customers!inner (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        cleaner:cleaners (
          id,
          name
        )
      `, { count: 'exact' });
    
    // Apply filters
    if (active !== null) {
      query = query.eq('is_active', active === 'true');
    }
    
    if (search) {
      query = query.or(`service_type.ilike.%${search}%,notes.ilike.%${search}%`);
    }
    
    // Apply pagination and sorting
    const { data: schedules, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    console.log(`✅ Fetched ${schedules?.length || 0} recurring schedules`);
    
    return NextResponse.json({
      ok: true,
      schedules: schedules || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
    
  } catch (error) {
    console.error('=== ADMIN RECURRING SCHEDULES GET ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch recurring schedules' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  console.log('=== ADMIN RECURRING SCHEDULES PUT ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data: schedule, error } = await supabase
      .from('recurring_schedules')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers!inner (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        cleaner:cleaners (
          id,
          name
        )
      `)
      .single();
    
    if (error) throw error;
    
    console.log('✅ Recurring schedule updated:', id);
    
    return NextResponse.json({
      ok: true,
      schedule,
      message: 'Recurring schedule updated successfully',
    });
    
  } catch (error) {
    console.error('=== ADMIN RECURRING SCHEDULES PUT ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update recurring schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  console.log('=== ADMIN RECURRING SCHEDULES DELETE ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check if there are future bookings for this schedule
    const { data: futureBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, booking_date')
      .eq('recurring_schedule_id', id)
      .gte('booking_date', new Date().toISOString().split('T')[0]);
    
    if (bookingsError) throw bookingsError;
    
    // Delete the schedule (this will cascade to bookings due to foreign key)
    const { error } = await supabase
      .from('recurring_schedules')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('✅ Recurring schedule deleted:', id);
    
    return NextResponse.json({
      ok: true,
      message: `Recurring schedule deleted successfully${futureBookings?.length ? `. ${futureBookings.length} future bookings were also cancelled.` : ''}`,
    });
    
  } catch (error) {
    console.error('=== ADMIN RECURRING SCHEDULES DELETE ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete recurring schedule' },
      { status: 500 }
    );
  }
}
