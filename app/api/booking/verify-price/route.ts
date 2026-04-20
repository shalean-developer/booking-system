import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServiceClient, getServerAuthUser } from '@/lib/supabase-server';
import { resolveCustomerIdForPricing } from '@/lib/booking-server-pricing';
import { fetchQuickCleanSettings } from '@/lib/quick-clean-settings';
import { validatePricingPreviewInput } from '@/lib/pricing/pricing-preview-safe';
import {
  buildPricingExpiresAt,
  createPricingLockToken,
  runPricingIntegrityPipeline,
} from '@/lib/pricing/pricing-integrity-pipeline';

export const dynamic = 'force-dynamic';

function toNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

/**
 * Price verification endpoint for checkout finalization.
 * Backend remains authoritative and can compare a client-provided total.
 */
export async function POST(req: Request) {
  try {
    let raw: unknown = null;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, ok: false, valid: false, error: 'Invalid JSON body' },
        { status: 200 }
      );
    }

    const body =
      raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
    const normalized = validatePricingPreviewInput(body);
    await fetchQuickCleanSettings(createServiceClient());

    const auth = await getServerAuthUser();
    const pricingCustomerId = await resolveCustomerIdForPricing(supabase, {
      bodyCustomerId: typeof body.customer_id === 'string' ? body.customer_id : null,
      authUserId: auth?.id ?? null,
    });
    if (pricingCustomerId) {
      normalized.customer_id = pricingCustomerId;
    }

    let integrity: Awaited<ReturnType<typeof runPricingIntegrityPipeline>>;
    try {
      integrity = await runPricingIntegrityPipeline(supabase, {
        service: normalized.service ?? undefined,
        bedrooms: normalized.bedrooms,
        bathrooms: normalized.bathrooms,
        extraRooms: normalized.extraRooms,
        extras: normalized.extras,
        extrasQuantities: normalized.extrasQuantities,
        frequency: normalized.frequency,
        tipAmount: normalized.tipAmount,
        discountAmount: normalized.discountAmount,
        numberOfCleaners: normalized.teamSize,
        pricingMode: normalized.pricingMode,
        provideEquipment: normalized.provideEquipment,
        carpetDetails: normalized.carpetDetails,
        rugs: normalized.rugs,
        carpets: normalized.carpets,
        date: normalized.date,
        time: normalized.time,
        address: normalized.address,
        discountCode: normalized.discountCode,
        promo_code: normalized.promo_code,
        email: normalized.customerEmail,
        customer_id: normalized.customer_id,
        use_points: normalized.use_points,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Pricing unavailable';
      return NextResponse.json(
        {
          success: false,
          ok: false,
          valid: false,
          error: msg,
        },
        { status: 200 }
      );
    }

    const clientTotal = toNumber(body.client_total ?? body.totalAmount ?? body.total);
    const serverTotal = integrity.serverCart.price_zar;
    const serverCents = integrity.serverCart.total_amount_cents;
    const clientCents = clientTotal != null ? Math.round(clientTotal * 100) : null;
    const valid = clientCents == null ? true : clientCents === serverCents;
    const clientHash = typeof body.pricing_hash === 'string' ? body.pricing_hash : null;
    const hashMatches = clientHash == null ? true : clientHash === integrity.pricingHash;
    const pricingExpiresAt = buildPricingExpiresAt();
    const pricingLockToken = createPricingLockToken({
      pricing_hash: integrity.pricingHash,
      total_amount_cents: serverCents,
      pricing_version: integrity.pricingVersion,
      pricing_expires_at: pricingExpiresAt,
      service: String(normalized.service ?? ''),
      date: String(normalized.date ?? ''),
      time: String(normalized.time ?? ''),
    });

    return NextResponse.json(
      {
        success: true,
        ok: true,
        valid: valid && hashMatches,
        server_total: serverTotal,
        client_total: clientTotal,
        difference_reason: valid
          ? (hashMatches ? null : 'pricing_hash_mismatch')
          : 'authoritative_recalculation_changed_total',
        price_zar: serverTotal,
        total_amount_cents: serverCents,
        breakdown: integrity.serverCart.finalPrice.breakdown,
        pricing_snapshot: integrity.pricingSnapshot,
        pricing_hash: integrity.pricingHash,
        pricing_version: integrity.pricingVersion,
        pricing_expires_at: pricingExpiresAt,
        pricing_lock_token: pricingLockToken,
      },
      { status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Pricing unavailable';
    return NextResponse.json(
      { success: false, ok: false, valid: false, error: msg },
      { status: 200 }
    );
  }
}
