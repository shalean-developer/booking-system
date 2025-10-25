import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Bookings API
 * GET: Fetch all bookings with filters
 * POST: Create new booking
 * PUT: Update booking
 * DELETE: Delete booking
 */
export async function GET(req: Request) {
  console.log('=== ADMIN BOOKINGS GET ===');
  
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
    
    // Get query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const serviceType = url.searchParams.get('serviceType') || '';
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        service_type,
        customer_name,
        customer_email,
        customer_phone,
        address_line1,
        address_suburb,
        address_city,
        status,
        total_amount,
        service_fee,
        cleaner_earnings,
        payment_reference,
        cleaner_id,
        customer_id,
        requires_team,
        created_at
      `, { count: 'exact' });
    
    // Apply filters
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,id.ilike.%${search}%`);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }
    
    // Apply pagination and sorting
    const { data: bookings, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    // Fetch cleaner names for bookings
    const cleanerIds = bookings
      ?.filter(b => b.cleaner_id && b.cleaner_id !== 'manual')
      .map(b => b.cleaner_id) || [];
    
    let cleanerNames: Record<string, string> = {};
    
    if (cleanerIds.length > 0) {
      const { data: cleaners } = await supabase
        .from('cleaners')
        .select('id, name')
        .in('id', cleanerIds);
      
      cleanerNames = (cleaners || []).reduce((acc, c) => {
        acc[c.id] = c.name;
        return acc;
      }, {} as Record<string, string>);
    }
    
    // Fetch notes count for bookings
    const bookingIds = bookings?.map(b => b.id) || [];
    let notesCounts: Record<string, number> = {};
    
    if (bookingIds.length > 0) {
      const { data: notes } = await supabase
        .from('booking_notes')
        .select('booking_id')
        .in('booking_id', bookingIds);
      
      notesCounts = (notes || []).reduce((acc, note) => {
        acc[note.booking_id] = (acc[note.booking_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
    
    // Fetch team assignments for bookings that require teams
    const teamBookingIds = bookings
      ?.filter(b => b.requires_team)
      .map(b => b.id) || [];
    
    let teamAssignments: Record<string, boolean> = {};
    
    if (teamBookingIds.length > 0) {
      const { data: teams } = await supabase
        .from('booking_teams')
        .select('booking_id')
        .in('booking_id', teamBookingIds);
      
      teamAssignments = (teams || []).reduce((acc, team) => {
        acc[team.booking_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    
    // Add cleaner names, notes count, and team assignments to bookings
    const bookingsWithExtras = bookings?.map(b => ({
      ...b,
      cleaner_name: b.cleaner_id === 'manual' 
        ? 'Manual Assignment'
        : cleanerNames[b.cleaner_id || ''] || null,
      notes_count: notesCounts[b.id] || 0,
      team_assigned: teamAssignments[b.id] || false,
    }));
    
    console.log(`✅ Fetched ${bookings?.length || 0} bookings`);
    
    return NextResponse.json({
      ok: true,
      bookings: bookingsWithExtras || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
    
  } catch (error) {
    console.error('=== ADMIN BOOKINGS GET ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  console.log('=== ADMIN BOOKINGS POST ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const supabase = await createClient();
    
    // Generate booking ID
    const bookingId = `BK-${Date.now()}`;
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([{ ...body, id: bookingId }])
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Booking created:', bookingId);
    
    return NextResponse.json({
      ok: true,
      booking,
    });
    
  } catch (error) {
    console.error('=== ADMIN BOOKINGS POST ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  console.log('=== ADMIN BOOKINGS PUT ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    const { data: booking, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Booking updated:', id);
    
    return NextResponse.json({
      ok: true,
      booking,
    });
    
  } catch (error) {
    console.error('=== ADMIN BOOKINGS PUT ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update booking';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  console.log('=== ADMIN BOOKINGS DELETE ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('✅ Booking deleted:', id);
    
    return NextResponse.json({
      ok: true,
      message: 'Booking deleted successfully',
    });
    
  } catch (error) {
    console.error('=== ADMIN BOOKINGS DELETE ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}

