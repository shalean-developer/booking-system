import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint to fetch customer's active recurring schedules
 * Requires authentication
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Find customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch customer profile' },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json({
        ok: true,
        schedules: [],
      });
    }

    // Fetch active recurring schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('recurring_schedules')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (schedulesError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch recurring schedules' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      schedules: schedules || [],
    });

  } catch (error) {
    console.error('Error in recurring-schedules route:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
