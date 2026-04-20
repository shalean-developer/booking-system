import type { SupabaseClient } from '@supabase/supabase-js';

export type QuickCleanSettings = {
  hourlyRateZar: number;
  extraTimeHours: number;
  maxTotalHours: number;
  priceRounding: number;
  minCalloutPrice: number;
  /** When true, server applies forecast demand multiplier before real-time surge (Standard/Airbnb). */
  enableForecastSurge: boolean;
};

/** Matches seed in `supabase/migrations/20260421100000_quick_clean_settings.sql`. */
export const DEFAULT_QUICK_CLEAN_SETTINGS: QuickCleanSettings = {
  hourlyRateZar: 70,
  extraTimeHours: 0.5,
  maxTotalHours: 6,
  priceRounding: 5,
  minCalloutPrice: 199,
  enableForecastSurge: false,
};

function rowToSettings(row: {
  hourly_rate_zar: number | string;
  extra_time_hours: number | string;
  max_total_hours: number | string;
  price_rounding: number | string;
  min_callout_price: number | string;
  enable_forecast_surge?: boolean | null;
}): QuickCleanSettings {
  return {
    hourlyRateZar: Number(row.hourly_rate_zar),
    extraTimeHours: Number(row.extra_time_hours),
    maxTotalHours: Number(row.max_total_hours),
    priceRounding: Math.max(1, Math.round(Number(row.price_rounding))),
    minCalloutPrice: Number(row.min_callout_price),
    enableForecastSurge: Boolean(row.enable_forecast_surge),
  };
}

/**
 * Load single-row Quick Clean config. Falls back to defaults if missing or invalid.
 */
export async function fetchQuickCleanSettings(
  client: SupabaseClient
): Promise<QuickCleanSettings> {
  const { data, error } = await client
    .from('quick_clean_settings')
    .select(
      'hourly_rate_zar, extra_time_hours, max_total_hours, price_rounding, min_callout_price, enable_forecast_surge'
    )
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { ...DEFAULT_QUICK_CLEAN_SETTINGS };
  }

  try {
    const s = rowToSettings(data as Parameters<typeof rowToSettings>[0]);
    if (
      !Number.isFinite(s.hourlyRateZar) ||
      s.hourlyRateZar <= 0 ||
      !Number.isFinite(s.extraTimeHours) ||
      s.extraTimeHours <= 0 ||
      !Number.isFinite(s.maxTotalHours) ||
      s.maxTotalHours <= 0 ||
      !Number.isFinite(s.minCalloutPrice) ||
      s.minCalloutPrice < 0
    ) {
      return { ...DEFAULT_QUICK_CLEAN_SETTINGS };
    }
    return s;
  } catch {
    return { ...DEFAULT_QUICK_CLEAN_SETTINGS };
  }
}
