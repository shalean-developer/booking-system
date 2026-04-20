import type { Promo } from '@/lib/pricing/discounts';
import type { SurgeDemandInput } from '@/lib/pricing/surge';
import type { SurgeBreakdown } from '@/lib/pricing/surgeEngine';
import type { AppliedAdminRule } from '@/lib/pricing/admin-pricing-rules-apply';

export type UnifiedServiceType = 'standard' | 'airbnb';

export type UnifiedPricingMode = 'quick' | 'premium';

/** Schedule for auto discounts when `surge` is absent. */
export type UnifiedSchedule = { date: string; time_slot: string };

export type UnifiedDiscountInput = {
  promo?: Promo | null;
  user?: { is_first_booking?: boolean };
  now?: Date;
};

export type UnifiedBookingInput = {
  service_type: UnifiedServiceType;
  pricing_mode: UnifiedPricingMode;
  bedrooms: number;
  bathrooms: number;
  extra_rooms: number;
  /** Slug ids as used by the booking wizard */
  extras: string[];
  extrasQuantities?: Record<string, number> | null;
  /** Premium only: second cleaner halves wall-clock duration */
  has_extra_cleaner: boolean;
  /** When set, applies demand/time/weekend/same-day surge to the unified cleaning total. */
  surge?: SurgeDemandInput;
  /** Date/time for off-peak auto discount; defaults from `surge` when present. */
  schedule?: UnifiedSchedule;
  /** Promo + auto discounts apply after surge on the labor line. */
  unified_discount?: UnifiedDiscountInput;
  /** Predictive layer: applied to base labour before real-time `surge` (server-resolved). */
  forecast_surge?: {
    enabled: boolean;
    forecastBookings: number | null;
  };
  /** V6.1 — from DB on server; omitted on client uses neutral mid-band scores. */
  dynamic_signals?: { demand_score: number; supply_score: number };
  /** V6.2 — server-only resolution; applied inside unified labour multiplier step. */
  admin_dynamic_pricing?: {
    rule_ids: string[];
    multiplier: number;
    base_dynamic_multiplier?: number;
    effective_multiplier?: number;
    multiplier_delta?: number;
    /** Ordered rule trace from `applyAdminPricingRulesStack` (preferred over `rule_ids` alone). */
    admin_rules_applied?: AppliedAdminRule[];
  };
};

export type UnifiedBookingResult = {
  table_price_zar: number;
  extra_room_price_zar: number;
  extras_price_zar: number;
  cleaning_subtotal_zar: number;
  /** Always 0 — all-in table pricing (Option A). */
  service_fee_zar: number;
  /** Pre–dynamic-layer unified cleaning total (ZAR). */
  base_price_zar: number;
  /** V6 demand + supply + time-slot multiplier on labour (applied after `base_price_zar`). */
  dynamic_multiplier: number;
  /** Normalized demand intensity (bookings ÷ capacity) used for multiplier. */
  demand_score: number;
  /** Normalized supply (cleaners ÷ baseline) used for multiplier. */
  supply_score: number;
  /** Labour after dynamic multiplier, before forecast layer (ZAR). */
  price_after_dynamic_zar: number;
  /** Forecast demand layer on labour (before real-time surge). */
  forecast_multiplier: number;
  forecast_adjustment_zar: number;
  /** Labour after forecast, before real-time surge (ZAR). */
  price_after_forecast_zar: number;
  /** Real-time surge only (multiplier from `surgeEngine.calculateSurgeMultiplier`). */
  surge_multiplier: number;
  surge_amount_zar: number;
  /** Fractional contributions to (surge_multiplier − 1); admin / audits only. */
  surge_breakdown?: SurgeBreakdown;
  /** Customer-safe short line; no numeric breakdown. */
  surge_pricing_note?: string | null;
  /** Post–real-time-surge, pre-discount labor total (ZAR). */
  price_zar: number;
  discount_amount_zar: number;
  /** Labor line after surge and best discount (ZAR, rounded). */
  final_price_zar: number;
  promo_code: string | null;
  discount_type: string | null;
  total_amount_cents: number;
  /** Total labor-hours (one-cleaner-equivalent); may exceed 9h if Premium + 2 cleaners */
  hours: number;
  /** Wall-clock hours per cleaner */
  duration: number;
  team_size: number;
  extras_time_hours: number;
  demand_ratio?: number;
  /** V6.2 — stacked admin rules (order + type), or synthesized from `rule_ids` when trace omitted */
  admin_rule_applied?: AppliedAdminRule[];
  base_dynamic_multiplier?: number;
  effective_multiplier?: number;
  multiplier_delta?: number;
};
