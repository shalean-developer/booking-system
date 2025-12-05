import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Fetch the pricing config record
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
      multiplier: 1.0, // Default multiplier
      region: null,
      is_active: pricingConfig.is_active ?? true,
      created_at: pricingConfig.created_at,
    };

    return NextResponse.json({
      ok: true,
      rule,
    });
  } catch (error: any) {
    console.error('Error in pricing GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const supabase = await createClient();

    // Update the pricing config record
    // Note: Since pricing_config doesn't have multiplier/region fields,
    // we'll update what we can (is_active, notes, etc.)
    const updateData: any = {
      is_active: body.is_active ?? true,
      updated_at: new Date().toISOString(),
    };

    // Store multiplier and region in notes if needed (or create a separate table)
    if (body.multiplier !== undefined || body.region) {
      updateData.notes = JSON.stringify({
        multiplier: body.multiplier || 1.0,
        region: body.region || null,
        ...(body.notes ? JSON.parse(body.notes || '{}') : {}),
      });
    }

    const { data, error } = await supabase
      .from('pricing_config')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing config:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update pricing rule' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      rule: data,
      message: 'Pricing rule updated successfully',
    });
  } catch (error: any) {
    console.error('Error in pricing PATCH API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

