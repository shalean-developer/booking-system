import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const dateFrom = searchParams.get('date_from') || new Date().toISOString().split('T')[0];

    // bookings.cleaner_id is TEXT (UUID string or e.g. "manual"), not an FK — PostgREST cannot embed cleaners.
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        booking_date,
        booking_time,
        service_type,
        status,
        customer_name,
        address_suburb,
        total_amount,
        cleaner_id
      `
      )
      .gte('booking_date', dateFrom)
      .in('status', ['pending', 'confirmed', 'accepted', 'paid', 'in-progress', 'on_my_way'])
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching upcoming bookings:', error);
      return NextResponse.json(
        {
          ok: false,
          error: error.message || 'Failed to fetch upcoming bookings',
          bookings: [],
        },
        { status: 500 }
      );
    }

    const rows = bookings || [];
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const cleanerIds = [
      ...new Set(
        rows
          .map((b: { cleaner_id?: string | null }) => (typeof b.cleaner_id === 'string' ? b.cleaner_id : ''))
          .filter((id) => id && id !== 'manual' && uuidRe.test(id))
      ),
    ];

    const nameById = new Map<string, string>();
    if (cleanerIds.length > 0) {
      const { data: cleaners, error: cleanersError } = await supabase
        .from('cleaners')
        .select('id, name')
        .in('id', cleanerIds);

      if (cleanersError) {
        console.error('Error fetching cleaners for upcoming bookings:', cleanersError);
        return NextResponse.json(
          {
            ok: false,
            error: cleanersError.message || 'Failed to resolve cleaner names',
            bookings: [],
          },
          { status: 500 }
        );
      }
      (cleaners || []).forEach((c: { id: string; name?: string | null }) => {
        if (c.id) nameById.set(String(c.id), c.name ?? '');
      });
    }

    const transformedBookings = rows.map((booking: { cleaner_id?: string | null; [key: string]: unknown }) => {
      const cid = typeof booking.cleaner_id === 'string' ? booking.cleaner_id : '';
      const cleanerName =
        cid && cid !== 'manual' && uuidRe.test(cid) ? nameById.get(cid) ?? null : null;
      return {
        ...booking,
        cleaner_name: cleanerName,
      };
    });

    return NextResponse.json({
      ok: true,
      bookings: transformedBookings,
    });
  } catch (error) {
    console.error('Error in upcoming bookings API:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        bookings: [],
      },
      { status: 500 }
    );
  }
}





































































