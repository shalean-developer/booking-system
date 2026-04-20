import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { BookingBodyForPricing } from '@/lib/booking-server-pricing';
import { computeAuthoritativeBookingPricing } from '@/lib/booking-server-pricing';

export const PRICING_INTEGRITY_VERSION = '2026-04-22.integrity.v2';
export const PRICING_INTEGRITY_TTL_MINUTES = 20;

type BookingPricingPipelineInput = Partial<BookingBodyForPricing> & {
  email?: string;
  promo_code?: string;
  discountCode?: string;
  customer_id?: string;
  use_points?: number;
};

export type PricingIntegrityResult = {
  serverCart: Awaited<ReturnType<typeof computeAuthoritativeBookingPricing>>;
  pricingSnapshot: Record<string, unknown>;
  pricingHash: string;
  pricingVersion: string;
};

function toStableJson(value: unknown): string {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) return input.map(normalize);
    if (input && typeof input === 'object') {
      const entries = Object.entries(input as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, normalize(v)] as const);
      return Object.fromEntries(entries);
    }
    return input;
  };
  return JSON.stringify(normalize(value));
}

type PricingLockClaims = {
  pricing_hash: string;
  total_amount_cents: number;
  pricing_version: string;
  pricing_expires_at: string;
  service: string;
  date: string;
  time: string;
};

function getPricingLockSecret(): string | null {
  const key = process.env.PRICING_INTEGRITY_SIGNING_KEY?.trim();
  if (key) return key;
  return null;
}

function toBase64Url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(input: string): Buffer {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  return Buffer.from(padded, 'base64');
}

export function createPricingLockToken(claims: PricingLockClaims): string | null {
  const secret = getPricingLockSecret();
  if (!secret) return null;
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'PRC' }));
  const payload = toBase64Url(toStableJson(claims));
  const data = `${header}.${payload}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest();
  return `${data}.${toBase64Url(sig)}`;
}

export function verifyPricingLockToken(
  token: string,
  expected: { service: string; date: string; time: string },
): PricingLockClaims | null {
  const secret = getPricingLockSecret();
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  if (!header || !payload || !signature) return null;
  const data = `${header}.${payload}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(data).digest();
  const gotSig = fromBase64Url(signature);
  if (expectedSig.length !== gotSig.length) return null;
  if (!crypto.timingSafeEqual(expectedSig, gotSig)) return null;
  try {
    const claims = JSON.parse(fromBase64Url(payload).toString('utf8')) as PricingLockClaims;
    if (
      !claims ||
      claims.service !== expected.service ||
      claims.date !== expected.date ||
      claims.time !== expected.time
    ) {
      return null;
    }
    if (new Date(claims.pricing_expires_at).getTime() < Date.now()) return null;
    if (!claims.pricing_hash || !claims.pricing_version) return null;
    if (!Number.isFinite(claims.total_amount_cents) || claims.total_amount_cents <= 0) return null;
    return claims;
  } catch {
    return null;
  }
}

function toPricingBody(input: BookingPricingPipelineInput): BookingBodyForPricing {
  return {
    service: input.service!,
    bedrooms: input.bedrooms ?? 1,
    bathrooms: input.bathrooms ?? 0,
    extraRooms: input.extraRooms,
    extras: input.extras ?? [],
    extrasQuantities: input.extrasQuantities ?? {},
    frequency: input.frequency || 'one-time',
    tipAmount: input.tipAmount || 0,
    discountAmount: input.discountAmount || 0,
    numberOfCleaners: input.numberOfCleaners,
    pricingMode: input.pricingMode,
    provideEquipment: input.provideEquipment,
    carpetDetails: input.carpetDetails,
    rugs: input.rugs,
    carpets: input.carpets,
    date: input.date,
    time: input.time,
    address: input.address,
    discountCode: input.discountCode,
    promo_code: input.promo_code,
    customerEmail: input.email,
    customer_id: input.customer_id,
    use_points: input.use_points,
  };
}

