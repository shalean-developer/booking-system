import type { ServiceType } from '@/types/booking';
import type { PricingMode } from '@/lib/pricing-mode';
import type { Promo } from '@/lib/pricing/discounts';
import type { AppliedAdminRule } from '@/lib/pricing/admin-pricing-rules-apply';
import type { UnifiedSchedule } from '@/lib/pricing/types';
import type { SurgeDemandInput } from '@/lib/pricing/surge';
import type { SurgeBreakdown } from '@/lib/pricing/surgeEngine';

export type BookingPriceFrequency = 'one-time' | 'weekly' | 'bi-weekly' | 'monthly';

export type CalculateBookingPriceInput = {
  service: ServiceType | null;
  bedrooms: number;
  bathrooms: number;
  extraRooms?: number;
  extras: string[];
  extrasQuantities?: Record<string, number>;
  carpetDetails?: {
    hasFittedCarpets: boolean;
    hasLooseCarpets: boolean;
    numberOfRooms: number;
    numberOfLooseCarpets: number;
    roomStatus: 'empty' | 'hasProperty';
  } | null;
  /** Carpet V4: loose rugs count (overrides `carpetDetails.numberOfLooseCarpets` when set). */
  rugs?: number;
  /** Carpet V4: carpet room count (overrides `carpetDetails.numberOfRooms` / `bedrooms` when set). */
  carpets?: number;
  provideEquipment?: boolean;
  equipmentChargeOverride?: number;
  numberOfCleaners?: number;
  pricingMode?: PricingMode;
  surge?: SurgeDemandInput;
  forecast_surge?: {
    enabled: boolean;
    forecastBookings: number | null;
  };
  schedule?: UnifiedSchedule;
  unified_discount?: {
    promo?: Promo | null;
    user?: { is_first_booking?: boolean };
    now?: Date;
  };
  loyalty?: { use_points: number; balance_points: number };
  referral?: { first_booking_eligible: boolean };
  /** Customer tier labour discount (Standard/Airbnb), from `customers.user_tier`. */
  tier_discount_percent?: number;
  /** Tip (ZAR) added to the final charge after catalogue/unified totals. */
  tipAmountZar?: number;
  /**
   * Extra line discount (ZAR) applied after cart labour total for non-Standard services
   * (matches legacy `discountAmount` on booking bodies).
   */
  lineDiscountZar?: number;
  /** V6.1 — server-fetched demand/supply; when unset, unified pricing uses neutral scores. */
  dynamic_signals?: { demand_score: number; supply_score: number };
  /**
   * V6.2 — server-resolved admin layer on dynamic labour multiplier + optional ZAR caps on catalogue total.
   * Set only from authoritative server pricing (`getFinalDynamicMultiplier`).
   */
  admin_dynamic_pricing?: {
    /** Stacked rules that affected multiplier or caps */
    rule_ids: string[];
    multiplier: number;
    base_dynamic_multiplier?: number;
    /** Admin stack vs base dynamic multiplier */
    effective_multiplier?: number;
    multiplier_delta?: number;
    admin_rules_applied?: AppliedAdminRule[];
    limits_zar?: { min: number | null; max: number | null };
  };
};

export type UnifiedPricingSnapshot = {
  table_price_zar: number;
  extra_room_price_zar: number;
  extras_price_zar: number;
  base_price_zar: number;
  dynamic_multiplier: number;
  demand_score: number;
  supply_score: number;
  price_after_dynamic_zar: number;
  forecast_multiplier: number;
  forecast_adjustment_zar: number;
  price_after_forecast_zar: number;
  surge_multiplier: number;
  surge_amount_zar: number;
  surge_breakdown?: SurgeBreakdown;
  /** Customer-facing line only — safe for checkout UI */
  surge_pricing_note?: string | null;
  price_zar: number;
  discount_amount_zar: number;
  final_price_zar: number;
  promo_code: string | null;
  discount_type: string | null;
  hours: number;
  duration: number;
  team_size: number;
  demand_ratio?: number;
  referral_discount_zar?: number;
  tier_discount_zar?: number;
  loyalty_points_used?: number;
  loyalty_discount_zar?: number;
  total_labor_zar?: number;
  /** V6.2 — applied admin rules (stacked), order + type */
  admin_rule_applied?: AppliedAdminRule[];
  /** V6.2 — demand/supply layer multiplier before admin override */
  base_dynamic_multiplier?: number;
  /** V6.2 — after admin stack vs base */
  effective_multiplier?: number;
  /** V6.2 — multiplier change from admin rules before global clamp */
  multiplier_delta?: number;
};

export type BookingPriceResult = {
  subtotal: number;
  serviceFee: number;
  frequencyDiscount: number;
  frequencyDiscountPercent: number;
  total: number;
  minimumApplied: number;
  breakdown: {
    base: number;
    bedrooms: number;
    bathrooms: number;
    extraRooms: number;
    carpetFitted: number;
    carpetLoose: number;
    carpetOccupiedFee: number;
    extrasTotal: number;
    equipmentCharge: number;
    laborSubtotalOneCleaner: number;
    numberOfCleaners: number;
  };
  unifiedPricing?: UnifiedPricingSnapshot;
};
