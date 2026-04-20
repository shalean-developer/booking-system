/**
 * Unified Pricing V5.2 — **single** money path: `calculateFinalBookingPrice` only.
 * `calculateBookingV4` → `calculateBookingUnified` (Standard/Airbnb) → labour/surge/promo; V4 table engine for all services.
 */

import type { PricingData } from '@/lib/pricing-db';
import { calculateBookingUnified } from '@/lib/pricing/calculateBookingUnified';
import { roundPrice } from '@/lib/pricing/rounding';
import {
  applyReferralFirstBookingDiscount,
  validateAndClampPointsRedemption,
} from '@/lib/loyalty/points';
import { UnifiedPricingValidationError } from '@/lib/pricing/calculateBookingUnified';
import type {
  BookingPriceFrequency,
  BookingPriceResult,
  CalculateBookingPriceInput,
  UnifiedPricingSnapshot,
} from '@/lib/pricing/booking-price-types';
import type { AppliedAdminRule } from '@/lib/pricing/admin-pricing-rules-apply';
import { getAppliedRuleIds, normalizeAppliedAdminRules } from '@/lib/pricing/admin-rule-utils';
import type { UnifiedBookingResult } from '@/lib/pricing/types';
import {
  BookingV4ValidationError,
  calculateBookingV4,
  type CalculateBookingV4Result,
} from '@/lib/pricing/v4/calculateBookingV4';

/** V5.2 explicit floor (ZAR) — overrides DB `minimumBookingFeeZar` for this pipeline. */
export const MIN_PRICE_ZAR_V52 = 150;

export type FinalUnifiedSlice = {
  base: number;
  extras: number;
  surge: number;
  discounts: number;
  dynamic_multiplier: number;
  demand_score: number;
  supply_score: number;
  /** V6.2 — stacked admin rules (order + type) */
  admin_rule_applied: AppliedAdminRule[];
  base_dynamic_multiplier: number;
  effective_multiplier?: number;
  multiplier_delta?: number;
};

export type FinalPriceAdjustmentsV52 = {
  referral: number;
  tier: number;
  loyalty: number;
  equipment: number;
  /** Frequency discount amount (ZAR). */
  frequency: number;
  frequency_percent: number;
  min_fee: number;
  /** V6.2 — amount added when catalogue total was below admin min ZAR */
  admin_min_clamp_zar: number;
  /** V6.2 — amount removed when catalogue total was above admin max ZAR */
  admin_max_clamp_zar: number;
};

export type FinalPriceBreakdown = {
  unified: FinalUnifiedSlice;
  adjustments: FinalPriceAdjustmentsV52;
  cart: BookingPriceResult;
};

export type FinalPriceResult = {
  price_zar: number;
  total_amount_cents: number;
  breakdown: FinalPriceBreakdown;
};

export type PricingV52Snapshot = {
  price_zar: number;
  total_amount_cents: number;
  unified: {
    base: number;
    extras: number;
    surge: number;
    discounts: number;
    dynamic_multiplier: number;
    demand_score: number;
    supply_score: number;
    admin_rule_applied: AppliedAdminRule[];
    base_dynamic_multiplier: number;
    effective_multiplier?: number;
    multiplier_delta?: number;
  };
  adjustments: FinalPriceAdjustmentsV52;
};

function roundZar(n: number): number {
  return Math.round(n);
}

function emptyCart(): BookingPriceResult {
  return {
    subtotal: 0,
    serviceFee: 0,
    frequencyDiscount: 0,
    frequencyDiscountPercent: 0,
    total: 0,
    minimumApplied: 0,
    breakdown: {
      base: 0,
      bedrooms: 0,
      bathrooms: 0,
      extraRooms: 0,
      carpetFitted: 0,
      carpetLoose: 0,
      carpetOccupiedFee: 0,
      extrasTotal: 0,
      equipmentCharge: 0,
      laborSubtotalOneCleaner: 0,
      numberOfCleaners: 1,
    },
  };
}

