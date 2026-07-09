import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createServiceClient, getServerAuthUser } from '@/lib/supabase-server';
import { resolveCustomerIdForPricing } from '@/lib/booking-server-pricing';
import { validatePricingPreviewInput } from '@/lib/pricing/pricing-preview-safe';
import {
  buildSnapshotExpiresAt,
  createPricingSnapshot,
} from '@/lib/pricing/snapshot';
import { loadPricingEngineConfig } from '@/lib/pricing/config';
import {
  createPricingLockToken,
  runPricingIntegrityPipeline,
} from '@/lib/pricing/pricing-integrity-pipeline';
import type { PricingInput } from '@/lib/pricing/engine';

export const dynamic = 'force-dynamic';

/**
 * Locks a single authoritative pricing snapshot for the dashboard / booking flows.
 * Same computation path as checkout (`computeAuthoritativeBookingPricing`).
 */
export async function POST(req: Request) {
  try {
    let raw: unknown = null;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const body =
      raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};

    const normalized = validatePricingPreviewInput(body);

    const authPv = await getServerAuthUser();
    const pricingCustomerId = await resolveCustomerIdForPricing(supabase, {
      bodyCustomerId: typeof body.customer_id === 'string' ? body.customer_id : null,
      authUserId: authPv?.id ?? null,
    });

    if (pricingCustomerId) {
      normalized.customer_id = pricingCustomerId;
    }

    const svc = createServiceClient();
    const [config, integrity] = await Promise.all([
      loadPricingEngineConfig(svc),
      runPricingIntegrityPipeline(supabase, {
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
      }),
    ]);

    const pricingInput: PricingInput = {
      serviceType: String(normalized.service ?? ''),
      bedrooms: normalized.bedrooms,
      bathrooms: normalized.bathrooms,
      extras: normalized.extras,
      date: normalized.date,
      time: normalized.time,
      location: [normalized.address?.suburb, normalized.address?.city].filter(Boolean).join(', ') || undefined,
    };

    const snapshot = createPricingSnapshot(pricingInput, config, integrity.serverCart);
    const pricingExpiresAt = buildSnapshotExpiresAt();
    const pricingLockToken = createPricingLockToken({
      pricing_hash: integrity.pricingHash,
      total_amount_cents: integrity.serverCart.total_amount_cents,
      pricing_version: String(config.version),
      pricing_expires_at: pricingExpiresAt,
      service: String(normalized.service ?? ''),
      date: normalized.date,
      time: normalized.time,
    });
    if (!pricingLockToken) {
      return NextResponse.json(
        { ok: false, error: 'Pricing lock unavailable (set PRICING_INTEGRITY_SIGNING_KEY)' },
        { status: 500 },
      );
    }

    const finalWholeZar = Math.round(Number(integrity.serverCart.price_zar));
    const snapshotJson = {
      engine: snapshot,
      integrity: integrity.pricingSnapshot,
      price_zar: integrity.serverCart.price_zar,
      total_amount_cents: integrity.serverCart.total_amount_cents,
    };

    const { data: saved, error: saveErr } = await svc
      .from('booking_pricing_snapshots')
      .insert({
        pricing_hash: integrity.pricingHash,
        pricing_lock_token: pricingLockToken,
        pricing_version: String(config.version),
        snapshot_json: snapshotJson,
        final_price: finalWholeZar,
        currency: 'ZAR',
        expires_at: pricingExpiresAt,
        user_id: authPv?.id ?? null,
      })
      .select()
      .single();

    if (saveErr || !saved) {
      console.error('[create-snapshot] persist', saveErr);
      const hint =
        process.env.NODE_ENV === 'development' && saveErr?.message
          ? ` (${saveErr.message})`
          : '';
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to persist pricing snapshot${hint}. Apply migration booking_pricing_snapshots if the table is missing.`,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        snapshot: saved,
        pricing_snapshot_id: saved.id,
        /** Engine snapshot shape for UI (same as before). */
        engine_snapshot: snapshot,
        pricing_hash: integrity.pricingHash,
        pricing_snapshot: integrity.pricingSnapshot,
        pricing_lock_token: pricingLockToken,
        pricing_expires_at: pricingExpiresAt,
        pricing_version: String(config.version),
        price_zar: finalWholeZar,
        total_amount_cents: integrity.serverCart.total_amount_cents,
      },
      { status: 200 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Snapshot failed';
    console.error('[create-snapshot]', e);
    const devHint =
      process.env.NODE_ENV === 'development'
        ? ' Check server logs; common causes: missing Supabase migration `booking_pricing_snapshots`, or pricing DB/config unavailable.'
        : '';
    return NextResponse.json({ ok: false, error: msg + devHint }, { status: 500 });
  }
}
