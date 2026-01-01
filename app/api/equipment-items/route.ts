import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint to fetch active equipment items
 * Public endpoint - no authentication required
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch active equipment items ordered by display_order
    const { data: equipmentItems, error } = await supabase
      .from('equipment_items')
      .select('id, name, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching equipment items:', error);
      return NextResponse.json(
        { ok: false, error: error.message, items: [] },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      items: equipmentItems || [],
    });
  } catch (error: any) {
    console.error('Error in equipment items API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error', items: [] },
      { status: 500 }
    );
  }
}

