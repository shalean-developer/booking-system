import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

type Entity = 'cleanerPricing' | 'bathroomRules' | 'extraRoomRules' | 'promoCodes';
type Action = 'upsert' | 'delete';

export async function GET() {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceClient();

    const [
      cleanerPricingRes,
      bathroomRulesRes,
      extraRoomRulesRes,
      promoCodesRes,
    ] = await Promise.all([
      supabase
        .from('cleaner_pricing_config')
        .select('id, cleaner_type, base_rate, additional_cleaner_rate, label, description, is_active')
        .order('created_at', { ascending: true }),
      supabase
        .from('bathroom_pricing_rules')
        .select('id, label, price, description, is_active, sort_order')
        .order('sort_order', { ascending: true }),
      supabase
        .from('extra_room_pricing_rules')
        .select('id, name, price, description, icon, is_active, sort_order')
        .order('sort_order', { ascending: true }),
      supabase
        .from('discount_codes')
        .select(
          'id, code, description, discount_type, discount_value, min_purchase_amount, usage_limit, usage_count, is_active, valid_until, applicable_services'
        )
        .order('created_at', { ascending: false }),
    ]);

    return NextResponse.json({
      ok: true,
      cleanerPricing: cleanerPricingRes.data ?? [],
      bathroomRules: bathroomRulesRes.data ?? [],
      extraRoomRules: extraRoomRulesRes.data ?? [],
      promoCodes: promoCodesRes.data ?? [],
      errors: {
        cleanerPricing: cleanerPricingRes.error?.message ?? null,
        bathroomRules: bathroomRulesRes.error?.message ?? null,
        extraRoomRules: extraRoomRulesRes.error?.message ?? null,
        promoCodes: promoCodesRes.error?.message ?? null,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const supabase = createServiceClient();
    const body = await request.json();
    const entity = body?.entity as Entity;
    const action = body?.action as Action;
    const payload = body?.payload ?? {};

    if (!entity || !action) {
      return NextResponse.json({ ok: false, error: 'entity and action are required' }, { status: 400 });
    }

    if (entity === 'cleanerPricing') {
      if (action !== 'upsert') {
        return NextResponse.json({ ok: false, error: 'Unsupported action for cleanerPricing' }, { status: 400 });
      }
      const updatePayload = {
        cleaner_type: payload.type,
        base_rate: Number(payload.baseRate ?? 0),
        additional_cleaner_rate: Number(payload.additionalCleanerRate ?? 0),
        label: payload.label ?? '',
        description: payload.description ?? null,
        is_active: payload.active !== false,
        updated_at: new Date().toISOString(),
      };
      if (payload.id) {
        const { error } = await supabase.from('cleaner_pricing_config').update(updatePayload).eq('id', payload.id);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      } else {
        const { error } = await supabase.from('cleaner_pricing_config').insert(updatePayload);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (entity === 'bathroomRules') {
      if (action === 'delete') {
        const { error } = await supabase.from('bathroom_pricing_rules').delete().eq('id', payload.id);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }
      const upsertPayload = {
        label: payload.label ?? '',
        price: Number(payload.price ?? 0),
        description: payload.description ?? null,
        is_active: payload.active !== false,
        sort_order: Number(payload.sortOrder ?? 0),
        updated_at: new Date().toISOString(),
      };
      if (payload.id) {
        const { error } = await supabase.from('bathroom_pricing_rules').update(upsertPayload).eq('id', payload.id);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      } else {
        const { error } = await supabase.from('bathroom_pricing_rules').insert(upsertPayload);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (entity === 'extraRoomRules') {
      if (action === 'delete') {
        const { error } = await supabase.from('extra_room_pricing_rules').delete().eq('id', payload.id);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }
      const upsertPayload = {
        name: payload.name ?? '',
        price: Number(payload.price ?? 0),
        description: payload.description ?? null,
        icon: payload.icon ?? null,
        is_active: payload.active !== false,
        sort_order: Number(payload.sortOrder ?? 0),
        updated_at: new Date().toISOString(),
      };
      if (payload.id) {
        const { error } = await supabase.from('extra_room_pricing_rules').update(upsertPayload).eq('id', payload.id);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      } else {
        const { error } = await supabase.from('extra_room_pricing_rules').insert(upsertPayload);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    if (entity === 'promoCodes') {
      if (action === 'delete') {
        const { error } = await supabase.from('discount_codes').delete().eq('id', payload.id);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
      }
      const upsertPayload = {
        code: String(payload.code ?? '').toUpperCase().trim(),
        description: payload.description ?? null,
        discount_type: payload.discountType ?? 'percentage',
        discount_value: Number(payload.discountValue ?? 0),
        min_purchase_amount: Number(payload.minOrderValue ?? 0),
        usage_limit: payload.maxUses == null ? null : Number(payload.maxUses),
        is_active: payload.active !== false,
        valid_until: payload.expiresAt ?? null,
        applicable_services: Array.isArray(payload.appliesTo) ? payload.appliesTo : null,
      };
      if (payload.id) {
        const { error } = await supabase.from('discount_codes').update(upsertPayload).eq('id', payload.id);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      } else {
        const { error } = await supabase.from('discount_codes').insert(upsertPayload);
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Unknown entity' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

