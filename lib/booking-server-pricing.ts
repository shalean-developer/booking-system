import type { SupabaseClient } from '@supabase/supabase-js';
import { getBookingFormData } from '@/lib/booking-form-data-server';
import {
  type BookingPriceResult,
  type CalculateBookingPriceInput,
} from '@/lib/pricing';
import { calculateFinalBookingPrice, type FinalPriceResult } from '@/lib/pricing/final-pricing';
import type { BookingState } from '@/types/booking';
import type { PricingMode } from '@/lib/pricing-mode';
import { aggregateExtraQuantitiesByName } from '@/lib/booking-pricing-input';
import { fetchSurgeDemandCounts } from '@/lib/pricing/surge-demand-server';
import type { SurgeDemandInput } from '@/lib/pricing/surge';
import { fetchForecastBookingsScalarForSurge } from '@/lib/pricing/forecast-demand-server';
import { fetchQuickCleanSettings } from '@/lib/quick-clean-settings';
import {
  countSuccessfulBookingsByEmail,
  fetchPromoForBooking,
} from '@/lib/discount-booking-server';
import { getFinalDynamicMultiplier } from '@/lib/pricing/final-dynamic-pricing';
import type { AppliedAdminRule } from '@/lib/pricing/admin-pricing-rules-apply';
import { getAppliedRuleIds } from '@/lib/pricing/admin-rule-utils';
import { tierDiscountPercent } from '@/lib/loyalty/loyaltyEngine';

/** Prefer explicit `customer_id` from the client; otherwise resolve from authenticated Supabase user. */
export async function resolveCustomerIdForPricing(
  supabase: SupabaseClient,
  opts: { bodyCustomerId?: string | null; authUserId?: string | null },
): Promise<string | null> {
  const raw = opts.bodyCustomerId?.trim();
  if (raw) return raw;
  const uid = opts.authUserId?.trim();
  if (!uid) return null;
  const { data } = await supabase.from('customers').select('id').eq('auth_user_id', uid).maybeSingle();
  return data?.id ?? null;
}

export type BookingBodyForPricing = Pick<
  BookingState,
  | 'service'
  | 'bedrooms'
  | 'bathrooms'
  | 'extraRooms'
  | 'extras'
  | 'extrasQuantities'
  | 'frequency'
  | 'tipAmount'
  | 'discountAmount'
  | 'numberOfCleaners'
  | 'pricingMode'
> & {
  provideEquipment?: boolean;
  /** Carpet V4 — loose rugs (optional; falls back to carpetDetails). */
  rugs?: number;
  /** Carpet V4 — room count (optional). */
  carpets?: number;
  carpetDetails?: CalculateBookingPriceInput['carpetDetails'];
  date?: string | null;
  time?: string | null;
  address?: { suburb?: string; city?: string };
  discountCode?: string | null;
  /** Promo / discount code (alias: promo_code on some APIs). */
  promo_code?: string | null;
  customerEmail?: string | null;
  customer_id?: string | null;
  /** Loyalty points to redeem (1 pt = R1); validated server-side. */
  use_points?: number;
};

/**
 * Async resolution of surge/promo/customer context, then **only** `calculateFinalBookingPrice` for totals.
 */
