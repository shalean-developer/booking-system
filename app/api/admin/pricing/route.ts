import { NextResponse } from 'next/server';
import { isAdmin, createClient } from '@/lib/supabase-server';
import {
  fetchActivePricing,
  savePricing,
  scheduleFuturePrice,
  deactivatePricing,
  getScheduledPricing,
  clearPricingCache,
  PricingRecord,
} from '@/lib/pricing-db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/pricing
 * Fetch current and scheduled pricing
 */
export async function GET(req: Request) {
  console.log('=== ADMIN PRICING GET ===');

  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const includeScheduled = searchParams.get('scheduled') === 'true';
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Fetch current active pricing
    const currentPricing = await fetchActivePricing(forceRefresh);

    // Optionally fetch scheduled pricing
    let scheduledPricing: PricingRecord[] = [];
    if (includeScheduled) {
      scheduledPricing = await getScheduledPricing();
    }

    console.log('✅ Pricing fetched successfully');

    return NextResponse.json({
      ok: true,
      current: currentPricing,
      scheduled: scheduledPricing,
    });
  } catch (error: any) {
    console.error('=== ADMIN PRICING GET ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch pricing' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/pricing
 * Create new pricing or schedule future price change
 */
export async function POST(req: Request) {
  console.log('=== ADMIN PRICING POST ===');

  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    console.log('Request body:', body);

    // Validate required fields
    if (!body.price_type) {
      return NextResponse.json(
        { ok: false, error: 'price_type is required' },
        { status: 400 }
      );
    }

    if (body.price === undefined || body.price === null) {
      return NextResponse.json(
        { ok: false, error: 'price is required' },
        { status: 400 }
      );
    }

    if (body.price < 0) {
      return NextResponse.json(
        { ok: false, error: 'price cannot be negative' },
        { status: 400 }
      );
    }

    // Get authenticated Supabase client with user context
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    let result: PricingRecord;

    // Check if this is a scheduled price change
    if (body.effective_date && body.effective_date > new Date().toISOString().split('T')[0]) {
      // Schedule future price
      result = await scheduleFuturePrice(
        {
          service_type: body.service_type || null,
          price_type: body.price_type,
          item_name: body.item_name || null,
          price: body.price,
          notes: body.notes || null,
        },
        body.effective_date,
        userId,
        supabase
      );

      console.log('✅ Future price scheduled:', result.id);
    } else {
      // Immediate price change
      result = await savePricing(
        {
          service_type: body.service_type || null,
          price_type: body.price_type,
          item_name: body.item_name || null,
          price: body.price,
          effective_date: body.effective_date || new Date().toISOString().split('T')[0],
          is_active: true,
          notes: body.notes || null,
        },
        userId,
        supabase
      );

      console.log('✅ Pricing created:', result.id);
    }

    return NextResponse.json({
      ok: true,
      pricing: result,
    });
  } catch (error: any) {
    console.error('=== ADMIN PRICING POST ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to create pricing' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/pricing
 * Update existing pricing
 */
export async function PUT(req: Request) {
  console.log('=== ADMIN PRICING PUT ===');

  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    console.log('Request body:', body);

    if (!body.id) {
      return NextResponse.json(
        { ok: false, error: 'id is required for updates' },
        { status: 400 }
      );
    }

    if (body.price !== undefined && body.price < 0) {
      return NextResponse.json(
        { ok: false, error: 'price cannot be negative' },
        { status: 400 }
      );
    }

    // Get authenticated Supabase client with user context
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    const result = await savePricing(
      {
        id: body.id,
        service_type: body.service_type,
        price_type: body.price_type,
        item_name: body.item_name,
        price: body.price,
        effective_date: body.effective_date,
        end_date: body.end_date,
        is_active: body.is_active,
        notes: body.notes,
      },
      userId,
      supabase
    );

    console.log('✅ Pricing updated:', result.id);

    return NextResponse.json({
      ok: true,
      pricing: result,
    });
  } catch (error: any) {
    console.error('=== ADMIN PRICING PUT ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to update pricing' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/pricing
 * Deactivate pricing (soft delete)
 */
export async function DELETE(req: Request) {
  console.log('=== ADMIN PRICING DELETE ===');

  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'id parameter is required' },
        { status: 400 }
      );
    }

    // Get authenticated Supabase client with user context
    const supabase = await createClient();
    
    await deactivatePricing(id, supabase);

    console.log('✅ Pricing deactivated:', id);

    return NextResponse.json({
      ok: true,
      message: 'Pricing deactivated successfully',
    });
  } catch (error: any) {
    console.error('=== ADMIN PRICING DELETE ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to deactivate pricing' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/pricing (clear cache)
 */
export async function PATCH(req: Request) {
  console.log('=== ADMIN PRICING PATCH (Clear Cache) ===');

  try {
    // Check admin access
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    clearPricingCache();

    console.log('✅ Pricing cache cleared');

    return NextResponse.json({
      ok: true,
      message: 'Cache cleared successfully',
    });
  } catch (error: any) {
    console.error('=== ADMIN PRICING PATCH ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

