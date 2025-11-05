import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Assign Cleaner API
 * GET: Fetch available cleaners for a date/time with their schedules
 * POST: Assign cleaner to booking
 */
export async function GET(req: Request) {
  console.log('=== ADMIN ASSIGN CLEANER GET ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const supabase = await createClient();
    const url = new URL(req.url);
    const date = url.searchParams.get('date');
    const time = url.searchParams.get('time');
    
    if (!date) {
      return NextResponse.json(
        { ok: false, error: 'Date parameter required' },
        { status: 400 }
      );
    }
    
    // Determine day of week from date
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayColumns = [
      'available_sunday',
      'available_monday',
      'available_tuesday',
      'available_wednesday',
      'available_thursday',
      'available_friday',
      'available_saturday'
    ];
    const dayColumn = dayColumns[dayOfWeek];
    
    console.log(`📅 Filtering cleaners for ${date} (${dayColumn})`);
    
    // Fetch cleaners who:
    // 1. Are active
    // 2. Have master toggle ON
    // 3. Work on this day of week
    const { data: cleaners, error: cleanersError } = await supabase
      .from('cleaners')
      .select('*')
      .eq('is_active', true)
      .eq('is_available', true)  // Master toggle must be ON
      .eq(dayColumn, true)        // Must work on this day
      .order('name');
    
    if (cleanersError) throw cleanersError;
    
    // Fetch bookings for all cleaners on this date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, cleaner_id, booking_time, service_type, status')
      .eq('booking_date', date)
      .not('cleaner_id', 'is', null)
      .in('status', ['pending', 'confirmed', 'in_progress']);
    
    if (bookingsError) throw bookingsError;
    
    // Group bookings by cleaner
    const cleanerBookings = (bookings || []).reduce((acc, booking) => {
      if (!booking.cleaner_id) return acc;
      if (!acc[booking.cleaner_id]) {
        acc[booking.cleaner_id] = [];
      }
      acc[booking.cleaner_id].push({
        id: booking.id,
        time: booking.booking_time,
        service: booking.service_type,
        status: booking.status,
      });
      return acc;
    }, {} as Record<string, Array<{ id: string; time: string; service: string; status: string }>>);
    
    // Add booking info to cleaners
    const cleanersWithSchedule = (cleaners || []).map(cleaner => ({
      ...cleaner,
      bookings_on_date: cleanerBookings[cleaner.id] || [],
      has_conflict: time 
        ? (cleanerBookings[cleaner.id] || []).some(b => b.time === time)
        : false,
    }));
    
    console.log(`✅ Fetched ${cleaners?.length || 0} cleaners for ${date}`);
    
    return NextResponse.json({
      ok: true,
      cleaners: cleanersWithSchedule,
      date,
      time,
    });
    
  } catch (error) {
    console.error('=== ADMIN ASSIGN CLEANER GET ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch cleaners';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  console.log('=== ADMIN ASSIGN CLEANER POST ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { bookingId, cleanerId, override } = body;
    
    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID required' },
        { status: 400 }
      );
    }
    
    // If cleanerId is null, remove assignment
    if (cleanerId === null) {
      const supabase = await createClient();
      
      const { data: updatedBooking, error: updateError } = await supabase
        .from('bookings')
        .update({ cleaner_id: null })
        .eq('id', bookingId)
        .select()
        .single();
      
      if (updateError) throw updateError;
      
      console.log(`✅ Removed cleaner assignment from booking ${bookingId}`);
      
      return NextResponse.json({
        ok: true,
        booking: updatedBooking,
      });
    }
    
    // Otherwise, assign cleaner (existing logic)
    if (!cleanerId) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner ID required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('booking_date, booking_time')
      .eq('id', bookingId)
      .single();
    
    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Check for conflicts (unless override is true)
    if (!override) {
      const { data: conflicts, error: conflictError } = await supabase
        .from('bookings')
        .select('id')
        .eq('cleaner_id', cleanerId)
        .eq('booking_date', booking.booking_date)
        .eq('booking_time', booking.booking_time)
        .in('status', ['pending', 'confirmed', 'in_progress']);
      
      if (conflictError) throw conflictError;
      
      if (conflicts && conflicts.length > 0) {
        return NextResponse.json({
          ok: false,
          error: 'Cleaner has a conflicting booking at this time',
          requiresOverride: true,
          conflicts,
        });
      }
    }
    
    // Assign cleaner to booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ cleaner_id: cleanerId })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    console.log(`✅ Assigned cleaner ${cleanerId} to booking ${bookingId}`);
    
    return NextResponse.json({
      ok: true,
      booking: updatedBooking,
    });
    
  } catch (error) {
    console.error('=== ADMIN ASSIGN CLEANER POST ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to assign cleaner';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

