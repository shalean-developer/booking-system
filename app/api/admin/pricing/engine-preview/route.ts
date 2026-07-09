import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { supabase } from '@/lib/supabase';
import { validatePricingPreviewInput } from '@/lib/pricing/pricing-preview-safe';
import { loadPricingEngineConfig } from '@/lib/pricing/config';
import { computeAuthoritativeBookingPricing } from '@/lib/booking-server-pricing';
import { calculateBookingPrice } from '@/lib/pricing/engine';
import type { PricingInput } from '@/lib/pricing/engine';
import type { ServiceType } from '@/types/booking';

export const dynamic = 'force-dynamic';

const SERVICE_SET = new Set<ServiceType>(['Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet']);

/**
 * Admin-only: runs the same authoritative pricing path as checkout for calculator previews.
 */
export async function POST(req: Request) {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    let raw: unknown = null;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const body =
      raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

    const normalized = validatePricingPreviewInput(body);
    if (!normalized.service || !SERVICE_SET.has(normalized.service)) {
      return NextResponse.json(
        { ok: false, error: 'Unsupported or missing service for engine preview' },
        { status: 400 },
      );
    }

    const svc = createServiceClient();
    const [config, authoritative] = await Promise.all([
      loadPricingEngineConfig(svc),
      computeAuthoritativeBookingPricing(supabase, {
        service: normalized.service,
        bedrooms: normalized.bedrooms,
        bathrooms: normalized.bathrooms,
        extraRooms: normalized.extraRooms,
        extras: normalized.extras,
        extrasQuantities: normalized.extrasQuantities ?? {},
        frequency: normalized.frequency,
        tipAmount: normalized.tipAmount,
        discountAmount: normalized.discountAmount,
        numberOfCleaners: normalized.teamSize,
        pricingMode: normalized.pricingMode,
        provideEquipment: normalized.provideEquipment,
        carpetDetails: normalized.carpetDetails ?? undefined,
        rugs: normalized.rugs,
        carpets: normalized.carpets,
        date: normalized.date,
        time: normalized.time,
        address: normalized.address,
        discountCode: normalized.discountCode,
        promo_code: normalized.promo_code,
        customerEmail: normalized.customerEmail,
        customer_id: normalized.customer_id,
        use_points: normalized.use_points,
      }),
    ]);

    const pricingInput: PricingInput = {
      serviceType: String(normalized.service),
      bedrooms: normalized.bedrooms,
      bathrooms: normalized.bathrooms,
      extras: normalized.extras,
      date: normalized.date,
      time: normalized.time,
      location: [normalized.address?.suburb, normalized.address?.city].filter(Boolean).join(', ') || undefined,
    };

    const result = calculateBookingPrice(pricingInput, config, authoritative);

    return NextResponse.json({ ok: true, result, config }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Engine preview failed';
    console.error('[engine-preview]', e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
