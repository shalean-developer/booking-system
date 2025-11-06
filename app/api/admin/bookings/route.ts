import { NextResponse } from 'next/server';
import { createClient, createServiceClient, isAdmin } from '@/lib/supabase-server';
import { fetchActivePricing, type PricingData } from '@/lib/pricing-db';
import { PRICING } from '@/lib/pricing';

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
    
    // Fetch pricing from database (with fallback to PRICING constant)
    let dbPricing: PricingData;
    try {
      dbPricing = await fetchActivePricing();
      console.log('✅ Using database pricing');
    } catch (error) {
      console.warn('⚠️ Failed to fetch pricing from database, using fallback:', error);
      dbPricing = PRICING as PricingData;
    }
    
    // Helper function to get extra price from database pricing or fallback
    const getExtraPrice = (extraName: string): number => {
      const normalizedName = extraName.trim();
      // Try database pricing first
      let price = dbPricing.extras[normalizedName] || 0;
      
      // Try case-insensitive lookup
      if (price === 0) {
        const matchingKey = Object.keys(dbPricing.extras).find(
          key => key.toLowerCase().trim() === normalizedName.toLowerCase()
        );
        if (matchingKey) {
          price = dbPricing.extras[matchingKey] || 0;
        }
      }
      
      // Fallback to PRICING constant if still 0
      if (price === 0) {
        const extraKey = normalizedName as keyof typeof PRICING.extras;
        price = PRICING.extras[extraKey] || 0;
        
        // Try case-insensitive lookup in fallback
        if (price === 0) {
          const matchingKey = Object.keys(PRICING.extras).find(
            key => key.toLowerCase().trim() === normalizedName.toLowerCase()
          ) as keyof typeof PRICING.extras | undefined;
          if (matchingKey) {
            price = PRICING.extras[matchingKey] || 0;
          }
        }
      }
      
      return price;
    };
    
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables');
      return NextResponse.json(
        { ok: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }
    
    // Use service client to bypass RLS after admin check
    let supabase;
    try {
      supabase = createServiceClient();
      if (!supabase) {
        throw new Error('Failed to create Supabase service client: client is null');
      }
    } catch (clientError) {
      console.error('❌ Failed to create Supabase service client:', clientError);
      return NextResponse.json(
        { ok: false, error: 'Failed to initialize database connection', details: String(clientError) },
        { status: 500 }
      );
    }
    
    // Parse URL - handle both full URLs and relative paths
    let url: URL;
    try {
      url = new URL(req.url);
    } catch (urlError) {
      console.error('❌ Failed to parse URL:', req.url, urlError);
      return NextResponse.json(
        { ok: false, error: 'Invalid request URL' },
        { status: 400 }
      );
    }
    
    // Get query parameters with safe defaults
    const pageParam = url.searchParams.get('page') || '1';
    const limitParam = url.searchParams.get('limit') || '50';
    const page = parseInt(pageParam, 10);
    let limit = parseInt(limitParam, 10);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const serviceType = url.searchParams.get('serviceType') || '';
    const view = url.searchParams.get('view') || '';
    const id = url.searchParams.get('id');
    
    // Cap limit at reasonable maximum to prevent performance issues
    const MAX_LIMIT = 10000;
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }
    
    // Log parameters for debugging
    console.log('📋 Request parameters:', { page, limit, search, status, serviceType, view, id });
    
    // If id is provided, fetch single booking with all related data
    if (id) {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error fetching booking:', error);
        return NextResponse.json(
          { ok: false, error: 'Booking not found' },
          { status: 404 }
        );
      }

      if (!booking) {
        return NextResponse.json(
          { ok: false, error: 'Booking not found' },
          { status: 404 }
        );
      }

      // Fetch cleaner name if cleaner_id exists
      let cleanerName = null;
      if (booking.cleaner_id && booking.cleaner_id !== 'manual') {
        try {
          const { data: cleaner } = await supabase
            .from('cleaners')
            .select('name')
            .eq('id', booking.cleaner_id)
            .maybeSingle();
          
          cleanerName = cleaner?.name || null;
        } catch (err) {
          console.warn('Failed to fetch cleaner name:', err);
        }
      } else if (booking.cleaner_id === 'manual') {
        cleanerName = 'Manual Assignment';
      }

      // Fetch notes count
      let notesCount = 0;
      try {
        const { data: notes } = await supabase
          .from('booking_notes')
          .select('id')
          .eq('booking_id', booking.id);
        
        notesCount = notes?.length || 0;
      } catch (err) {
        console.warn('Failed to fetch booking notes:', err);
      }

      // Fetch team assignment
      let teamAssigned = false;
      try {
        const { data: team } = await supabase
          .from('booking_teams')
          .select('id')
          .eq('booking_id', booking.id)
          .maybeSingle();
        
        teamAssigned = !!team;
      } catch (err) {
        console.warn('Failed to fetch team assignment:', err);
      }

      // Fetch recurring bookings count
      let recurringCount = 0;
      if (booking.recurring_schedule_id) {
        try {
          const { data: recurringBookings } = await supabase
            .from('bookings')
            .select('id')
            .eq('recurring_schedule_id', booking.recurring_schedule_id);
          
          recurringCount = recurringBookings?.length || 0;
        } catch (err) {
          console.warn('Failed to fetch recurring bookings count:', err);
        }
      }

      // Add all additional data to booking
      const bookingWithExtras = {
        ...booking,
        cleaner_name: cleanerName,
        notes_count: notesCount,
        team_assigned: teamAssigned,
        recurring_bookings_count: recurringCount,
        recurring_schedule_id: booking.recurring_schedule_id ?? null,
        // Ensure all fields are properly formatted
        // Try to get bedrooms/bathrooms from price_snapshot.service if they're null in main record
        bedrooms: booking.bedrooms ?? (booking.price_snapshot?.service?.bedrooms ?? null),
        bathrooms: booking.bathrooms ?? (booking.price_snapshot?.service?.bathrooms ?? null),
        // Enhance extras with prices if they're stored as strings
        extras: (() => {
          const rawExtras = booking.extras ?? (booking.price_snapshot?.extras ?? []);
          return rawExtras.map((e: any) => {
            // If already an object with price, return as-is
            if (typeof e === 'object' && e !== null && e.name && e.price != null) {
              return e;
            }
            // If it's a string, enrich it with price from database
            const extraName = typeof e === 'object' && e !== null && e.name ? e.name : String(e);
            const price = getExtraPrice(extraName);
            
            return { name: extraName, price };
          });
        })(),
        duration: booking.duration ?? null,
        frequency: booking.frequency ?? null,
        price_snapshot: booking.price_snapshot ?? null,
        notes: booking.notes ?? null,
        address_zip: booking.address_zip ?? null,
        customer_id: booking.customer_id ?? null,
        requires_team: booking.requires_team ?? false,
        // Ensure numeric fields are properly converted
        total_amount: booking.total_amount ?? 0,
        service_fee: booking.service_fee ?? 0,
        cleaner_earnings: booking.cleaner_earnings ?? 0,
      };
      
      // Log for debugging
      console.log('📋 Booking details fetched:', {
        id: booking.id,
        bedrooms: bookingWithExtras.bedrooms,
        bathrooms: bookingWithExtras.bathrooms,
        has_price_snapshot: !!booking.price_snapshot,
        price_snapshot_bedrooms: booking.price_snapshot?.service?.bedrooms,
        price_snapshot_bathrooms: booking.price_snapshot?.service?.bathrooms,
      });
      
      return NextResponse.json({
        ok: true,
        bookings: [bookingWithExtras],
        pagination: {
          page: 1,
          limit: 1,
          total: 1,
          totalPages: 1,
        },
      });
    }
    
    // Validate numeric parameters
    if (isNaN(page) || page < 1) {
      console.error('❌ Invalid page parameter:', pageParam);
      return NextResponse.json(
        { ok: false, error: `Invalid page parameter: ${pageParam}` },
        { status: 400 }
      );
    }
    if (isNaN(limit) || limit < 1) {
      console.error('❌ Invalid limit parameter:', limitParam);
      return NextResponse.json(
        { ok: false, error: `Invalid limit parameter: ${limitParam} (must be between 1 and ${MAX_LIMIT})` },
        { status: 400 }
      );
    }
    
    const offset = (page - 1) * limit;
    
    // Build query - use * to select all columns (Supabase handles missing columns gracefully)
    // This is safer than trying to enumerate all possible columns
    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' });
    
    // Apply view filter first (takes precedence over status filter)
    if (view) {
      if (view === 'new') {
        // New bookings are pending bookings
        query = query.eq('status', 'pending');
      } else if (view === 'previous') {
        // Previous bookings are completed, missed, or cancelled
        query = query.in('status', ['completed', 'missed', 'cancelled']);
      } else if (view === 'recurring') {
        // Recurring bookings have a frequency field set
        query = query.not('frequency', 'is', null);
      }
      // 'all' view doesn't add any filter
    }
    
    // Apply filters
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,id.ilike.%${search}%`);
    }
    
    // Apply status filter only if view is not set (or view is 'all')
    if (status && (!view || view === 'all')) {
      query = query.eq('status', status);
    }
    
    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }
    
    // Apply pagination and sorting
    // For very large limits, use limit() instead of range() for better performance
    const MAX_LIMIT_FOR_RANGE = 5000;
    let finalQuery = query;
    
    // Only apply ordering if limit is reasonable (ordering can be slow on large datasets)
    if (limit < MAX_LIMIT_FOR_RANGE) {
      try {
        finalQuery = query.order('created_at', { ascending: false });
      } catch (orderError) {
        console.warn('Failed to apply ordering, continuing without:', orderError);
        // Continue without ordering if it fails
      }
    }
    
    // Apply range only if not fetching everything
    if (limit < MAX_LIMIT_FOR_RANGE) {
      try {
        finalQuery = finalQuery.range(offset, offset + limit - 1);
      } catch (rangeError) {
        console.warn('Failed to apply range, using limit instead:', rangeError);
        finalQuery = finalQuery.limit(limit);
      }
    } else {
      // For max limit, just limit the results (no offset)
      finalQuery = finalQuery.limit(limit);
    }
    
    console.log('Executing query with limit:', limit, 'offset:', offset);
    const { data: bookings, error, count } = await finalQuery;
    
    if (error) {
      console.error('=== SUPABASE QUERY ERROR ===');
      console.error('Error object:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Query parameters:', { page, limit, offset, search, status, serviceType });
      
      // Return a more helpful error message
      return NextResponse.json(
        { 
          ok: false, 
          error: `Database query failed: ${error.message || 'Unknown error'}`,
          errorCode: error.code,
          details: error.details,
          hint: error.hint
        },
        { status: 500 }
      );
    }
    
    // Skip expensive queries if limit is very large (likely just counting)
    const skipExpensiveQueries = limit >= 1000;
    
    // Fetch cleaner names for bookings
    const cleanerIds = bookings
      ?.filter(b => b.cleaner_id && b.cleaner_id !== 'manual')
      .map(b => b.cleaner_id) || [];
    
    let cleanerNames: Record<string, string> = {};
    
    if (!skipExpensiveQueries && cleanerIds.length > 0) {
      try {
        const { data: cleaners, error: cleanersError } = await supabase
          .from('cleaners')
          .select('id, name')
          .in('id', cleanerIds);
        
        if (cleanersError) {
          console.warn('Failed to fetch cleaner names:', cleanersError);
        } else {
          cleanerNames = (cleaners || []).reduce((acc, c) => {
            acc[c.id] = c.name;
            return acc;
          }, {} as Record<string, string>);
        }
      } catch (err) {
        console.warn('Failed to fetch cleaner names:', err);
        // Continue without cleaner names
      }
    }
    
    // Fetch notes count for bookings
    const bookingIds = bookings?.map(b => b.id) || [];
    let notesCounts: Record<string, number> = {};
    
    if (!skipExpensiveQueries && bookingIds.length > 0) {
      try {
        const { data: notes, error: notesError } = await supabase
          .from('booking_notes')
          .select('booking_id')
          .in('booking_id', bookingIds);
        
        if (notesError) {
          console.warn('Failed to fetch booking notes:', notesError);
        } else {
          notesCounts = (notes || []).reduce((acc, note) => {
            acc[note.booking_id] = (acc[note.booking_id] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
        }
      } catch (err) {
        console.warn('Failed to fetch booking notes:', err);
        // Continue without notes counts
      }
    }
    
    // Fetch team assignments for bookings
    // Check all bookings for team assignments (since requires_team column may not exist)
    let teamAssignments: Record<string, boolean> = {};
    
    if (!skipExpensiveQueries && bookingIds.length > 0) {
      try {
        const { data: teams, error: teamsError } = await supabase
          .from('booking_teams')
          .select('booking_id')
          .in('booking_id', bookingIds);
        
        if (teamsError) {
          console.warn('Failed to fetch team assignments:', teamsError);
        } else {
          teamAssignments = (teams || []).reduce((acc, team) => {
            acc[team.booking_id] = true;
            return acc;
          }, {} as Record<string, boolean>);
        }
      } catch (err) {
        console.warn('Failed to fetch team assignments:', err);
        // Continue without team assignments
      }
    }
    
    // Fetch recurring bookings count for each booking
    // Count bookings that share the same recurring_schedule_id
    let recurringCounts: Record<string, number> = {};
    
    if (!skipExpensiveQueries && bookingIds.length > 0) {
      try {
        // Get all bookings with recurring_schedule_id
        const { data: recurringBookings, error: recurringError } = await supabase
          .from('bookings')
          .select('id, recurring_schedule_id')
          .not('recurring_schedule_id', 'is', null);
        
        if (recurringError) {
          console.warn('Failed to fetch recurring bookings:', recurringError);
        } else {
          // Count bookings per recurring_schedule_id
          const scheduleCounts: Record<string, number> = {};
          (recurringBookings || []).forEach(booking => {
            if (booking.recurring_schedule_id) {
              scheduleCounts[booking.recurring_schedule_id] = 
                (scheduleCounts[booking.recurring_schedule_id] || 0) + 1;
            }
          });
          
          // Map booking IDs to their counts
          (recurringBookings || []).forEach(booking => {
            if (booking.recurring_schedule_id) {
              recurringCounts[booking.id] = scheduleCounts[booking.recurring_schedule_id] || 0;
            }
          });
        }
      } catch (err) {
        console.warn('Failed to fetch recurring bookings count:', err);
        // Continue without recurring counts
      }
    }
    
    // Add cleaner names, notes count, team assignments, and recurring counts to bookings
    const bookingsArray = bookings || [];
    const bookingsWithExtras = bookingsArray.map(b => ({
      ...b,
      cleaner_name: b.cleaner_id === 'manual' 
        ? 'Manual Assignment'
        : cleanerNames[b.cleaner_id || ''] || null,
      notes_count: notesCounts[b.id] || 0,
      team_assigned: teamAssignments[b.id] || false,
      recurring_bookings_count: recurringCounts[b.id] || 0,
      recurring_schedule_id: b.recurring_schedule_id ?? null,
      // Ensure bedrooms/bathrooms are included with fallback to price_snapshot.service
      bedrooms: b.bedrooms ?? (b.price_snapshot?.service?.bedrooms ?? null),
      bathrooms: b.bathrooms ?? (b.price_snapshot?.service?.bathrooms ?? null),
      // Enhance extras with prices if they're stored as strings
      extras: (() => {
        const rawExtras = b.extras ?? (b.price_snapshot?.extras ?? []);
        return rawExtras.map((e: any) => {
          // If already an object with price, return as-is
          if (typeof e === 'object' && e !== null && e.name && e.price != null) {
            return e;
          }
          // If it's a string, enrich it with price from database
          const extraName = typeof e === 'object' && e !== null && e.name ? e.name : String(e);
          const price = getExtraPrice(extraName);
          
          return { name: extraName, price };
        });
      })(),
    }));
    
    console.log(`✅ Fetched ${bookingsArray.length} bookings`);
    
    return NextResponse.json({
      ok: true,
      bookings: bookingsWithExtras,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
    
  } catch (error) {
    console.error('=== ADMIN BOOKINGS GET ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    console.error('Error details:', { 
      name: errorName,
      message: errorMessage, 
      stack: errorStack,
      error: error
    });
    
    // Always return JSON, never HTML
    return NextResponse.json(
      { 
        ok: false, 
        error: errorMessage,
        errorName: errorName,
        ...(process.env.NODE_ENV === 'development' && { details: errorStack })
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
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
    // Use service client to bypass RLS after admin check
    const supabase = createServiceClient();
    
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
    
    // Use service client to bypass RLS after admin check
    const supabase = createServiceClient();
    
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
    
    // Use service client to bypass RLS after admin check
    const supabase = createServiceClient();
    
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

