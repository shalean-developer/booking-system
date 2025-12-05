import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// POST: Validate a discount code and calculate discount amount
export async function POST(request: NextRequest) {
  try {
    let supabase;
    try {
      supabase = await createClient();
    } catch (clientError) {
      console.error('Error creating Supabase client:', clientError);
      return NextResponse.json(
        { ok: false, error: 'Database connection error' },
        { status: 500 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { ok: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { code, service_type, subtotal } = body;

    if (!code || !subtotal) {
      return NextResponse.json(
        { ok: false, error: 'Code and subtotal are required' },
        { status: 400 }
      );
    }

    const normalizedCode = code.toUpperCase().trim();
    const today = new Date().toISOString().split('T')[0];

    // Fetch discount code
    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .single();

    if (error) {
      // Check if it's a "not found" error or a table doesn't exist error
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.error('Discount codes table may not exist. Please run the database migration.');
        return NextResponse.json(
          { ok: false, error: 'Discount code system not configured. Please contact support.' },
          { status: 503 }
        );
      }
      console.error('Error fetching discount code:', error);
      return NextResponse.json(
        { ok: false, error: 'Invalid discount code' },
        { status: 404 }
      );
    }

    if (!discountCode) {
      return NextResponse.json(
        { ok: false, error: 'Invalid discount code' },
        { status: 404 }
      );
    }

    // Check if code is valid (date range)
    if (discountCode.valid_from > today) {
      return NextResponse.json(
        { ok: false, error: 'Discount code is not yet valid' },
        { status: 400 }
      );
    }

    if (discountCode.valid_until && discountCode.valid_until < today) {
      return NextResponse.json(
        { ok: false, error: 'Discount code has expired' },
        { status: 400 }
      );
    }

    // Check usage limit
    if (discountCode.usage_limit && discountCode.usage_count >= discountCode.usage_limit) {
      return NextResponse.json(
        { ok: false, error: 'Discount code has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check minimum purchase amount
    if (discountCode.min_purchase_amount && subtotal < discountCode.min_purchase_amount) {
      return NextResponse.json(
        { 
          ok: false, 
          error: `Minimum purchase amount of R${discountCode.min_purchase_amount} required` 
        },
        { status: 400 }
      );
    }

    // Check if code applies to this service type
    if (discountCode.applicable_services && 
        discountCode.applicable_services.length > 0 &&
        service_type &&
        !discountCode.applicable_services.includes(service_type)) {
      return NextResponse.json(
        { ok: false, error: 'Discount code does not apply to this service type' },
        { status: 400 }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountCode.discount_type === 'percentage') {
      discountAmount = (subtotal * discountCode.discount_value) / 100;
      // Apply max discount limit if set
      if (discountCode.max_discount_amount && discountAmount > discountCode.max_discount_amount) {
        discountAmount = discountCode.max_discount_amount;
      }
    } else {
      // Fixed amount
      discountAmount = discountCode.discount_value;
      // Don't exceed subtotal
      if (discountAmount > subtotal) {
        discountAmount = subtotal;
      }
    }

    return NextResponse.json({
      ok: true,
      discount: {
        code: discountCode.code,
        description: discountCode.description,
        discount_type: discountCode.discount_type,
        discount_value: discountCode.discount_value,
        discount_amount: Math.round(discountAmount * 100) / 100, // Round to 2 decimal places
        final_amount: Math.round((subtotal - discountAmount) * 100) / 100,
      },
    });
  } catch (error: any) {
    console.error('Error validating discount code:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

