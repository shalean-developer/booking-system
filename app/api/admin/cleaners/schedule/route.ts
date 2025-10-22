import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin API for managing cleaner day-of-week schedules
 * PATCH: Update which days a cleaner works
 */
export async function PATCH(req: NextRequest) {
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { cleanerId, schedule } = body;

    if (!cleanerId) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner ID is required' },
        { status: 400 }
      );
    }

    if (!schedule || typeof schedule !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'Schedule object is required' },
        { status: 400 }
      );
    }

    // Validate schedule object - only accept valid days
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const updateData: Record<string, boolean> = {};
    
    validDays.forEach(day => {
      if (day in schedule) {
        updateData[`available_${day}`] = Boolean(schedule[day]);
      }
    });

    // Must have at least one day in the update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'At least one day must be specified' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update cleaner schedule
    const { data, error } = await supabase
      .from('cleaners')
      .update(updateData)
      .eq('id', cleanerId)
      .select('id, name, available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday')
      .single();

    if (error) {
      console.error('❌ Error updating schedule:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update schedule' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    console.log('✅ Updated schedule for', data.name);
    console.log('📅 New schedule:', {
      Mon: data.available_monday,
      Tue: data.available_tuesday,
      Wed: data.available_wednesday,
      Thu: data.available_thursday,
      Fri: data.available_friday,
      Sat: data.available_saturday,
      Sun: data.available_sunday,
    });

    return NextResponse.json({
      ok: true,
      message: 'Schedule updated successfully',
      cleaner: data
    });
  } catch (error) {
    console.error('❌ Error in schedule update:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

