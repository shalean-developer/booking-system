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

    // Count bookings by status
    const statuses = ['pending', 'confirmed', 'accepted', 'in-progress', 'completed'];
    const pipeline: Record<string, number> = {};

    for (const status of statuses) {
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', status);

      pipeline[status] = count || 0;
    }

    return NextResponse.json({
      ok: true,
      pipeline,
    });
  } catch (error) {
    console.error('Error in booking pipeline API:', error);
    return NextResponse.json({
      ok: true,
      pipeline: {},
    });
  }
}
















