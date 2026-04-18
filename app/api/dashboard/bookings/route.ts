import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { CUSTOMER_BOOKINGS_ORDER } from '@/lib/dashboard/customer-booking-list';

async function attachCleanerProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Record<string, unknown>[]
) {
  const cleanerIds = [
    ...new Set(
      rows
        .map((r) => r.cleaner_id as string | null | undefined)
        .filter((id): id is string => {
          if (!id || id === 'manual') return false;
          return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        })
    ),
  ];
  if (cleanerIds.length === 0) return rows;

  const { data: cleaners } = await supabase.from('cleaners').select('id, name, phone').in('id', cleanerIds);

  const map = new Map((cleaners || []).map((c) => [c.id, { name: c.name as string, phone: c.phone as string | null }]));

  return rows.map((b) => {
    const cid = b.cleaner_id as string | null | undefined;
    const prof = cid && map.has(cid) ? map.get(cid)! : null;
    return { ...b, cleaner_profile: prof };
  });
}

async function attachReviewRatings(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Record<string, unknown>[]
): Promise<Record<string, unknown>[]> {
  const ids = [
    ...new Set(
      rows
        .map((r) => r.customer_review_id as string | null | undefined)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  if (ids.length === 0) {
    return rows.map((r) => ({ ...r, review_overall_rating: null }));
  }

  const { data: reviews } = await supabase
    .from('cleaner_reviews')
    .select('id, overall_rating')
    .in('id', ids);

  const ratingById = new Map(
    (reviews || []).map((rev: { id: string; overall_rating: number | null }) => [
      rev.id,
      typeof rev.overall_rating === 'number' ? rev.overall_rating : null,
    ])
  );

  return rows.map((r) => {
    const rid = r.customer_review_id as string | null | undefined;
    const raw = rid ? ratingById.get(rid) : null;
    return {
      ...r,
      review_overall_rating: raw != null && !Number.isNaN(raw) ? raw : null,
    };
  });
}

/** Many deployments store bedrooms/bathrooms only inside `price_snapshot`, not as columns. */
function enrichBookingRowFromSnapshot(row: Record<string, unknown>): Record<string, unknown> {
  const snap = row.price_snapshot as
    | { service?: { bedrooms?: number; bathrooms?: number } }
    | null
    | undefined;
  const fromCol = (k: 'bedrooms' | 'bathrooms') =>
    typeof row[k] === 'number' && Number.isFinite(row[k] as number) ? (row[k] as number) : null;
  return {
    ...row,
    bedrooms: fromCol('bedrooms') ?? snap?.service?.bedrooms ?? null,
    bathrooms: fromCol('bathrooms') ?? snap?.service?.bathrooms ?? null,
  };
}

/**
 * API endpoint to fetch bookings for authenticated user's dashboard
 * Requires authentication
 */
export async function GET(request: Request) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabase = await createClient();
    
    // Verify token and get user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Find customer profile by auth_user_id
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, phone, address_line1, address_suburb, address_city, total_bookings, rewards_points')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Failed to fetch customer profile',
          details: customerError.message,
        },
        { status: 500 }
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get('limit') || 20) || 20)
    );
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0) || 0);

    if (!customer) {
      return NextResponse.json({
        ok: true,
        bookings: [],
        customer: null,
        message: 'No bookings yet',
        pagination: {
          limit,
          offset: 0,
          totalCount: 0,
          hasMore: false,
        },
      });
    }

    const { count: totalCountRaw, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id);

    if (countError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error counting bookings:', countError);
      }
      return NextResponse.json(
        { ok: false, error: 'Failed to count bookings', details: countError.message },
        { status: 500 }
      );
    }

    const totalCount = totalCountRaw ?? 0;
    const rangeEnd = offset + limit - 1;

    // Fetch bookings for this customer (with graceful fallback if `notes` column doesn't exist)
    let bookingsQuery = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        service_type,
        notes,
        status,
        total_amount,
        created_at,
        updated_at,
        address_line1,
        address_suburb,
        address_city,
        cleaner_id,
        customer_name,
        customer_email,
        customer_phone,
        payment_reference,
        paystack_ref,
        zoho_invoice_id,
        invoice_url,
        customer_reviewed,
        customer_review_id,
        cleaner_started_at,
        cleaner_completed_at,
        expected_end_time,
        extras,
        extras_quantities,
        price_snapshot,
        requires_team,
        duration_minutes,
        booking_teams ( team_name )
      `)
      .eq('customer_id', customer.id)
      .order(CUSTOMER_BOOKINGS_ORDER.column, { ascending: CUSTOMER_BOOKINGS_ORDER.ascending })
      .range(offset, rangeEnd);

    let { data: bookingsRaw, error: bookingsError } = await bookingsQuery;

    /** Loose row shape so retry/fallback mapping type-checks against Supabase variants. */
    let bookings: Record<string, unknown>[] = Array.isArray(bookingsRaw)
      ? (bookingsRaw as Record<string, unknown>[])
      : [];

    // If the error indicates unknown column `notes`, retry without it
    if (
      bookingsError &&
      (bookingsError.message?.includes('notes') ||
        bookingsError.details?.includes('notes') ||
        bookingsError.message?.includes('paystack_ref') ||
        bookingsError.message?.includes('zoho_invoice_id') ||
        bookingsError.message?.includes('invoice_url'))
    ) {
      console.warn('Retrying bookings select with a reduced column set');
      const retry = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          service_type,
          status,
          total_amount,
          created_at,
          updated_at,
          address_line1,
          address_suburb,
          address_city,
          cleaner_id,
          customer_name,
          customer_email,
          customer_phone,
          payment_reference,
          customer_reviewed,
          customer_review_id,
          cleaner_started_at,
          cleaner_completed_at,
          expected_end_time,
          extras,
          extras_quantities,
          price_snapshot,
          requires_team,
          duration_minutes,
          booking_teams ( team_name )
        `)
        .eq('customer_id', customer.id)
        .order(CUSTOMER_BOOKINGS_ORDER.column, { ascending: CUSTOMER_BOOKINGS_ORDER.ascending })
        .range(offset, rangeEnd);
      // Ensure shape matches earlier select by adding optional columns when missing
      bookings = (retry.data || []).map((row) => {
        const b = row as Record<string, unknown>;
        return {
          ...b,
          notes: null,
          paystack_ref: b.paystack_ref ?? null,
          zoho_invoice_id: b.zoho_invoice_id ?? null,
          invoice_url: b.invoice_url ?? null,
          cleaner_started_at: b.cleaner_started_at ?? null,
          cleaner_completed_at: b.cleaner_completed_at ?? null,
          expected_end_time: b.expected_end_time ?? null,
          extras: b.extras ?? null,
          extras_quantities: b.extras_quantities ?? null,
          price_snapshot: b.price_snapshot ?? null,
        };
      });
      bookingsError = retry.error || null;
    }

    // Last resort: avoid embedded relations (e.g. booking_teams RLS/FK) — full row only
    if (bookingsError) {
      console.warn('BOOKINGS API: fallback select(*)', bookingsError.message);
      const fb = await supabase
        .from('bookings')
        .select('*')
        .eq('customer_id', customer.id)
        .order(CUSTOMER_BOOKINGS_ORDER.column, { ascending: CUSTOMER_BOOKINGS_ORDER.ascending })
        .range(offset, rangeEnd);
      if (fb.error) {
        console.error('BOOKINGS API ERROR:', fb.error);
        return NextResponse.json(
          {
            ok: false,
            error: 'Failed to fetch bookings',
            details: fb.error.message,
          },
          { status: 500 }
        );
      }
      bookings = (fb.data || []) as Record<string, unknown>[];
    }

    const rawRows = ((bookings || []) as Record<string, unknown>[]).map(enrichBookingRowFromSnapshot);
    const withCleaners = await attachCleanerProfiles(supabase, rawRows);
    const withRatings = await attachReviewRatings(supabase, withCleaners);

    const pageLen = withRatings.length;
    const hasMore = offset + pageLen < totalCount;

    return NextResponse.json({
      ok: true,
      bookings: withRatings,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        addressLine1: customer.address_line1,
        addressSuburb: customer.address_suburb,
        addressCity: customer.address_city,
        totalBookings: customer.total_bookings,
        rewardsPoints: customer.rewards_points ?? 0,
      },
      pagination: {
        limit,
        offset,
        totalCount,
        hasMore,
      },
    });

  } catch (error) {
    console.error('BOOKINGS API ERROR:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

