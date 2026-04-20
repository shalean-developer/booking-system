/**
 * Production-safe pricing preview: tolerant input normalization, guarded authoritative pricing,
 * and post-checks (floor / anomaly bands) without throwing or non-200 HTTP semantics.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceType } from '@/types/booking';
import type { PricingMode } from '@/lib/pricing-mode';
import {
  computeAuthoritativeBookingPricing,
  type BookingBodyForPricing,
} from '@/lib/booking-server-pricing';
import type { FinalPriceResult } from '@/lib/pricing/final-pricing';
import { validatePricingEngineRequest } from '@/lib/pricing-engine';
import type { QuickCleanSettings } from '@/lib/quick-clean-settings';

/** Aligned with `calculateBookingV4` anomaly band (labour rate on V4 table services). */
const ANOMALY_RATE_MIN_ZAR = 120;
const ANOMALY_RATE_MAX_ZAR = 600;

/** Matches legacy `calculateBookingUnified` low-margin heuristic (ZAR per job-hour). */
const MIN_EFFECTIVE_HOURLY_ZAR = 80;

const MAX_EXTRAS_IDS = 200;

const SERVICE_SET = new Set<ServiceType>(['Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet']);

export type PricingPreviewData = {
  total: number;
  base: number;
  extras: number;
  travel: number;
  margin: number;
};

export type NormalizedPricingPreviewInput = {
  /** Normalized from various keys; used for caps / future dynamic pricing hooks. */
  hours: number;
  extras: string[];
  teamSize: number;
  date: string;
  time: string;
  service: ServiceType | null;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  extrasQuantities: Record<string, number> | undefined;
  frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';
  tipAmount: number;
  discountAmount: number;
  provideEquipment: boolean;
  carpetDetails: BookingBodyForPricing['carpetDetails'];
  rugs: number | undefined;
  carpets: number | undefined;
  pricingMode: PricingMode | undefined;
  /** Engine / extended fields (passed through to authoritative pricing when used). */
  pricingEngineFinalCents: number | undefined;
  pricingTotalHours: number | undefined;
  pricingTeamSize: number | undefined;
  equipmentCostCents: number | undefined;
  extraCleanerFeeCents: number | undefined;
  serviceFee: number | undefined;
  basicPlannedHours: number | undefined;
  scheduleEquipmentPref: string | undefined;
  address: { suburb?: string; city?: string } | undefined;
  discountCode: string | undefined;
  promo_code: string | undefined;
  customerEmail: string | undefined;
  customer_id: string | undefined;
  use_points: number | undefined;
};

