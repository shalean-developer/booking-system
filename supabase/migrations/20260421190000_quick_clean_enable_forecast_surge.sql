-- Toggle predictive (forecast-based) layer on unified Standard/Airbnb pricing before real-time surge.

ALTER TABLE public.quick_clean_settings
  ADD COLUMN IF NOT EXISTS enable_forecast_surge boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.quick_clean_settings.enable_forecast_surge IS
  'When true, server applies forecast demand multiplier to labour before real-time surge (see lib/pricing/forecast-surge.ts).';
