import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin access first
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Create Supabase client
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id'); // For fetching a single rule
    
    // If ID is provided, fetch single rule (used by edit page)
    if (id) {
      const { data: pricingConfig, error } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('id', id)
        .eq('price_type', 'base')
        .single();

      if (error || !pricingConfig) {
        return NextResponse.json(
          { ok: false, error: 'Pricing rule not found' },
          { status: 404 }
        );
      }

      // Fetch service name
      const { data: service } = await supabase
        .from('services')
        .select('display_name')
        .eq('service_type', pricingConfig.service_type)
        .single();

      const rule = {
        id: pricingConfig.id,
        service_id: pricingConfig.service_type || '',
        service_name: service?.display_name || pricingConfig.service_type || 'Unknown Service',
        multiplier: 1.0,
        region: null,
        is_active: pricingConfig.is_active ?? true,
        created_at: pricingConfig.created_at,
      };

      return NextResponse.json({
        ok: true,
        rules: [rule],
      });
    }

    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch services first to get display names
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('service_type, display_name');

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      // Continue without service names if fetch fails
    }

    const servicesMap = new Map(
      (services || []).map((s: any) => [s.service_type, s.display_name])
    );

    // Fetch pricing config data (base prices only)
    let query = supabase
      .from('pricing_config')
      .select('*')
      .eq('price_type', 'base') // Only get base prices for pricing rules
      .not('service_type', 'is', null) // Only services, not extras
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter if provided
    if (search) {
      query = query.or(
        `service_type.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    const { data: pricingConfig, error } = await query;

    if (error) {
      console.error('Error fetching pricing config:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch pricing data' },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = supabase
      .from('pricing_config')
      .select('id', { count: 'exact', head: true })
      .eq('price_type', 'base')
      .not('service_type', 'is', null);

    if (search) {
      countQuery = countQuery.or(
        `service_type.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error fetching pricing count:', countError);
    }

    // Transform pricing_config data to match the expected PricingRule format
    const rules = (pricingConfig || []).map((record: any) => ({
      id: record.id,
      service_id: record.service_type || '',
      service_name: servicesMap.get(record.service_type) || record.service_type || 'Unknown Service',
      multiplier: 1.0, // Default multiplier (pricing_config stores actual prices, not multipliers)
      region: null, // pricing_config doesn't have region field
      is_active: record.is_active ?? true,
      created_at: record.created_at,
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      ok: true,
      rules,
      total: count || 0,
      totalPages,
    });
  } catch (error: any) {
    console.error('Error in pricing GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    if (!body.service_id) {
      return NextResponse.json(
        { ok: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }

    // Get base price for the service to calculate new price with multiplier
    const { data: basePrice } = await supabase
      .from('pricing_config')
      .select('price')
      .eq('service_type', body.service_id)
      .eq('price_type', 'base')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Create new pricing config with multiplier applied
    // Note: Since pricing_config doesn't have multiplier field,
    // we'll store it in notes and create a new price record
    const multiplier = body.multiplier || 1.0;
    const newPrice = basePrice ? parseFloat(basePrice.price) * multiplier : 0;

    const { data, error } = await supabase
      .from('pricing_config')
      .insert({
        service_type: body.service_id,
        price_type: 'base',
        price: newPrice,
        is_active: body.is_active ?? true,
        effective_date: new Date().toISOString().split('T')[0],
        notes: JSON.stringify({
          multiplier: multiplier,
          region: body.region || null,
          is_pricing_rule: true,
        }),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing rule:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to create pricing rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      rule: data,
      message: 'Pricing rule created successfully',
    });
  } catch (error: any) {
    console.error('Error in pricing POST API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