function toFiniteNumber(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Surge / dynamic pricing extension point — currently a no-op; wire demand signals or
 * experiments here without changing the API contract.
 */
export function applySurgePricingPlaceholderForPreview<T>(input: T): T {
  return input;
}

/**
 * Safe, permissive normalization — never throws. Missing fields become defaults.
 */
export function validatePricingPreviewInput(body: unknown): NormalizedPricingPreviewInput {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};

  const rawService = b.service;
  let service: ServiceType | null = null;
  if (typeof rawService === 'string') {
    const t = rawService.trim() as ServiceType;
    if (SERVICE_SET.has(t)) service = t;
  }

  const date = typeof b.date === 'string' ? b.date.trim() : '';
  const time =
    typeof b.time === 'string' && b.time.trim() ? b.time.trim() : '10:00';

  let extras: string[] = [];
  if (Array.isArray(b.extras)) {
    extras = b.extras
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_EXTRAS_IDS);
  }

  let extrasQuantities: Record<string, number> | undefined;
  if (b.extrasQuantities && typeof b.extrasQuantities === 'object' && !Array.isArray(b.extrasQuantities)) {
    const o = b.extrasQuantities as Record<string, unknown>;
    extrasQuantities = {};
    for (const [k, v] of Object.entries(o)) {
      const n = toFiniteNumber(v, 0);
      if (n > 0) extrasQuantities[k] = clamp(Math.floor(n), 1, 999);
    }
    if (Object.keys(extrasQuantities).length === 0) extrasQuantities = undefined;
  }

  const teamSize = clamp(Math.max(1, Math.round(toFiniteNumber(b.teamSize ?? b.numberOfCleaners, 1))), 1, 20);

  const hours = clamp(toFiniteNumber(b.hours ?? b.pricingTotalHours, 0), 0, 48);

  const bedrooms = clamp(Math.floor(toFiniteNumber(b.bedrooms, 0)), 0, 50);
  const bathrooms = clamp(Math.floor(toFiniteNumber(b.bathrooms, 0)), 0, 50);
  const extraRooms = clamp(Math.floor(toFiniteNumber(b.extraRooms, 0)), 0, 50);

  const freqRaw = b.frequency;
  const frequency: NormalizedPricingPreviewInput['frequency'] =
    freqRaw === 'weekly' || freqRaw === 'bi-weekly' || freqRaw === 'monthly'
      ? freqRaw
      : 'one-time';

  let carpetDetails: BookingBodyForPricing['carpetDetails'];
  if (b.carpetDetails != null && typeof b.carpetDetails === 'object' && !Array.isArray(b.carpetDetails)) {
    carpetDetails = b.carpetDetails as BookingBodyForPricing['carpetDetails'];
  }

  let pricingMode: PricingMode | undefined;
  const pm = b.pricingMode;
  if (pm === 'basic' || pm === 'premium') pricingMode = pm;

  let address: { suburb?: string; city?: string } | undefined;
  if (b.address && typeof b.address === 'object' && !Array.isArray(b.address)) {
    const a = b.address as Record<string, unknown>;
    address = {
      suburb: typeof a.suburb === 'string' ? a.suburb : undefined,
      city: typeof a.city === 'string' ? a.city : undefined,
    };
  }

  return applySurgePricingPlaceholderForPreview({
    hours,
    extras,
    teamSize,
    date,
    time,
    service,
    bedrooms,
    bathrooms,
    extraRooms,
    extrasQuantities,
    frequency,
    tipAmount: Math.max(0, toFiniteNumber(b.tipAmount, 0)),
    discountAmount: Math.max(0, toFiniteNumber(b.discountAmount, 0)),
    provideEquipment: Boolean(b.provideEquipment),
    carpetDetails,
    rugs: typeof b.rugs === 'number' && Number.isFinite(b.rugs) ? b.rugs : undefined,
    carpets: typeof b.carpets === 'number' && Number.isFinite(b.carpets) ? b.carpets : undefined,
    pricingMode,
    pricingEngineFinalCents:
      b.pricingEngineFinalCents != null && Number.isFinite(Number(b.pricingEngineFinalCents))
        ? Number(b.pricingEngineFinalCents)
        : undefined,
    pricingTotalHours:
      b.pricingTotalHours != null && Number.isFinite(Number(b.pricingTotalHours))
        ? Number(b.pricingTotalHours)
        : undefined,
    pricingTeamSize:
      b.pricingTeamSize != null && Number.isFinite(Number(b.pricingTeamSize))
        ? Number(b.pricingTeamSize)
        : undefined,
    equipmentCostCents:
      b.equipmentCostCents != null && Number.isFinite(Number(b.equipmentCostCents))
        ? Number(b.equipmentCostCents)
        : undefined,
    extraCleanerFeeCents:
      b.extraCleanerFeeCents != null && Number.isFinite(Number(b.extraCleanerFeeCents))
        ? Number(b.extraCleanerFeeCents)
        : undefined,
    serviceFee:
      b.serviceFee != null && Number.isFinite(Number(b.serviceFee)) ? Number(b.serviceFee) : undefined,
    basicPlannedHours:
      b.basicPlannedHours != null && Number.isFinite(Number(b.basicPlannedHours))
        ? Number(b.basicPlannedHours)
        : undefined,
    scheduleEquipmentPref: typeof b.scheduleEquipmentPref === 'string' ? b.scheduleEquipmentPref : undefined,
    address,
    discountCode: typeof b.discountCode === 'string' ? b.discountCode : undefined,
    promo_code: typeof b.promo_code === 'string' ? b.promo_code : undefined,
    customerEmail: typeof b.customerEmail === 'string' ? b.customerEmail : undefined,
    customer_id: typeof b.customer_id === 'string' ? b.customer_id : undefined,
    use_points:
      b.use_points != null && Number.isFinite(Number(b.use_points))
        ? Math.max(0, Math.floor(Number(b.use_points)))
        : undefined,
  });
}

export function canComputeAuthoritativePrice(n: NormalizedPricingPreviewInput): boolean {
  if (!n.service) return false;
  if (!n.date.trim()) return false;
  return true;
}

function deriveMarginPercent(final: FinalPriceResult): number {
  const u = final.breakdown.unified;
  const price = final.price_zar;
  if (!(price > 0)) return 0;
  const catalogue = Math.max(0, u.base + u.extras + u.surge);
  const afterDiscounts = Math.max(0, catalogue - Math.abs(u.discounts));
  return round2(Math.min(100, (afterDiscounts / price) * 100));
}

export function mapFinalPriceToPreviewData(final: FinalPriceResult): PricingPreviewData {
  const u = final.breakdown.unified;
  const adj = final.breakdown.adjustments;
  return {
    total: round2(final.price_zar),
    base: round2(u.base),
    extras: round2(u.extras + adj.equipment),
    travel: round2(u.surge),
    margin: deriveMarginPercent(final),
  };
}

