import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { enabled } = await request.json();

    // Update or insert maintenance mode setting
    const { error } = await supabase
      .from('settings')
      .upsert(
        { id: 1, maintenance_mode: enabled, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Error updating maintenance mode:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update maintenance mode' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      maintenanceMode: enabled,
    });
  } catch (error) {
    console.error('Error in maintenance mode API:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

