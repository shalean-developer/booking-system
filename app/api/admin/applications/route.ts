import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const jsonHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { 
          status: 403,
          headers: jsonHeaders
        }
      );
    }

    // Use service role client to bypass RLS
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query with count for pagination
    let query = supabase
      .from('applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('[Admin Applications API] Error fetching applications:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch applications' },
        { 
          status: 500,
          headers: jsonHeaders
        }
      );
    }

    // Transform applications to match frontend interface
    const transformedApplications = (applications || []).map((app: any) => ({
      id: app.id,
      name: `${app.first_name || ''} ${app.last_name || ''}`.trim() || app.email,
      email: app.email,
      phone: app.phone || null,
      status: app.status || 'pending',
      created_at: app.created_at,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      ok: true,
      applications: transformedApplications,
      total,
      totalPages,
    }, {
      headers: jsonHeaders
    });
  } catch (error: any) {
    console.error('[Admin Applications API] Error in applications GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { 
        status: 500,
        headers: jsonHeaders
      }
    );
  }
}
