export async function computeAuthoritativeBookingPricing(
  _supabase: SupabaseClient,
  body: BookingBodyForPricing
): Promise<{
  /** Final charge in ZAR (includes tip / line discount as in `calculateFinalBookingPrice`). */
  price_zar: number;
  total_amount_cents: number;
  coreTotalZar: number;
  /** Always 0 — platform fee removed (V5). */
  serviceFeeZar: number;
  frequencyDiscountZar: number;
  basePriceZar: number;
  extrasTotalZar: number;
  calc: BookingPriceResult;
  /** V5 authoritative snapshot — `price_zar` / `total_amount_cents` are the charged amount. */
  finalPrice: FinalPriceResult;
}> {
  const form = await getBookingFormData();
  const pricing = form.pricing;
  if (!pricing) {
    throw new Error('Pricing configuration unavailable');
  }

  const catalog = form.extras.all;
  const extrasQuantities = aggregateExtraQuantitiesByName(
    body.extras || [],
    body.extrasQuantities,
    catalog
  );
  const extrasNames = Object.keys(extrasQuantities);

  let surge: SurgeDemandInput | undefined;
  let forecast_surge: { enabled: boolean; forecastBookings: number | null } | undefined;
  if (
    (body.service === 'Standard' || body.service === 'Airbnb') &&
    body.date &&
    body.time
  ) {
    try {
      const [counts, qc] = await Promise.all([
        fetchSurgeDemandCounts(_supabase, { date: body.date }),
        fetchQuickCleanSettings(_supabase),
      ]);
      surge = {
        date: body.date,
        time_slot: body.time,
        area: [body.address?.suburb, body.address?.city].filter(Boolean).join(', ') || undefined,
        available_cleaners: counts.available_cleaners,
        active_bookings: counts.active_bookings,
      };
      if (qc.enableForecastSurge) {
        const fb = await fetchForecastBookingsScalarForSurge(_supabase);
        forecast_surge = { enabled: true, forecastBookings: fb };
      }
    } catch (e) {
      console.warn('[surge] fetchSurgeDemandCounts failed', e);
    }
  }

  let dynamic_signals: { demand_score: number; supply_score: number } | undefined;
  let admin_dynamic_pricing:
    | {
        rule_ids: string[];
        admin_rules_applied?: AppliedAdminRule[];
        multiplier: number;
        base_dynamic_multiplier?: number;
        effective_multiplier?: number;
        multiplier_delta?: number;
        limits_zar?: { min: number | null; max: number | null };
      }
    | undefined;
  if ((body.service === 'Standard' || body.service === 'Airbnb') && body.date) {
    try {
      const areaLabel =
        body.address?.suburb?.trim() ||
        body.address?.city?.trim() ||
        surge?.area?.trim() ||
        undefined;
      const timeHm = body.time?.trim() || '10:00';
      const fd = await getFinalDynamicMultiplier({
        date: body.date,
        time: timeHm,
        area: areaLabel,
        serviceType: body.service,
      });
      dynamic_signals = { demand_score: fd.demand_score, supply_score: fd.supply_score };
      admin_dynamic_pricing = {
        rule_ids: getAppliedRuleIds(fd.admin_rule_applied as unknown[]),
        admin_rules_applied: fd.admin_rule_applied,
        multiplier: fd.finalMultiplier,
        base_dynamic_multiplier: fd.base_dynamic_multiplier,
        effective_multiplier: fd.effective_multiplier,
        multiplier_delta: fd.multiplier_delta,
        limits_zar: fd.limits_zar,
      };
    } catch (e) {
      console.warn('[dynamic-pricing] getFinalDynamicMultiplier', e);
    }
  }

  const code = body.discountCode?.trim() || body.promo_code?.trim() || '';
  const promo =
    body.service === 'Standard' || body.service === 'Airbnb'
      ? await fetchPromoForBooking(_supabase, code || null)
      : null;

  let priorPaid: number | null = null;
  if (body.customerEmail?.trim() && (body.service === 'Standard' || body.service === 'Airbnb')) {
    priorPaid = await countSuccessfulBookingsByEmail(_supabase, body.customerEmail);
  }

  let custRow: {
    id: string;
    rewards_points: number;
    referred_by_customer_id: string | null;
    user_tier?: string | null;
  } | null = null;
  if (body.service === 'Standard' || body.service === 'Airbnb') {
    if (body.customer_id) {
      const { data } = await _supabase
        .from('customers')
        .select('id, rewards_points, referred_by_customer_id, user_tier')
        .eq('id', body.customer_id)
        .maybeSingle();
      custRow = data ?? null;
    } else if (body.customerEmail?.trim()) {
      const { data } = await _supabase
        .from('customers')
        .select('id, rewards_points, referred_by_customer_id, user_tier')
        .ilike('email', body.customerEmail.trim())
        .maybeSingle();
      custRow = data ?? null;
    }
  }

  const tier_discount_percent = custRow
    ? tierDiscountPercent(custRow.user_tier)
    : 0;

  const usePts = Math.max(0, Math.floor(Number(body.use_points) || 0));
  const referral_first_booking_eligible =
    (body.service === 'Standard' || body.service === 'Airbnb') &&
    !!custRow?.referred_by_customer_id &&
    priorPaid !== null &&
    priorPaid === 0;

  const tip = body.tipAmount || 0;
  const discount = body.discountAmount || 0;

  const input: CalculateBookingPriceInput = {
    service: body.service,
    bedrooms: body.bedrooms ?? 0,
    bathrooms: body.bathrooms ?? 0,
    extraRooms: body.extraRooms ?? 0,
    extras: extrasNames,
    extrasQuantities,
    carpetDetails: body.carpetDetails ?? null,
    rugs: body.rugs,
    carpets: body.carpets,
    provideEquipment: body.provideEquipment ?? false,
    equipmentChargeOverride: form.equipment?.charge,
    numberOfCleaners: body.numberOfCleaners,
    pricingMode: body.pricingMode,
    tipAmountZar: tip,
    lineDiscountZar: discount,
    surge,
    ...(body.service === 'Standard' || body.service === 'Airbnb'
      ? {
          unified_discount: {
            promo,
            user:
              priorPaid !== null ? { is_first_booking: priorPaid === 0 } : {},
            now: new Date(),
          },
          referral: { first_booking_eligible: referral_first_booking_eligible },
          ...(forecast_surge ? { forecast_surge } : {}),
          ...(dynamic_signals ? { dynamic_signals } : {}),
          ...(admin_dynamic_pricing ? { admin_dynamic_pricing } : {}),
          ...(usePts > 0 || custRow
            ? {
                loyalty: {
                  use_points: usePts,
                  balance_points: Math.max(
                    0,
                    Math.floor(Number(custRow?.rewards_points) || 0)
                  ),
                },
              }
            : {}),
          ...(tier_discount_percent > 0 ? { tier_discount_percent } : {}),
        }
      : {}),
  };

  const freq = body.frequency || 'one-time';
  const finalPrice = calculateFinalBookingPrice(pricing, input, freq);
  if (!finalPrice || finalPrice.total_amount_cents <= 0) {
    throw new Error('INVALID_PRICE');
  }
  const calc = finalPrice.breakdown.cart;

  return {
    price_zar: finalPrice.price_zar,
    total_amount_cents: finalPrice.total_amount_cents,
    coreTotalZar: calc.total,
    serviceFeeZar: 0,
    frequencyDiscountZar: calc.frequencyDiscount,
    basePriceZar: calc.breakdown.base,
    extrasTotalZar: calc.breakdown.extrasTotal,
    calc,
    finalPrice,
  };
}
