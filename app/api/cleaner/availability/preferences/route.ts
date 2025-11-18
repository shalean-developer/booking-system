import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * GET /api/cleaner/availability/preferences
 * Fetch cleaner availability preferences
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const cleanerId = cleanerIdToUuid(session.id);

    const { data: preferences, error } = await supabase
      .from('cleaner_availability_preferences')
      .select('*')
      .eq('cleaner_id', cleanerId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching availability preferences:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      preferences: preferences || null,
    });
  } catch (error) {
    console.error('Error in GET /api/cleaner/availability/preferences:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cleaner/availability/preferences
 * Update cleaner availability preferences
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();
    const cleanerId = cleanerIdToUuid(session.id);
    const body = await request.json();

    // Validate and prepare update data
    const updateData: any = {
      cleaner_id: cleanerId,
      updated_at: new Date().toISOString(),
    };

    // Time slot preferences
    if (body.preferred_start_time !== undefined) {
      updateData.preferred_start_time = body.preferred_start_time || null;
    }
    if (body.preferred_end_time !== undefined) {
      updateData.preferred_end_time = body.preferred_end_time || null;
    }
    if (body.preferred_days_of_week !== undefined) {
      updateData.preferred_days_of_week = Array.isArray(body.preferred_days_of_week)
        ? body.preferred_days_of_week
        : [];
    }

    // Blocked dates/times
    if (body.blocked_dates !== undefined) {
      updateData.blocked_dates = Array.isArray(body.blocked_dates)
        ? body.blocked_dates
        : [];
    }
    if (body.blocked_time_slots !== undefined) {
      updateData.blocked_time_slots = Array.isArray(body.blocked_time_slots)
        ? body.blocked_time_slots
        : [];
    }

    // Availability template
    if (body.availability_template !== undefined) {
      updateData.availability_template = body.availability_template || null;
    }

    // Auto-decline settings
    if (body.auto_decline_outside_availability !== undefined) {
      updateData.auto_decline_outside_availability = Boolean(body.auto_decline_outside_availability);
    }
    if (body.auto_decline_below_min_value !== undefined) {
      updateData.auto_decline_below_min_value = Boolean(body.auto_decline_below_min_value);
    }
    if (body.min_booking_value_cents !== undefined) {
      updateData.min_booking_value_cents = body.min_booking_value_cents || null;
    }

    // Booking preferences
    if (body.preferred_service_types !== undefined) {
      updateData.preferred_service_types = Array.isArray(body.preferred_service_types)
        ? body.preferred_service_types
        : [];
    }
    if (body.max_distance_km !== undefined) {
      updateData.max_distance_km = body.max_distance_km || null;
    }
    if (body.auto_accept_rules !== undefined) {
      updateData.auto_accept_rules = body.auto_accept_rules || {};
    }

    // Upsert (insert or update)
    const { data: preferences, error } = await supabase
      .from('cleaner_availability_preferences')
      .upsert(updateData, {
        onConflict: 'cleaner_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating availability preferences:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update preferences' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      preferences,
    });
  } catch (error) {
    console.error('Error in PUT /api/cleaner/availability/preferences:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

