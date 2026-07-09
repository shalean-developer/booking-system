import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/supabase-server';
import { clearPricingCache } from '@/lib/pricing-db';
import { loadPricingEngineConfig } from '@/lib/pricing/config';
import { createServiceClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }
    const supabase = createServiceClient();
    const config = await loadPricingEngineConfig(supabase);
    return NextResponse.json({ ok: true, config }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to load config';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * Bumps cache so workers pick up DB changes immediately; version hash shifts on next GET
 * when `pricing_config` / related rows differ.
 */
export async function POST() {
  try {
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }
    clearPricingCache();
    const supabase = createServiceClient();
    const config = await loadPricingEngineConfig(supabase);
    return NextResponse.json({ ok: true, config }, { status: 200 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to refresh config';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