function unifiedSliceFromResult(
  uni: UnifiedBookingResult,
  referralZar: number,
  loyaltyZar: number,
  tierZar = 0
): FinalUnifiedSlice {
  const adminRules = normalizeAppliedAdminRules(uni.admin_rule_applied as unknown, undefined);
  return {
    base: uni.base_price_zar,
    extras: uni.extras_price_zar + uni.extra_room_price_zar,
    surge: uni.surge_amount_zar,
    discounts: uni.discount_amount_zar + referralZar + loyaltyZar + tierZar,
    dynamic_multiplier: uni.dynamic_multiplier,
    demand_score: uni.demand_score,
    supply_score: uni.supply_score,
    admin_rule_applied: adminRules,
    base_dynamic_multiplier: uni.base_dynamic_multiplier ?? uni.dynamic_multiplier,
    ...(uni.effective_multiplier != null ? { effective_multiplier: uni.effective_multiplier } : {}),
    ...(uni.multiplier_delta != null ? { multiplier_delta: uni.multiplier_delta } : {}),
  };
}

function emptyUnifiedSlice(): FinalUnifiedSlice {
  return {
    base: 0,
    extras: 0,
    surge: 0,
    discounts: 0,
    dynamic_multiplier: 1,
    demand_score: 0.5,
    supply_score: 1,
    admin_rule_applied: [],
    base_dynamic_multiplier: 1,
    effective_multiplier: 1,
    multiplier_delta: 0,
  };
}

/** Final amount to charge: labour line ± line discount (non-unified) + tip. Cart totals stay labour-only. */
function applyCheckoutTipAndLineDiscount(
  input: CalculateBookingPriceInput,
  labourTotalZar: number,
  breakdown: FinalPriceBreakdown
): FinalPriceResult {
  const tip = input.tipAmountZar ?? 0;
  const lineDisc = input.lineDiscountZar ?? 0;
  const isUnified = input.service === 'Standard' || input.service === 'Airbnb';
  const chargedZar =
    Math.round(
      (isUnified
        ? labourTotalZar + tip
        : Math.max(0, labourTotalZar - lineDisc) + tip) * 100
    ) / 100;
  return {
    price_zar: chargedZar,
    total_amount_cents: Math.round(chargedZar * 100),
    breakdown,
  };
}

function unifiedSliceFromV4(v4: CalculateBookingV4Result): FinalUnifiedSlice {
  return {
    base: v4.cleaning_subtotal_zar,
    extras: 0,
    surge: 0,
    discounts: 0,
    dynamic_multiplier: 1,
    demand_score: 0.5,
    supply_score: 1,
    admin_rule_applied: [],
    base_dynamic_multiplier: 1,
    effective_multiplier: 1,
    multiplier_delta: 0,
  };
}

function buildV4UnifiedSnapshot(
  v4: CalculateBookingV4Result,
  total_labor_zar: number
): UnifiedPricingSnapshot {
  return {
    table_price_zar: v4.table_price_zar,
    extra_room_price_zar: v4.extra_room_price_zar,
    extras_price_zar: v4.extras_price_zar,
    base_price_zar: v4.cleaning_subtotal_zar,
    dynamic_multiplier: 1,
    demand_score: 0.5,
    supply_score: 1,
    price_after_dynamic_zar: v4.cleaning_subtotal_zar,
    forecast_multiplier: 1,
    forecast_adjustment_zar: 0,
    price_after_forecast_zar: v4.cleaning_subtotal_zar,
    surge_multiplier: 1,
    surge_amount_zar: 0,
    price_zar: v4.cleaning_subtotal_zar,
    discount_amount_zar: 0,
    final_price_zar: v4.cleaning_subtotal_zar,
    promo_code: null,
    discount_type: null,
    referral_discount_zar: 0,
    loyalty_points_used: 0,
    loyalty_discount_zar: 0,
    total_labor_zar,
    hours: v4.hours,
    duration: v4.duration,
    team_size: v4.team_size,
    admin_rule_applied: [],
    base_dynamic_multiplier: 1,
  };
}

