import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5');
    const dateFrom = searchParams.get('date_from') || new Date().toISOString().split('T')[0];

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        customer_name,
        service_type,
        status,
        created_at
      `)
      .gte('created_at', dateFrom)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching new bookings:', error);
      return NextResponse.json({
        ok: true,
        bookings: [],
      });
    }

    return NextResponse.json({
      ok: true,
      bookings: bookings || [],
    });
  } catch (error) {
    console.error('Error in new bookings API:', error);
    return NextResponse.json({
      ok: true,
      bookings: [],
    });
  }
}


