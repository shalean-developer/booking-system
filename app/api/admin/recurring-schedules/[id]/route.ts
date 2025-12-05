import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Fetch the recurring schedule
    const { data: schedule, error } = await supabase
      .from('recurring_schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !schedule) {
      return NextResponse.json(
        { ok: false, error: 'Recurring schedule not found' },
        { status: 404 }
      );
    }

    // Fetch customer details
    let customerName = 'Unknown Customer';
    let customerEmail = '';
    if (schedule.customer_id) {
      const { data: customer } = await supabase
        .from('customers')
        .select('first_name, last_name, email')
        .eq('id', schedule.customer_id)
        .maybeSingle();
      
      if (customer) {
        customerName = customer.first_name && customer.last_name
          ? `${customer.first_name} ${customer.last_name}`.trim()
          : customer.first_name || customer.last_name || 'Unknown Customer';
        customerEmail = customer.email || '';
      }
    }

    // Fetch cleaner name
    let cleanerName = null;
    let cleanerId = schedule.cleaner_id;
    
    // First check schedule cleaner_id
    if (cleanerId && cleanerId !== 'manual') {
      const { data: cleaner } = await supabase
        .from('cleaners')
        .select('id, name')
        .eq('id', cleanerId)
        .maybeSingle();
      cleanerName = cleaner?.name || null;
    } else {
      // Fallback to cleaner from most recent booking generated from this schedule
      const { data: booking } = await supabase
        .from('bookings')
        .select('cleaner_id')
        .eq('recurring_schedule_id', id)
        .not('cleaner_id', 'is', null)
        .neq('cleaner_id', 'manual')
        .order('booking_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (booking?.cleaner_id) {
        cleanerId = booking.cleaner_id;
        const { data: cleaner } = await supabase
          .from('cleaners')
          .select('id, name')
          .eq('id', cleanerId)
          .maybeSingle();
        cleanerName = cleaner?.name || null;
      }
    }

    const formattedSchedule = {
      ...schedule,
      customer_name: customerName,
      customer_email: customerEmail,
      cleaner_name: cleanerName,
      cleaner_id: cleanerId || null,
    };

    return NextResponse.json({
      ok: true,
      schedule: formattedSchedule,
    });
  } catch (error: any) {
    console.error('Error fetching recurring schedule:', error);
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.service_type) updateData.service_type = body.service_type;
    if (body.bedrooms !== undefined) updateData.bedrooms = body.bedrooms;
    if (body.bathrooms !== undefined) updateData.bathrooms = body.bathrooms;
    if (body.frequency) updateData.frequency = body.frequency;
    if (body.day_of_week !== undefined) updateData.day_of_week = body.day_of_week;
    if (body.day_of_month !== undefined) updateData.day_of_month = body.day_of_month;
    if (body.days_of_week !== undefined) updateData.days_of_week = body.days_of_week;
    if (body.preferred_time) updateData.preferred_time = body.preferred_time;
    if (body.extras !== undefined) updateData.extras = body.extras;
    if (body.address_line1) updateData.address_line1 = body.address_line1;
    if (body.address_suburb) updateData.address_suburb = body.address_suburb;
    if (body.address_city) updateData.address_city = body.address_city;
    if (body.cleaner_id !== undefined) {
      updateData.cleaner_id = body.cleaner_id === 'manual' || body.cleaner_id === '' ? null : body.cleaner_id;
    }
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.start_date) updateData.start_date = body.start_date;
    if (body.end_date !== undefined) updateData.end_date = body.end_date || null;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.total_amount !== undefined) updateData.total_amount = body.total_amount;
    if (body.cleaner_earnings !== undefined) updateData.cleaner_earnings = body.cleaner_earnings;

    const { data, error } = await supabase
      .from('recurring_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating recurring schedule:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update recurring schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      schedule: data,
    });
  } catch (error: any) {
    console.error('Error updating recurring schedule:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Check if schedule exists
    const { data: schedule, error: fetchError } = await supabase
      .from('recurring_schedules')
      .select('id, customer_id')
      .eq('id', id)
      .single();

    if (fetchError || !schedule) {
      return NextResponse.json(
        { ok: false, error: 'Recurring schedule not found' },
        { status: 404 }
      );
    }

    // Check if there are any bookings associated with this schedule
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .eq('recurring_schedule_id', id)
      .limit(1);

    if (bookingsError) {
      console.error('Error checking bookings:', bookingsError);
      return NextResponse.json(
        { ok: false, error: 'Failed to check associated bookings' },
        { status: 500 }
      );
    }

    const hasBookings = bookings && bookings.length > 0;

    // Delete the recurring schedule
    const { error: deleteError } = await supabase
      .from('recurring_schedules')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting recurring schedule:', deleteError);
      return NextResponse.json(
        { ok: false, error: 'Failed to delete recurring schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Recurring schedule deleted successfully',
      hadBookings: hasBookings,
    });
  } catch (error: any) {
    console.error('Error deleting recurring schedule:', error);
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

