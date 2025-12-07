import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET handler to fetch a specific recurring schedule
 * Requires authentication and verifies ownership
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scheduleId } = await params;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Fetch schedule and verify ownership
    const { data: schedule, error: scheduleError } = await supabase
      .from('recurring_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('customer_id', customer.id)
      .maybeSingle();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { ok: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      schedule,
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler to update a recurring schedule
 * Customers can only modify: frequency, preferred_time, address fields
 * Requires authentication and verifies ownership
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: scheduleId } = await params;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Verify schedule ownership
    const { data: scheduleCheck, error: checkError } = await supabase
      .from('recurring_schedules')
      .select('id, customer_id')
      .eq('id', scheduleId)
      .eq('customer_id', customer.id)
      .maybeSingle();

    if (checkError || !scheduleCheck) {
      return NextResponse.json(
        { ok: false, error: 'Schedule not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // Only allow customers to modify specific fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Allowed fields for customer modification
    if (body.frequency && ['weekly', 'bi-weekly', 'monthly'].includes(body.frequency)) {
      updateData.frequency = body.frequency;
    }
    if (body.preferred_time) {
      updateData.preferred_time = body.preferred_time;
    }
    if (body.address_line1) {
      updateData.address_line1 = body.address_line1;
    }
    if (body.address_suburb) {
      updateData.address_suburb = body.address_suburb;
    }
    if (body.address_city) {
      updateData.address_city = body.address_city;
    }
    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active;
    }
    if (body.end_date !== undefined) {
      updateData.end_date = body.end_date || null;
    }

    // Update schedule
    const { data: updatedSchedule, error: updateError } = await supabase
      .from('recurring_schedules')
      .update(updateData)
      .eq('id', scheduleId)
      .eq('customer_id', customer.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating schedule:', updateError);
      return NextResponse.json(
        { ok: false, error: 'Failed to update schedule', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      schedule: updatedSchedule,
      message: 'Schedule updated successfully',
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
