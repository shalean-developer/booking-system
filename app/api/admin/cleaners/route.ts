import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

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
    const active = searchParams.get('active');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('cleaners')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (active === 'true') {
      query = query.eq('is_active', true);
    }

    const { data: cleaners, error } = await query;

    if (error) {
      console.error('Error fetching cleaners:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch cleaners' },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = supabase
      .from('cleaners')
      .select('*', { count: 'exact', head: true });

    if (active === 'true') {
      countQuery = countQuery.eq('is_active', true);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      ok: true,
      cleaners: cleaners || [],
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error('Error in cleaners GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}










