import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isAdmin } from '@/lib/supabase-server';
import {
  computeAuthoritativeBookingPricing,
  type BookingBodyForPricing,
} from '@/lib/booking-server-pricing';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const isAdminUser = await isAdmin();
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (raw === null || typeof raw !== 'object') {
    return NextResponse.json({ ok: false, error: 'Body must be an object' }, { status: 400 });
  }

  const { isSimulation, ...rest } = raw as Record<string, unknown> & {
    isSimulation?: boolean;
  };

  if (isSimulation === true) {
    console.log('[admin/pricing/simulate] simulation request');
  }

  try {
    const pricing = await computeAuthoritativeBookingPricing(
      supabase,
      rest as BookingBodyForPricing,
    );

    return NextResponse.json({
      ok: true,
      price_zar: pricing.price_zar,
      total_amount_cents: pricing.total_amount_cents,
      breakdown: pricing.finalPrice.breakdown,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
