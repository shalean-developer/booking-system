import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/supabase-server';
import { fetchPricingHistory } from '@/lib/pricing-db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pricing/history
 * Fetch pricing change history with optional filters
 */
export async function GET(req: Request) {
  console.log('=== ADMIN PRICING HISTORY GET ===');

  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    
    // Parse filters from query params
    const filters: any = {};
    
    const priceType = searchParams.get('price_type');
    if (priceType) filters.priceType = priceType;
    
    const serviceType = searchParams.get('service_type');
    if (serviceType) filters.serviceType = serviceType;
    
    const itemName = searchParams.get('item_name');
    if (itemName) filters.itemName = itemName;
    
    const limit = searchParams.get('limit');
    if (limit) filters.limit = parseInt(limit);

    console.log('Fetching history with filters:', filters);

    const history = await fetchPricingHistory(filters);

    console.log(`✅ Fetched ${history.length} history records`);

    return NextResponse.json({
      ok: true,
      history,
      count: history.length,
    });
  } catch (error: any) {
    console.error('=== ADMIN PRICING HISTORY ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch pricing history' },
      { status: 500 }
    );
  }
}