function buildUnifiedSnapshot(
  uni: UnifiedBookingResult,
  referral_discount_zar: number,
  loyalty_points_used: number,
  loyalty_discount_zar: number,
  total_labor_zar: number,
  tier_discount_zar = 0
): UnifiedPricingSnapshot {
  return {
    table_price_zar: uni.table_price_zar,
    extra_room_price_zar: uni.extra_room_price_zar,
    extras_price_zar: uni.extras_price_zar,
    base_price_zar: uni.base_price_zar,
    dynamic_multiplier: uni.dynamic_multiplier,
    demand_score: uni.demand_score,
    supply_score: uni.supply_score,
    price_after_dynamic_zar: uni.price_after_dynamic_zar,
    forecast_multiplier: uni.forecast_multiplier,
    forecast_adjustment_zar: uni.forecast_adjustment_zar,
    price_after_forecast_zar: uni.price_after_forecast_zar,
    surge_multiplier: uni.surge_multiplier,
    surge_amount_zar: uni.surge_amount_zar,
    price_zar: uni.price_zar,
    discount_amount_zar: uni.discount_amount_zar,
    final_price_zar: uni.final_price_zar,
    promo_code: uni.promo_code,
    discount_type: uni.discount_type,
    referral_discount_zar,
    tier_discount_zar,
    loyalty_points_used,
    loyalty_discount_zar,
    total_labor_zar,
    hours: uni.hours,
    duration: uni.duration,
    team_size: uni.team_size,
    ...(uni.demand_ratio !== undefined ? { demand_ratio: uni.demand_ratio } : {}),
    ...(uni.surge_breakdown !== undefined ? { surge_breakdown: uni.surge_breakdown } : {}),
    ...(uni.surge_pricing_note != null ? { surge_pricing_note: uni.surge_pricing_note } : {}),
    admin_rule_applied: normalizeAppliedAdminRules(uni.admin_rule_applied as unknown, undefined),
    base_dynamic_multiplier: uni.base_dynamic_multiplier ?? uni.dynamic_multiplier,
    ...(uni.effective_multiplier != null ? { effective_multiplier: uni.effective_multiplier } : {}),
    ...(uni.multiplier_delta != null ? { multiplier_delta: uni.multiplier_delta } : {}),
  };
}

/**
 * Authoritative ZAR total — the only function that combines unified labour with adjustments.
 */
