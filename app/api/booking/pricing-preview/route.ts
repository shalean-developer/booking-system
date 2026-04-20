import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServiceClient, getServerAuthUser } from '@/lib/supabase-server';
import { resolveCustomerIdForPricing } from '@/lib/booking-server-pricing';
import { fetchQuickCleanSettings } from '@/lib/quick-clean-settings';
import { buildPricingPreviewResponse } from '@/lib/pricing/final-pricing';
import {
  safeCalculatePricing,
  validatePricingPreviewInput,
} from '@/lib/pricing/pricing-preview-safe';

export const dynamic = 'force-dynamic';

/**
 * Read-only server pricing preview — same authoritative path as checkout (`computeAuthoritativeBookingPricing`).
 * Always returns HTTP 200 with `{ success, data?, error?, ok?, ... }` so clients never rely on status codes
 * for validation or transient failures. Does not perform team/availability checks.
 */
export async function POST(req: Request) {
  try {
    let raw: unknown = null;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, ok: false, error: 'Invalid JSON body' },
        { status: 200 }
      );
    }

    const body =
      raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

    const normalized = validatePricingPreviewInput(body);
    const quickCleanSettings = await fetchQuickCleanSettings(createServiceClient());

    const authPv = await getServerAuthUser();
    const pricingCustomerId = await resolveCustomerIdForPricing(supabase, {
      bodyCustomerId: typeof body.customer_id === 'string' ? body.customer_id : null,
      authUserId: authPv?.id ?? null,
    });

    if (pricingCustomerId) {
      normalized.customer_id = pricingCustomerId;
    }

    const result = await safeCalculatePricing(supabase, normalized, quickCleanSettings);

    if (result.success) {
      const legacy = buildPricingPreviewResponse(result.serverCart.finalPrice);
      console.info('[pricing-preview]', {
        outcome: 'ok',
        service: normalized.service,
        price_zar: result.data.total,
      });
      return NextResponse.json(
        {
          success: true,
          ok: true,
          data: result.data,
          ...legacy,
        },
        { status: 200 }
      );
    }

    console.warn('[pricing-preview]', {
      outcome: 'fail',
      service: normalized.service,
      error: result.error,
    });

    return NextResponse.json(
      {
        success: false,
        ok: false,
        error: result.error,
      },
      { status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Pricing unavailable';
    console.error('[pricing-preview] unexpected', e);
    return NextResponse.json(
      { success: false, ok: false, error: msg },
      { status: 200 }
    );
  }
}
