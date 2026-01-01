import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/scheduling-limits
 * Fetch current scheduling limits for all services
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const { data: limits, error } = await supabase
      .from('service_scheduling_limits')
      .select('*')
      .order('service_type');

    if (error) {
      console.error('Error fetching scheduling limits:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch scheduling limits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      limits: limits || [],
    });
  } catch (error: any) {
    console.error('Error in scheduling-limits GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/scheduling-limits
 * Update scheduling limits for a service type
 * Body: { service_type, max_bookings_per_date?, surge_pricing_enabled?, surge_threshold?, surge_percentage? }
 */
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { service_type, max_bookings_per_date, uses_teams, surge_pricing_enabled, surge_threshold, surge_percentage } = body;

    if (!service_type) {
      return NextResponse.json(
        { ok: false, error: 'service_type is required' },
        { status: 400 }
      );
    }

    const validServiceTypes = ['Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet'];
    if (!validServiceTypes.includes(service_type)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid service type' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (max_bookings_per_date !== undefined) {
      updateData.max_bookings_per_date = max_bookings_per_date;
    }
    if (uses_teams !== undefined) {
      updateData.uses_teams = uses_teams;
    }
    if (surge_pricing_enabled !== undefined) {
      updateData.surge_pricing_enabled = surge_pricing_enabled;
    }
    if (surge_threshold !== undefined) {
      updateData.surge_threshold = surge_threshold;
    }
    if (surge_percentage !== undefined) {
      updateData.surge_percentage = surge_percentage;
    }

    // Update the limit
    const { data, error } = await supabase
      .from('service_scheduling_limits')
      .update(updateData)
      .eq('service_type', service_type)
      .select()
      .single();

    if (error) {
      console.error('Error updating scheduling limits:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update scheduling limits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      limit: data,
    });
  } catch (error: any) {
    console.error('Error in scheduling-limits POST API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