export function calculateFinalBookingPrice(
  pricing: PricingData,
  input: CalculateBookingPriceInput,
  frequency: BookingPriceFrequency = 'one-time'
): FinalPriceResult {
  const empty: FinalPriceResult = {
    price_zar: 0,
    total_amount_cents: 0,
    breakdown: {
      unified: emptyUnifiedSlice(),
      adjustments: {
        referral: 0,
        tier: 0,
        loyalty: 0,
        equipment: 0,
        frequency: 0,
        frequency_percent: 0,
        min_fee: 0,
        admin_min_clamp_zar: 0,
        admin_max_clamp_zar: 0,
      },
      cart: emptyCart(),
    },
  };

  if (!input.service) return empty;

  const servicePricing = pricing.services[input.service];
  if (!servicePricing) return empty;

  const equipmentChargeDefault = pricing.equipmentChargeZar ?? 0;
  const discountPercent = frequency !== 'one-time' ? pricing.frequencyDiscounts[frequency] ?? 0 : 0;

  const adjustments: FinalPriceAdjustmentsV52 = {
    referral: 0,
    tier: 0,
    loyalty: 0,
    equipment: 0,
    frequency: 0,
    frequency_percent: discountPercent,
    min_fee: 0,
    admin_min_clamp_zar: 0,
    admin_max_clamp_zar: 0,
  };

  // --- Standard & Airbnb ---
  if (input.service === 'Standard' || input.service === 'Airbnb') {
    const hasExtraCleaner = (input.extras ?? []).some(
      (id) => id === 'extra_cleaner' || id.includes('extra_cleaner')
    );
    const mode = input.pricingMode === 'basic' ? 'quick' : 'premium';
    const uni = calculateBookingUnified({
      service_type: input.service === 'Standard' ? 'standard' : 'airbnb',
      pricing_mode: mode,
      bedrooms: Math.max(1, input.bedrooms || 1),
      bathrooms: Math.max(0, input.bathrooms || 0),
      extra_rooms: Math.max(0, input.extraRooms ?? 0),
      extras: input.extras ?? [],
      extrasQuantities: input.extrasQuantities,
      has_extra_cleaner: mode === 'premium' && hasExtraCleaner,
      surge: input.surge,
      schedule:
        input.schedule ??
        (input.surge ? { date: input.surge.date, time_slot: input.surge.time_slot } : undefined),
      unified_discount: input.unified_discount,
      forecast_surge: input.forecast_surge,
      dynamic_signals: input.dynamic_signals,
      ...(input.admin_dynamic_pricing
        ? {
            admin_dynamic_pricing: {
              rule_ids: input.admin_dynamic_pricing.rule_ids,
              multiplier: input.admin_dynamic_pricing.multiplier,
              base_dynamic_multiplier: input.admin_dynamic_pricing.base_dynamic_multiplier,
              ...(input.admin_dynamic_pricing.effective_multiplier != null
                ? { effective_multiplier: input.admin_dynamic_pricing.effective_multiplier }
                : {}),
              ...(input.admin_dynamic_pricing.multiplier_delta != null
                ? { multiplier_delta: input.admin_dynamic_pricing.multiplier_delta }
                : {}),
              ...(input.admin_dynamic_pricing.admin_rules_applied
                ? { admin_rules_applied: input.admin_dynamic_pricing.admin_rules_applied }
                : {}),
            },
          }
        : {}),
    });

    let labourZar = uni.final_price_zar;
    let referral_discount_zar = 0;
    if (input.referral?.first_booking_eligible && !uni.promo_code) {
      const ref = applyReferralFirstBookingDiscount(labourZar);
      referral_discount_zar = ref.discount_zar;
      adjustments.referral = referral_discount_zar;
      labourZar = ref.labor_after_zar;
    }

    let tier_discount_zar = 0;
    const tierPct = input.tier_discount_percent ?? 0;
    if (tierPct > 0 && tierPct <= 100) {
      tier_discount_zar = roundPrice(labourZar * (tierPct / 100));
      adjustments.tier = tier_discount_zar;
      labourZar = roundPrice(Math.max(0, labourZar - tier_discount_zar));
    }

    let loyalty_points_used = 0;
    let loyalty_discount_zar = 0;
    if (input.loyalty && input.loyalty.use_points > 0) {
      const red = validateAndClampPointsRedemption({
        use_points: input.loyalty.use_points,
        balance_points: input.loyalty.balance_points,
        max_discount_zar: labourZar,
      });
      if (!red.ok) {
        throw new UnifiedPricingValidationError(red.error);
      }
      loyalty_points_used = red.points_used;
      loyalty_discount_zar = red.discount_zar;
      adjustments.loyalty = loyalty_discount_zar;
      labourZar = roundPrice(Math.max(0, labourZar - loyalty_discount_zar));
    }

    let equipmentCharge = 0;
    if (input.provideEquipment) {
      equipmentCharge = input.equipmentChargeOverride ?? equipmentChargeDefault;
    }
    adjustments.equipment = equipmentCharge;

    const scaled = labourZar + equipmentCharge;
    const frequencyDiscountZar = roundPrice((scaled * discountPercent) / 100);
    adjustments.frequency = frequencyDiscountZar;

    let priceZar = roundPrice(scaled - frequencyDiscountZar);

    if (priceZar < MIN_PRICE_ZAR_V52) {
      adjustments.min_fee = MIN_PRICE_ZAR_V52 - priceZar;
      priceZar = MIN_PRICE_ZAR_V52;
    }

    const adminLim = input.admin_dynamic_pricing?.limits_zar;
    if (adminLim) {
      if (adminLim.min != null && priceZar < adminLim.min) {
        adjustments.admin_min_clamp_zar = roundPrice(adminLim.min - priceZar);
        priceZar = adminLim.min;
      }
      if (adminLim.max != null && priceZar > adminLim.max) {
        adjustments.admin_max_clamp_zar = roundPrice(priceZar - adminLim.max);
        priceZar = adminLim.max;
      }
    }

    if (priceZar < 0) priceZar = 0;

    const total_labor_zar = labourZar;
    const numberOfCleaners =
      input.pricingMode === 'basic'
        ? 1
        : Math.max(uni.team_size, Math.round(input.numberOfCleaners ?? uni.team_size));

    const cart: BookingPriceResult = {
      subtotal: roundPrice(scaled),
      serviceFee: 0,
      frequencyDiscount: frequencyDiscountZar,
      frequencyDiscountPercent: discountPercent,
      total: priceZar,
      minimumApplied: adjustments.min_fee,
      breakdown: {
        base: uni.table_price_zar,
        bedrooms: 0,
        bathrooms: 0,
        extraRooms: uni.extra_room_price_zar,
        carpetFitted: 0,
        carpetLoose: 0,
        carpetOccupiedFee: 0,
        extrasTotal: uni.extras_price_zar,
        equipmentCharge: roundZar(equipmentCharge),
        laborSubtotalOneCleaner: total_labor_zar,
        numberOfCleaners,
      },
      unifiedPricing: buildUnifiedSnapshot(
        uni,
        referral_discount_zar,
        loyalty_points_used,
        loyalty_discount_zar,
        total_labor_zar,
        tier_discount_zar
      ),
    };

    const priceRounded = Math.round(priceZar * 100) / 100;
    return applyCheckoutTipAndLineDiscount(input, priceRounded, {
      unified: unifiedSliceFromResult(
        uni,
        referral_discount_zar,
        loyalty_discount_zar,
        tier_discount_zar
      ),
      adjustments: { ...adjustments },
      cart,
    });
  }

  // --- Deep / Move In/Out / Carpet — V4 table engine only (no catalogue labour) ---
  if (input.service === 'Deep' || input.service === 'Move In/Out' || input.service === 'Carpet') {
    let v4: CalculateBookingV4Result;
    try {
      v4 = calculateBookingV4({
        service_type:
          input.service === 'Deep' ? 'deep' : input.service === 'Move In/Out' ? 'move' : 'carpet',
        bedrooms: Math.max(1, input.bedrooms || 1),
        bathrooms: input.service === 'Carpet' ? 0 : Math.max(0, input.bathrooms || 0),
        extra_rooms: 0,
        carpets:
          input.service === 'Carpet'
            ? input.carpets ?? input.carpetDetails?.numberOfRooms ?? input.bedrooms
            : undefined,
        rugs:
          input.service === 'Carpet'
            ? input.rugs ?? input.carpetDetails?.numberOfLooseCarpets ?? 0
            : undefined,
        carpetDetails: input.service === 'Carpet' ? input.carpetDetails : null,
        extras: input.extras ?? [],
        extrasQuantities: input.extrasQuantities,
      });
    } catch (e) {
      if (e instanceof BookingV4ValidationError) {
        throw new UnifiedPricingValidationError(e.message);
      }
      throw e;
    }

    let labourZar = v4.cleaning_subtotal_zar;

    let equipmentCharge = 0;
    if (input.provideEquipment) {
      equipmentCharge = input.equipmentChargeOverride ?? equipmentChargeDefault;
    }
    adjustments.equipment = equipmentCharge;

    const scaled = labourZar + equipmentCharge;
    const frequencyDiscountZar = roundPrice((scaled * discountPercent) / 100);
    adjustments.frequency = frequencyDiscountZar;

    let priceZar = roundPrice(scaled - frequencyDiscountZar);

    if (priceZar < MIN_PRICE_ZAR_V52) {
      adjustments.min_fee = MIN_PRICE_ZAR_V52 - priceZar;
      priceZar = MIN_PRICE_ZAR_V52;
    }

    const adminLim = input.admin_dynamic_pricing?.limits_zar;
    if (adminLim) {
      if (adminLim.min != null && priceZar < adminLim.min) {
        adjustments.admin_min_clamp_zar = roundPrice(adminLim.min - priceZar);
        priceZar = adminLim.min;
      }
      if (adminLim.max != null && priceZar > adminLim.max) {
        adjustments.admin_max_clamp_zar = roundPrice(priceZar - adminLim.max);
        priceZar = adminLim.max;
      }
    }

    if (priceZar < 0) priceZar = 0;

    const numberOfCleaners = Math.max(
      v4.team_size,
      Math.round(input.numberOfCleaners ?? v4.team_size)
    );

    const total_labor_zar = labourZar;
    const cart: BookingPriceResult = {
      subtotal: roundPrice(scaled),
      serviceFee: 0,
      frequencyDiscount: frequencyDiscountZar,
      frequencyDiscountPercent: discountPercent,
      total: priceZar,
      minimumApplied: adjustments.min_fee,
      breakdown: {
        base: v4.table_price_zar,
        bedrooms: 0,
        bathrooms: 0,
        extraRooms: v4.extra_room_price_zar,
        carpetFitted: 0,
        carpetLoose: 0,
        carpetOccupiedFee: 0,
        extrasTotal: v4.extras_price_zar,
        equipmentCharge: roundZar(equipmentCharge),
        laborSubtotalOneCleaner: total_labor_zar,
        numberOfCleaners,
      },
      unifiedPricing: buildV4UnifiedSnapshot(v4, total_labor_zar),
    };

    const priceRounded = Math.round(priceZar * 100) / 100;
    return applyCheckoutTipAndLineDiscount(input, priceRounded, {
      unified: unifiedSliceFromV4(v4),
      adjustments: { ...adjustments },
      cart,
    });
  }

  return empty;
}

