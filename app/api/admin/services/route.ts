import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const jsonHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { 
          status: 403,
          headers: jsonHeaders
        }
      );
    }

    // Use service role client to bypass RLS
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Fetch services
    let query = supabase
      .from('services')
      .select('*', { count: 'exact' })
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,service_type.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: servicesData, error, count } = await query;

    if (error) {
      console.error('[Admin Services API] Error fetching services:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch services' },
        { 
          status: 500,
          headers: jsonHeaders
        }
      );
    }

    // Fetch base prices for all services
    const serviceTypes = (servicesData || []).map((s: any) => s.service_type).filter(Boolean);
    let pricingMap: Record<string, number> = {};
    
    if (serviceTypes.length > 0) {
      const { data: pricingData } = await supabase
        .from('pricing_config')
        .select('service_type, price')
        .in('service_type', serviceTypes)
        .eq('price_type', 'base')
        .eq('is_active', true);

      if (pricingData) {
        pricingData.forEach((p: any) => {
          // Convert Rands to cents
          pricingMap[p.service_type] = Math.round((p.price || 0) * 100);
        });
      }
    }

    // Transform services with pricing
    const transformedServices = (servicesData || []).map((service: any) => ({
      id: service.id,
      name: service.display_name || service.service_type,
      description: service.description || null,
      base_price: pricingMap[service.service_type] || 0,
      is_active: service.is_active ?? true,
      created_at: service.created_at,
    }));

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      ok: true,
      services: transformedServices,
      total,
      totalPages,
    }, {
      headers: jsonHeaders
    });
  } catch (error: any) {
    console.error('[Admin Services API] Error in services GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { 
        status: 500,
        headers: jsonHeaders
      }
    );
  }
}

