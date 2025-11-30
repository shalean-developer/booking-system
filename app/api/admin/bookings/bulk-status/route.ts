import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bookingIds, status } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Booking IDs are required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { ok: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status value
    const validStatuses = ['pending', 'confirmed', 'accepted', 'on_my_way', 'in-progress', 'completed', 'cancelled', 'declined'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { ok: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Update all bookings with the new status
    const { data, error } = await supabase
      .from('bookings')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .in('id', bookingIds)
      .select('id');

    if (error) {
      console.error('Error updating bookings:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update bookings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      updated: data?.length || 0,
      message: `Successfully updated ${data?.length || 0} booking(s) to ${status}`,
    });
  } catch (error: any) {
    console.error('Error in bulk status update:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