export function buildFinalPriceSnapshotPayload(final: FinalPriceResult): PricingV52Snapshot {
  const b = final.breakdown;
  const u = b.unified ?? emptyUnifiedSlice();
  const adminNorm = normalizeAppliedAdminRules(u.admin_rule_applied as unknown, undefined);
  return {
    price_zar: final.price_zar,
    total_amount_cents: final.total_amount_cents,
    unified: {
      base: u.base,
      extras: u.extras,
      surge: u.surge,
      discounts: u.discounts,
      dynamic_multiplier: u.dynamic_multiplier,
      demand_score: u.demand_score,
      supply_score: u.supply_score,
      admin_rule_applied: adminNorm,
      base_dynamic_multiplier: u.base_dynamic_multiplier,
      ...(u.effective_multiplier != null ? { effective_multiplier: u.effective_multiplier } : {}),
      ...(u.multiplier_delta != null ? { multiplier_delta: u.multiplier_delta } : {}),
    },
    adjustments: b.adjustments,
  };
}

/** Read-only API payload — identical shape to `calculateFinalBookingPrice` output fields. */
export function buildPricingPreviewResponse(final: FinalPriceResult) {
  const u = final.breakdown.unified;
  return {
    price_zar: final.price_zar,
    total_amount_cents: final.total_amount_cents,
    breakdown: final.breakdown,
    /** Flat id list for clients that only need rule keys (full trace stays on `breakdown.unified`). */
    admin_rule_ids: getAppliedRuleIds(u.admin_rule_applied as unknown[]),
  };
}