function postValidateComputedPrice(
  final: FinalPriceResult,
  service: ServiceType | null
): { ok: true } | { ok: false; error: string } {
  const p = final.price_zar;
  const cents = final.total_amount_cents;
  if (!Number.isFinite(p) || !(p > 0)) {
    return { ok: false, error: 'Invalid price' };
  }
  if (!Number.isFinite(cents) || cents <= 0) {
    return { ok: false, error: 'Invalid price' };
  }

  const uni = final.breakdown.cart.unifiedPricing;
  if (uni && uni.hours > 0) {
    const effUnified = uni.final_price_zar / uni.hours;
    if (effUnified < MIN_EFFECTIVE_HOURLY_ZAR) {
      return { ok: false, error: 'Pricing below operational floor' };
    }

    const labour = uni.total_labor_zar ?? uni.final_price_zar;
    const rate = labour / uni.hours;
    const v4Style =
      service === 'Deep' || service === 'Move In/Out' || service === 'Carpet';
    if (v4Style && (rate < ANOMALY_RATE_MIN_ZAR || rate > ANOMALY_RATE_MAX_ZAR)) {
      return { ok: false, error: 'Pricing anomaly' };
    }
  }

  return { ok: true };
}

function bookingBodyFromNormalized(n: NormalizedPricingPreviewInput): BookingBodyForPricing {
  return {
    service: n.service!,
    bedrooms: n.bedrooms,
    bathrooms: n.bathrooms,
    extraRooms: n.extraRooms,
    extras: n.extras,
    extrasQuantities: n.extrasQuantities ?? {},
    frequency: n.frequency,
    tipAmount: n.tipAmount,
    discountAmount: n.discountAmount,
    numberOfCleaners: n.teamSize,
    pricingMode: n.pricingMode,
    provideEquipment: n.provideEquipment,
    carpetDetails: n.carpetDetails,
    rugs: n.rugs,
    carpets: n.carpets,
    date: n.date,
    time: n.time,
    address: n.address,
    discountCode: n.discountCode,
    promo_code: n.promo_code,
    customerEmail: n.customerEmail,
    customer_id: n.customer_id,
    use_points: n.use_points,
  };
}

export type SafePricingResult =
  | {
      success: true;
      data: PricingPreviewData;
      serverCart: Awaited<ReturnType<typeof computeAuthoritativeBookingPricing>>;
    }
  | { success: false; error: string };

/**
 * Runs authoritative booking pricing inside a try/catch and applies post-validation
 * (positive totals, anomaly bands, margin floor). Never throws.
 */
/** Alias for callers that prefer the shorter name from the API spec. */
export const validateInput = validatePricingPreviewInput;

export async function safeCalculatePricing(
  supabase: SupabaseClient,
  normalized: NormalizedPricingPreviewInput,
  quickCleanSettings: QuickCleanSettings
): Promise<SafePricingResult> {
  if (!canComputeAuthoritativePrice(normalized)) {
    return { success: false, error: 'Incomplete booking details' };
  }

  const useClientCartWhenEngine =
    normalized.pricingEngineFinalCents != null &&
    Number.isFinite(normalized.pricingEngineFinalCents);
  if (useClientCartWhenEngine) {
    const schedulePref =
      normalized.scheduleEquipmentPref === 'bring' || normalized.scheduleEquipmentPref === 'own'
        ? normalized.scheduleEquipmentPref
        : undefined;
    const engineCheck = validatePricingEngineRequest(
      {
        service: normalized.service,
        pricingEngineFinalCents: normalized.pricingEngineFinalCents,
        pricingTotalHours: normalized.pricingTotalHours,
        pricingTeamSize: normalized.pricingTeamSize ?? normalized.teamSize,
        equipmentCostCents: normalized.equipmentCostCents,
        extraCleanerFeeCents: normalized.extraCleanerFeeCents,
        serviceFee: normalized.serviceFee,
        pricingMode: normalized.pricingMode,
        bedrooms: normalized.bedrooms,
        bathrooms: normalized.bathrooms,
        extraRooms: normalized.extraRooms,
        extras: normalized.extras,
        extrasQuantities: normalized.extrasQuantities,
        basicPlannedHours: normalized.basicPlannedHours ?? null,
        scheduleEquipmentPref: schedulePref,
      },
      quickCleanSettings
    );
    if (!engineCheck.ok) {
      return {
        success: false,
        error: engineCheck.error || 'Pricing engine validation failed',
      };
    }
  }

  const body = bookingBodyFromNormalized(normalized);

  try {
    const serverCart = await computeAuthoritativeBookingPricing(supabase, body);
    const post = postValidateComputedPrice(serverCart.finalPrice, normalized.service);
    if (!post.ok) {
      return { success: false, error: post.error };
    }
    return {
      success: true,
      data: mapFinalPriceToPreviewData(serverCart.finalPrice),
      serverCart,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      error: msg === 'INVALID_PRICE' ? 'Invalid price' : 'Pricing unavailable',
    };
  }
}
