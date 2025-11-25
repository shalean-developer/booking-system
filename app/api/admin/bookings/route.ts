import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { calcTotalAsync } from '@/lib/pricing';
import { generateUniqueBookingId } from '@/lib/booking-id';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin();
    console.log('Admin check result:', adminCheck);
    
    if (!adminCheck) {
      // Get more details about why admin check failed
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      console.log('Auth user:', user ? user.email : 'null');
      console.log('Auth error:', authError?.message);
      
      if (user) {
        // Check if customer record exists
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('id, role, auth_user_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        console.log('Customer record:', customer ? { id: customer.id, role: customer.role } : 'not found');
        console.log('Customer error:', customerError?.message);
      }
      
      console.log('Unauthorized access attempt to bookings API');
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    console.log('Fetching bookings from database...');
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const customerId = searchParams.get('customer'); // Filter by customer ID
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const excludeRecurring = searchParams.get('exclude_recurring') === 'true';

    // Build base query without join
    let query = supabase
      .from('bookings')
      .select('*');

    // Date range filtering (for schedule view) - MUST come before pagination
    if (start) {
      // Handle both ISO format and YYYY-MM-DD format
      const startDate = start.includes('T') ? start.split('T')[0] : start;
      query = query.gte('booking_date', startDate);
    }
    if (end) {
      // Handle both ISO format and YYYY-MM-DD format
      const endDate = end.includes('T') ? end.split('T')[0] : end;
      query = query.lte('booking_date', endDate);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by customer ID if provided
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,service_type.ilike.%${search}%`
      );
    }

    // Ordering - apply after filters but before pagination
    if (start && end) {
      // Schedule view: order by booking date and time
      query = query.order('booking_date', { ascending: true })
                   .order('booking_time', { ascending: true });
    } else {
      // List view: order by creation date
      query = query.order('created_at', { ascending: false });
    }
    
    // Pagination - apply last, after all filters
    query = query.range(offset, offset + limit - 1);

    // Exclude recurring bookings if requested
    if (excludeRecurring) {
      query = query.is('recurring_schedule_id', null);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch bookings: ${error.message}` },
        { status: 500 }
      );
    }

    console.log(`Fetched ${bookings?.length || 0} bookings from database`);

    // Ensure bookings is an array
    const safeBookings = Array.isArray(bookings) ? bookings : [];

    // Get count - apply same filters as main query
    let countQuery = supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true });

    // Date range filtering (for schedule view) - MUST come first
    if (start) {
      const startDate = start.includes('T') ? start.split('T')[0] : start;
      countQuery = countQuery.gte('booking_date', startDate);
    }
    if (end) {
      const endDate = end.includes('T') ? end.split('T')[0] : end;
      countQuery = countQuery.lte('booking_date', endDate);
    }

    if (status && status !== 'all') {
      countQuery = countQuery.eq('status', status);
    }

    // Filter by customer ID if provided
    if (customerId) {
      countQuery = countQuery.eq('customer_id', customerId);
    }

    if (search) {
      countQuery = countQuery.or(
        `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,customer_phone.ilike.%${search}%,service_type.ilike.%${search}%`
      );
    }

    if (excludeRecurring) {
      countQuery = countQuery.is('recurring_schedule_id', null);
    }

    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error fetching booking count:', countError);
    }

    // Extract all cleaner IDs (including team bookings)
    const cleanerIds = new Set<string>();
    const bookingIds = safeBookings.map((b: any) => b.id);
    
    safeBookings.forEach((booking: any) => {
      // Individual cleaner
      if (booking.cleaner_id && booking.cleaner_id !== 'manual' && booking.cleaner_id !== null) {
        try {
          // Check if it's a valid UUID
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(booking.cleaner_id)) {
            cleanerIds.add(booking.cleaner_id);
          }
        } catch {
          // Skip invalid IDs
        }
      }
    });

    // Fetch team bookings
    const teamBookingsMap = new Map<string, { supervisorId: string; memberIds: string[] }>();
    if (bookingIds.length > 0) {
      const { data: teams } = await supabase
        .from('booking_teams')
        .select('booking_id, supervisor_id')
        .in('booking_id', bookingIds);

      if (teams && teams.length > 0) {
        const teamBookingIds = teams.map((t: any) => t.booking_id);
        const { data: teamMembers } = await supabase
          .from('booking_team_members')
          .select('booking_id, cleaner_id')
          .in('booking_id', teamBookingIds);

        teams.forEach((team: any) => {
          const members = (teamMembers || [])
            .filter((tm: any) => tm.booking_id === team.booking_id)
            .map((tm: any) => tm.cleaner_id);
          
          cleanerIds.add(team.supervisor_id);
          members.forEach((id: string) => cleanerIds.add(id));
          
          teamBookingsMap.set(team.booking_id, {
            supervisorId: team.supervisor_id,
            memberIds: members,
          });
        });
      }
    }

    // Fetch all cleaners in one query
    let cleanersMap = new Map<string, { name: string }>();
    if (cleanerIds.size > 0) {
      const { data: cleaners } = await supabase
        .from('cleaners')
        .select('id, name')
        .in('id', Array.from(cleanerIds));

      if (cleaners) {
        cleaners.forEach((cleaner) => {
          cleanersMap.set(cleaner.id, { name: cleaner.name });
        });
      }
    }

    // Helper function to get cleaner name
    const getCleanerName = (booking: any): string | null => {
      // Check for team booking
      const teamInfo = teamBookingsMap.get(booking.id);
      if (teamInfo) {
        const supervisor = cleanersMap.get(teamInfo.supervisorId);
        const members = teamInfo.memberIds
          .map((id: string) => cleanersMap.get(id)?.name)
          .filter(Boolean);
        
        if (supervisor) {
          const memberNames = members.length > 0 ? `, ${members.join(', ')}` : '';
          return `${supervisor.name} (Supervisor)${memberNames}`;
        }
        return members.length > 0 ? members.join(', ') : null;
      }
      
      // Individual cleaner
      if (booking.cleaner_id && booking.cleaner_id !== 'manual' && booking.cleaner_id !== null) {
        const cleaner = cleanersMap.get(booking.cleaner_id);
        return cleaner?.name || null;
      }
      return null;
    };

    const formattedBookings = safeBookings.map((booking: any) => ({
      id: booking.id || '',
      customer_name: booking.customer_name || 'Unknown',
      customer_email: booking.customer_email || '',
      customer_phone: booking.customer_phone || '',
      service_type: booking.service_type || '',
      booking_date: booking.booking_date || '',
      booking_time: booking.booking_time || '',
      status: booking.status || 'pending',
      total_amount: booking.total_amount || 0,
      cleaner_id: booking.cleaner_id || null,
      cleaner_name: getCleanerName(booking),
      created_at: booking.created_at || new Date().toISOString(),
      updated_at: booking.updated_at || booking.created_at || new Date().toISOString(),
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    console.log(`Returning ${formattedBookings.length} formatted bookings, total: ${count || 0}, pages: ${totalPages}`);
    
    // Log sample booking for debugging
    if (formattedBookings.length > 0) {
      console.log('Sample booking:', JSON.stringify(formattedBookings[0], null, 2));
    }

    // Ensure we always return a valid response structure
    const response = {
      ok: true,
      bookings: Array.isArray(formattedBookings) ? formattedBookings : [],
      total: typeof count === 'number' ? count : 0,
      totalPages: typeof totalPages === 'number' ? totalPages : 1,
    };

    console.log('Final response:', {
      ok: response.ok,
      bookingsCount: response.bookings.length,
      total: response.total,
      totalPages: response.totalPages,
    });

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
      },
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
      const { data: existingCustomer, error: findError } = await supabase
        .from('customers')
        .select('id, total_bookings')
        .ilike('email', body.customer_email)
        .maybeSingle();

      if (findError) {
        console.error('Error finding customer:', findError);
        return NextResponse.json(
          { ok: false, error: `Failed to find customer: ${findError.message}` },
          { status: 500 }
        );
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Update customer info and increment bookings
        const { error: updateError } = await supabase
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
        
        if (updateError) {
          console.error('Error updating customer:', updateError);
          // Don't fail the booking if customer update fails, just log it
        }
      } else {
        const { data: newCustomer, error: createError } = await supabase
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
        
        if (createError) {
          console.error('Error creating customer:', createError);
          return NextResponse.json(
            { ok: false, error: `Failed to create customer: ${createError.message}` },
            { status: 500 }
          );
        }
        
        if (newCustomer) {
          customerId = newCustomer.id;
        } else {
          return NextResponse.json(
            { ok: false, error: 'Failed to create customer profile' },
            { status: 500 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { ok: false, error: 'Customer email is required' },
        { status: 400 }
      );
    }

    // Build price snapshot
    const priceSnapshot = {
      service_type: body.service_type,
      bedrooms: body.bedrooms || 1,
      bathrooms: body.bathrooms || 1,
      extras: body.extras || [],
      extrasQuantities: body.extrasQuantities || {},
      notes: body.notes || null, // Store notes in price_snapshot since notes column doesn't exist
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
    // Note: bedrooms and bathrooms are stored in price_snapshot, not as separate columns
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
        // Notes are stored in price_snapshot, not as a separate column
        total_amount: pricing.total * 100, // Convert to cents
        requires_team: requiresTeam,
        price_snapshot: priceSnapshot, // Contains bedrooms, bathrooms, extras, etc.
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { 
          ok: false, 
          error: `Failed to create booking: ${bookingError.message || 'Database error'}`,
          details: process.env.NODE_ENV === 'development' ? bookingError.message : undefined
        },
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
  } catch (error: any) {
    console.error('Error in bookings POST API:', error);
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
