import type { AppliedAdminRule } from '@/lib/pricing/admin-pricing-rules-apply';

import { normalizeAppliedAdminRules } from '@/lib/pricing/admin-rule-utils';

import type { UnifiedBookingInput, UnifiedBookingResult } from '@/lib/pricing/types';

import {

  BookingV4ValidationError,

  calculateBookingV4,

} from '@/lib/pricing/v4/calculateBookingV4';

import { unifiedExtraUnitPricesZar } from '@/lib/pricing/extras';

import { roundPrice } from '@/lib/pricing/rounding';

import {
  calculateSurgeMultiplier,
  getPublicSurgePricingNote,
  type SurgeBreakdown,
} from '@/lib/pricing/surgeEngine';

import { getForecastSurgeMultiplier } from '@/lib/pricing/forecast-surge';

import { resolveBestDiscount } from '@/lib/pricing/discounts';

import { getDynamicPricingMultiplierSync } from '@/lib/pricing/dynamic-pricing';



export class UnifiedPricingValidationError extends Error {

  constructor(message: string) {

    super(message);

    this.name = 'UnifiedPricingValidationError';

  }

}



export function calculateBookingUnified(

  input: UnifiedBookingInput

): UnifiedBookingResult {

  const bedrooms = Math.floor(Number(input.bedrooms) || 0);

  const bathrooms = Math.floor(Number(input.bathrooms) || 0);

  const extraRoomsRaw = Math.floor(Number(input.extra_rooms) || 0);



  if (bedrooms < 1) {

    throw new UnifiedPricingValidationError('bedrooms must be >= 1');

  }

  if (bathrooms < 0) {

    throw new UnifiedPricingValidationError('bathrooms must be >= 0');

  }

  if (extraRoomsRaw < 0) {

    throw new UnifiedPricingValidationError('extra_rooms must be >= 0');

  }



  let v4;

  try {

    v4 = calculateBookingV4({

      service_type: input.service_type,

      pricing_mode: input.pricing_mode,

      bedrooms,

      bathrooms,

      extra_rooms: extraRoomsRaw,

      extras: input.extras ?? [],

      extrasQuantities: input.extrasQuantities,

      has_extra_cleaner: input.has_extra_cleaner,

    });

  } catch (e) {

    if (e instanceof BookingV4ValidationError) {

      throw new UnifiedPricingValidationError(e.message);

    }

    throw e;

  }



  const table_price_zar = v4.table_price_zar;

  const extra_room_price_zar = v4.extra_room_price_zar;

  const extras_price_zar = v4.extras_price_zar;

  const extras_time_hours = v4.extras_time_hours;

  const cleaning_subtotal_zar = v4.cleaning_subtotal_zar;



  /** Option A: table + lines are all-in customer price (no separate service fee). */

  const service_fee_zar = 0;

  const base_price_zar = roundPrice(cleaning_subtotal_zar);



  const scheduleDate = input.surge?.date ?? input.schedule?.date ?? '';

  const scheduleTime = input.surge?.time_slot ?? input.schedule?.time_slot ?? '10:00';



  const syncDyn = getDynamicPricingMultiplierSync({

    date: scheduleDate || '1970-01-01',

    time: scheduleTime,

    area: input.surge?.area,

    serviceType: input.service_type,

    dynamic_signals: input.dynamic_signals,

  });

  const demand_score = syncDyn.demand_score;

  const supply_score = syncDyn.supply_score;

  const base_dynamic_multiplier = syncDyn.multiplier;

  const rawRuleIds = input.admin_dynamic_pricing?.rule_ids ?? [];

  const adminTrace = input.admin_dynamic_pricing?.admin_rules_applied;

  const admin_rule_applied: AppliedAdminRule[] = normalizeAppliedAdminRules(

    adminTrace as unknown,

    rawRuleIds

  );

  const dynamic_multiplier =

    input.admin_dynamic_pricing?.multiplier ?? syncDyn.multiplier;

  const price_after_dynamic_zar = roundPrice(base_price_zar * dynamic_multiplier);



  const availForForecast = Math.max(

    1,

    Math.floor(Number(input.surge?.available_cleaners) || 0) || 1,

  );



  let forecast_multiplier = 1;

  let forecast_adjustment_zar = 0;

  let price_after_forecast_zar = price_after_dynamic_zar;



  const fsEnabled = Boolean(input.forecast_surge?.enabled);

  const fsBookings = input.forecast_surge?.forecastBookings ?? null;

  if (fsEnabled && fsBookings != null && Number.isFinite(Number(fsBookings))) {

    const fs = getForecastSurgeMultiplier({

      date: scheduleDate || input.surge?.date || '1970-01-01',

      area: input.surge?.area,

      forecastBookings: fsBookings,

      availableCleaners: availForForecast,

      time_slot: scheduleTime,

    });

    forecast_multiplier = fs.multiplier;

    price_after_forecast_zar = roundPrice(price_after_dynamic_zar * forecast_multiplier);

    forecast_adjustment_zar = roundPrice(price_after_forecast_zar - price_after_dynamic_zar);

    if (process.env.NODE_ENV === 'development') {

      console.log('[forecast-surge]', {

        forecastBookings: fsBookings,

        cleaners: availForForecast,

        multiplier: forecast_multiplier,

      });

    }

  }



  let surge_multiplier = 1;

  let surge_amount_zar = 0;

  let demand_ratio: number | undefined;

  let surge_breakdown: SurgeBreakdown | undefined;

  let surge_pricing_note: string | null = null;

  let price_zar = price_after_forecast_zar;

  const forecastHighDemand =
    fsEnabled &&
    fsBookings != null &&
    Number.isFinite(Number(fsBookings)) &&
    Number(fsBookings) > availForForecast * 1.2;

  if (input.surge) {
    const sm = calculateSurgeMultiplier({
      service_type: input.service_type,
      date: input.surge.date,
      time: input.surge.time_slot,
      area: input.surge.area,
      active_bookings_count: input.surge.active_bookings,
      available_cleaners_count: input.surge.available_cleaners,
      slot_average_bookings: input.surge.slot_average_bookings,
      required_cleaners: Math.max(1, v4.team_size),
      forecast_high_demand: forecastHighDemand,
      now: input.unified_discount?.now ?? new Date(),
    });

    surge_multiplier = sm.multiplier;
    demand_ratio = sm.demand_ratio;
    surge_breakdown = sm.breakdown;
    surge_pricing_note = getPublicSurgePricingNote(sm.multiplier);

    price_zar = roundPrice(price_after_forecast_zar * surge_multiplier);

    surge_amount_zar = roundPrice(price_zar - price_after_forecast_zar);

    if (process.env.NODE_ENV === 'development') {
      console.log('[surge]', {
        demandRatio: demand_ratio,
        surge_multiplier,
        surge_amount: surge_amount_zar,
        breakdown: sm.breakdown,
      });
    }
  }



  const surged_price_zar = price_zar;

  const dateStr = scheduleDate;

  const timeSlot = scheduleTime;

  const apiService = input.service_type === 'standard' ? 'Standard' : 'Airbnb';

  const extraUnitMap = unifiedExtraUnitPricesZar(input.extras ?? [], input.extrasQuantities);



  const resolved = resolveBestDiscount({

    price_zar: surged_price_zar,

    promo: input.unified_discount?.promo ?? null,

    user: input.unified_discount?.user,

    booking: {

      date: dateStr || '1970-01-01',

      time_slot: timeSlot,

      service: apiService,

      extras: input.extras ?? [],

      extrasQuantities: input.extrasQuantities,

    },

    now: input.unified_discount?.now,

    extra_unit_prices_zar: extraUnitMap,

  });



  const discount_amount_zar = resolved.discount_amount_zar;

  const final_price_zar = resolved.final_price_zar;

  const promo_code = resolved.promo_code;

  const discount_type = resolved.discount_type;



  const total_amount_cents = Math.round(final_price_zar * 100);



  const hours = v4.hours;

  const duration = v4.duration;

  const team_size = v4.team_size;



  /** Low effective rate is surfaced via pricing preview / ops tooling — avoid per-request console noise. */



  if (process.env.NODE_ENV === 'development') {

    console.log('[pricing]', {

      bedrooms,

      bathrooms,

      extra_rooms: extraRoomsRaw,

      pricing_mode: input.pricing_mode,

      price_zar: surged_price_zar,

      final_price_zar,

      discount_amount_zar,

      hours,

      duration,

      team_size,

    });

  }



  return {

    table_price_zar,

    extra_room_price_zar,

    extras_price_zar,

    cleaning_subtotal_zar,

    service_fee_zar,

    base_price_zar,

    dynamic_multiplier,

    demand_score,

    supply_score,

    price_after_dynamic_zar,

    forecast_multiplier,

    forecast_adjustment_zar,

    price_after_forecast_zar,

    surge_multiplier,

    surge_amount_zar,

    price_zar: surged_price_zar,

    discount_amount_zar,

    final_price_zar,

    promo_code,

    discount_type,

    total_amount_cents,

    hours,

    duration,

    team_size,

    extras_time_hours,

    ...(demand_ratio !== undefined ? { demand_ratio } : {}),

    ...(surge_breakdown !== undefined ? { surge_breakdown } : {}),

    ...(surge_pricing_note != null ? { surge_pricing_note } : {}),

    admin_rule_applied,

    base_dynamic_multiplier,

    ...(input.admin_dynamic_pricing?.effective_multiplier != null

      ? { effective_multiplier: input.admin_dynamic_pricing.effective_multiplier }

      : {}),

    ...(input.admin_dynamic_pricing?.multiplier_delta != null

      ? { multiplier_delta: input.admin_dynamic_pricing.multiplier_delta }

      : {}),

  };

}

