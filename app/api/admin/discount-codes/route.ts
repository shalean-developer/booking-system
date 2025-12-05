import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// GET: Fetch all discount codes
export async function GET(request: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: codes, error } = await query;

    if (error) {
      console.error('Error fetching discount codes:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch discount codes' },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = supabase
      .from('discount_codes')
      .select('id', { count: 'exact', head: true });

    if (search) {
      countQuery = countQuery.or(`code.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { count, error: countError } = await countQuery;

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      ok: true,
      codes: codes || [],
      total: count || 0,
      totalPages,
    });
  } catch (error: any) {
    console.error('Error in discount codes GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new discount code
export async function POST(request: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    // Validate required fields
    if (!body.code || !body.discount_type || body.discount_value === undefined) {
      return NextResponse.json(
        { ok: false, error: 'Code, discount type, and discount value are required' },
        { status: 400 }
      );
    }

    // Validate discount type
    if (!['percentage', 'fixed'].includes(body.discount_type)) {
      return NextResponse.json(
        { ok: false, error: 'Discount type must be "percentage" or "fixed"' },
        { status: 400 }
      );
    }

    // Validate discount value
    const discountValue = parseFloat(body.discount_value);
    if (isNaN(discountValue) || discountValue < 0) {
      return NextResponse.json(
        { ok: false, error: 'Discount value must be a positive number' },
        { status: 400 }
      );
    }

    if (body.discount_type === 'percentage' && discountValue > 100) {
      return NextResponse.json(
        { ok: false, error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const { data: existingCode } = await supabase
      .from('discount_codes')
      .select('id')
      .eq('code', body.code.toUpperCase().trim())
      .single();

    if (existingCode) {
      return NextResponse.json(
        { ok: false, error: 'Discount code already exists' },
        { status: 400 }
      );
    }

    // Create discount code
    const { data, error } = await supabase
      .from('discount_codes')
      .insert({
        code: body.code.toUpperCase().trim(),
        description: body.description || null,
        discount_type: body.discount_type,
        discount_value: discountValue,
        min_purchase_amount: parseFloat(body.min_purchase_amount) || 0,
        max_discount_amount: body.max_discount_amount ? parseFloat(body.max_discount_amount) : null,
        valid_from: body.valid_from || new Date().toISOString().split('T')[0],
        valid_until: body.valid_until || null,
        usage_limit: body.usage_limit ? parseInt(body.usage_limit) : null,
        is_active: body.is_active !== undefined ? body.is_active : true,
        applicable_services: body.applicable_services || null,
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating discount code:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to create discount code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      code: data,
      message: 'Discount code created successfully',
    });
  } catch (error: any) {
    console.error('Error in discount codes POST API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

