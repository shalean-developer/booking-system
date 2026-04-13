import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { computeCheckoutPricing } from '@/lib/booking-checkout-pricing';
import { computeServerPreSurgeTotalZar } from '@/lib/booking-server-pricing';

export const dynamic = 'force-dynamic';

/**
 * Returns final ZAR total (with surge) before opening Paystack, so the client charges the correct amount.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, service, preSurgeTotal, selected_team } = body;

    if (!date || !service || typeof preSurgeTotal !== 'number') {
      return NextResponse.json(
        { ok: false, error: 'date, service, and preSurgeTotal are required' },
        { status: 400 }
      );
    }

    let preSurgeTotalZar = preSurgeTotal;
    if (
      typeof body.bedrooms === 'number' &&
      typeof body.bathrooms === 'number' &&
      Array.isArray(body.extras)
    ) {
      const serverCart = await computeServerPreSurgeTotalZar(supabase, {
        service,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        extraRooms: typeof body.extraRooms === 'number' ? body.extraRooms : 0,
        extras: body.extras,
        extrasQuantities: body.extrasQuantities,
        frequency: body.frequency || 'one-time',
        tipAmount: typeof body.tipAmount === 'number' ? body.tipAmount : 0,
        discountAmount: typeof body.discountAmount === 'number' ? body.discountAmount : 0,
        numberOfCleaners: typeof body.numberOfCleaners === 'number' ? body.numberOfCleaners : 1,
        provideEquipment: Boolean(body.provideEquipment),
        carpetDetails: body.carpetDetails ?? undefined,
      });
      preSurgeTotalZar = serverCart.preSurgeTotalZar;
    }

    const pricing = await computeCheckoutPricing(supabase, {
      date,
      service,
      preSurgeTotalZar,
      selected_team,
    });

    if (!pricing.ok) {
      return NextResponse.json({ ok: false, error: pricing.error }, { status: pricing.status });
    }

    return NextResponse.json({
      ok: true,
      preSurgeTotalZar: pricing.preSurgeTotalZar,
      finalTotalZar: pricing.finalTotalZar,
      surgeApplied: pricing.surgePricingApplied,
      surgeAmountZar: pricing.surgeAmountZar,
    });
  } catch (e) {
    console.error('pricing-preview:', e);
    return NextResponse.json({ ok: false, error: 'Failed to compute pricing' }, { status: 500 });
  }
}
