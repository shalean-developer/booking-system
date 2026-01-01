import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Check date availability for a service type
 * GET /api/bookings/availability?service_type=Standard&date=2025-01-15
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('service_type');
    const date = searchParams.get('date');

    if (!serviceType || !date) {
      return NextResponse.json(
        { ok: false, error: 'service_type and date are required' },
        { status: 400 }
      );
    }

    // Validate service type
    const validServiceTypes = ['Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet'];
    if (!validServiceTypes.includes(serviceType)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid service type' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Create service client for database operations
    const supabase = createServiceClient();

    // Call the database function to check availability
    const { data, error } = await supabase.rpc('check_date_availability', {
      p_service_type: serviceType,
      p_booking_date: date,
    });

    if (error) {
      console.error('Error checking availability:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to check availability' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No availability data returned' },
        { status: 500 }
      );
    }

    const availability = data[0];

    return NextResponse.json({
      ok: true,
      available: availability.available,
      slots_remaining: availability.slots_remaining,
      current_bookings: availability.current_bookings,
      max_bookings: availability.max_bookings,
      surge_pricing_active: availability.surge_pricing_active || false,
      surge_percentage: availability.surge_percentage || null,
      uses_teams: availability.uses_teams || false,
      available_teams: availability.available_teams || [],
    });
  } catch (error: any) {
    console.error('Error in availability check API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

