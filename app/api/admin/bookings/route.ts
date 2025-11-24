import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { calcTotalAsync } from '@/lib/pricing';
import { generateUniqueBookingId } from '@/lib/booking-id';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('bookings')
      .select(`*, cleaners:cleaner_id (id, first_name, last_name, name)`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,service_type.ilike.%${search}%`
      );
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    let countQuery = supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    if (search) {
      countQuery = countQuery.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,service_type.ilike.%${search}%`
      );
    }

    const { count } = await countQuery;

    const formattedBookings = (bookings || []).map((booking: any) => {
      const cleaners = booking.cleaners;
      const cleaner = Array.isArray(cleaners) ? cleaners[0] : cleaners;
      const cleanerName = cleaner?.name ||
                          `${cleaner?.first_name || ''} ${cleaner?.last_name || ''}`.trim() ||
                          null;

      return {
        id: booking.id,
        customer_name: booking.customer_name,
        customer_email: booking.customer_email,
        customer_phone: booking.customer_phone,
        service_type: booking.service_type,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        status: booking.status,
        total_amount: booking.total_amount,
        cleaner_id: booking.cleaner_id,
        cleaner_name: cleanerName,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      };
    });

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      ok: true,
      bookings: formattedBookings,
      total: count || 0,
      totalPages,
    });
  } catch (error) {
    console.error('Error in bookings API:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = await createClient();

    // Validate required fields
    if (!body.service_type || !body.booking_date || !body.booking_time) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate booking ID
    const bookingId = generateUniqueBookingId();

    // Calculate pricing
    const pricing = await calcTotalAsync(
      {
        service: body.service_type,
        bedrooms: body.bedrooms || 1,
        bathrooms: body.bathrooms || 1,
        extras: body.extras || [],
        extrasQuantities: body.extrasQuantities || {},
      },
      'one-time'
    );

    // Create or find customer profile
    let customerId = null;
    if (body.customer_email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id, total_bookings')
        .ilike('email', body.customer_email)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Update customer info and increment bookings
        await supabase
          .from('customers')
          .update({
            phone: body.customer_phone,
            first_name: body.customer_first_name,
            last_name: body.customer_last_name,
            address_line1: body.address_line1,
            address_suburb: body.address_suburb,
            address_city: body.address_city,
            total_bookings: (existingCustomer.total_bookings || 0) + 1,
          })
          .eq('id', existingCustomer.id);
      } else {
        const { data: newCustomer } = await supabase
          .from('customers')
          .insert({
            email: body.customer_email.toLowerCase().trim(),
            phone: body.customer_phone,
            first_name: body.customer_first_name,
            last_name: body.customer_last_name,
            address_line1: body.address_line1,
            address_suburb: body.address_suburb,
            address_city: body.address_city,
            total_bookings: 1,
          })
          .select()
          .single();
        
        if (newCustomer) {
          customerId = newCustomer.id;
        }
      }
    }

    // Build price snapshot
    const priceSnapshot = {
      service_type: body.service_type,
      bedrooms: body.bedrooms || 1,
      bathrooms: body.bathrooms || 1,
      extras: body.extras || [],
      extrasQuantities: body.extrasQuantities || {},
      subtotal: pricing.subtotal,
      serviceFee: pricing.serviceFee,
      frequencyDiscount: pricing.frequencyDiscount,
      total: pricing.total,
      snapshot_date: new Date().toISOString(),
    };

    // Determine if team booking
    const requiresTeam = body.service_type === 'Deep' || body.service_type === 'Move In/Out';
    const cleanerIdForInsert = requiresTeam || body.cleaner_ids?.length > 0
      ? null
      : (body.cleaner_id || null);

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        id: bookingId,
        customer_id: customerId,
        cleaner_id: cleanerIdForInsert,
        booking_date: body.booking_date,
        booking_time: body.booking_time,
        service_type: body.service_type,
        customer_name: `${body.customer_first_name} ${body.customer_last_name}`,
        customer_email: body.customer_email,
        customer_phone: body.customer_phone,
        address_line1: body.address_line1,
        address_suburb: body.address_suburb,
        address_city: body.address_city,
        bedrooms: body.bedrooms || 1,
        bathrooms: body.bathrooms || 1,
        notes: body.notes || null,
        total_amount: pricing.total * 100, // Convert to cents
        requires_team: requiresTeam,
        price_snapshot: priceSnapshot,
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { ok: false, error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Handle team assignment if needed
    if (requiresTeam && body.cleaner_ids && body.cleaner_ids.length > 0 && body.supervisor_id) {
      // Create team record
      const { error: teamError } = await supabase
        .from('booking_teams')
        .insert({
          booking_id: bookingId,
          team_name: `Team ${bookingId.slice(-3)}`,
          supervisor_id: body.supervisor_id,
        });

      if (!teamError) {
        // Add team members
        const teamMembers = body.cleaner_ids.map((cleanerId: string) => ({
          booking_id: bookingId,
          cleaner_id: cleanerId,
          is_supervisor: cleanerId === body.supervisor_id,
        }));

        await supabase.from('booking_team_members').insert(teamMembers);
      }
    }

    return NextResponse.json({
      ok: true,
      booking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
