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

    // Get customers with active recurring schedules
    const { data: schedules, error } = await supabase
      .from('recurring_schedules')
      .select(`
        id,
        customer_id,
        frequency,
        customers:customer_id (
          id,
          name,
          first_name,
          last_name
        )
      `)
      .eq('is_active', true)
      .limit(limit);

    if (error) {
      console.error('Error fetching recurring customers:', error);
      return NextResponse.json({
        ok: true,
        customers: [],
      });
    }

    const customers = (schedules || []).map((schedule: any) => ({
      id: schedule.customer_id,
      name: schedule.customers?.name || 
            `${schedule.customers?.first_name || ''} ${schedule.customers?.last_name || ''}`.trim() ||
            'Customer',
      frequency: schedule.frequency,
    }));

    return NextResponse.json({
      ok: true,
      customers,
    });
  } catch (error) {
    console.error('Error in recurring customers API:', error);
    return NextResponse.json({
      ok: true,
      customers: [],
    });
  }
}











