function buildPricingSnapshot(
  input: BookingPricingPipelineInput,
  serverCart: Awaited<ReturnType<typeof computeAuthoritativeBookingPricing>>,
): Record<string, unknown> {
  const unified = serverCart.calc.unifiedPricing;
  return {
    pricing_version: PRICING_INTEGRITY_VERSION,
    inputs: {
      service: input.service,
      bedrooms: input.bedrooms,
      bathrooms: input.bathrooms,
      extraRooms: input.extraRooms,
      extras: input.extras ?? [],
      extrasQuantities: input.extrasQuantities ?? {},
      frequency: input.frequency || 'one-time',
      numberOfCleaners: input.numberOfCleaners ?? 1,
      pricingMode: input.pricingMode ?? null,
      provideEquipment: Boolean(input.provideEquipment),
      date: input.date ?? null,
      time: input.time ?? null,
      address: input.address ?? null,
      discountCode: input.discountCode ?? null,
      promo_code: input.promo_code ?? null,
      use_points: input.use_points ?? 0,
    },
    breakdown: {
      cart: {
        total: serverCart.calc.total,
        base: serverCart.calc.breakdown.base,
        extrasTotal: serverCart.calc.breakdown.extrasTotal,
        equipmentCharge: serverCart.calc.breakdown.equipmentCharge,
        discount: input.discountAmount ?? 0,
        frequencyDiscount: serverCart.calc.frequencyDiscount,
        tip: input.tipAmount ?? 0,
      },
      unified: unified
        ? {
            base_price_zar: unified.base_price_zar,
            extras_price_zar: unified.extras_price_zar,
            final_price_zar: unified.final_price_zar,
            discount_amount_zar: unified.discount_amount_zar,
            surge_amount_zar: unified.surge_amount_zar,
            duration: unified.duration,
            team_size: unified.team_size,
            loyalty_points_used: unified.loyalty_points_used,
          }
        : null,
      final_breakdown: {
        unified: serverCart.finalPrice.breakdown.unified,
        adjustments: serverCart.finalPrice.breakdown.adjustments,
      },
    },
    output: {
      price_zar: serverCart.price_zar,
      total_amount_cents: serverCart.total_amount_cents,
      base_price_zar: serverCart.basePriceZar,
      extras_total_zar: serverCart.extrasTotalZar,
      frequency_discount_zar: serverCart.frequencyDiscountZar,
    },
  };
}

export function buildPricingExpiresAt(base = new Date()): string {
  return new Date(base.getTime() + PRICING_INTEGRITY_TTL_MINUTES * 60 * 1000).toISOString();
}

export async function runPricingIntegrityPipeline(
  supabase: SupabaseClient,
  input: BookingPricingPipelineInput,
): Promise<PricingIntegrityResult> {
  const serverCart = await computeAuthoritativeBookingPricing(supabase, toPricingBody(input));
  const pricingSnapshot = buildPricingSnapshot(input, serverCart);
  const pricingHash = crypto.createHash('sha256').update(toStableJson(pricingSnapshot)).digest('hex');
  return {
    serverCart,
    pricingSnapshot,
    pricingHash,
    pricingVersion: PRICING_INTEGRITY_VERSION,
  };
}

export async function logPricingIntegrityDiscrepancy(
  supabase: SupabaseClient,
  payload: {
    route: string;
    booking_id?: string | null;
    client_total?: number | null;
    server_total: number;
    client_hash?: string | null;
    server_hash: string;
    reason: string;
  },
): Promise<void> {
  try {
    await supabase.from('pricing_integrity_events').insert({
      route: payload.route,
      booking_id: payload.booking_id ?? null,
      client_total: payload.client_total ?? null,
      server_total: payload.server_total,
      client_hash: payload.client_hash ?? null,
      server_hash: payload.server_hash,
      reason: payload.reason,
    });
  } catch (e) {
    console.warn('[pricing-integrity] failed to log discrepancy', e);
  }
}
