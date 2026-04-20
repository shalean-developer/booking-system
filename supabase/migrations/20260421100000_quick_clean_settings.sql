-- Quick Clean V4: single-row config for time-based pricing (hourly rate, caps, rounding).

CREATE TABLE IF NOT EXISTS public.quick_clean_settings (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  hourly_rate_zar numeric(10, 2) NOT NULL DEFAULT 70,
  extra_time_hours numeric(6, 2) NOT NULL DEFAULT 0.5,
  max_total_hours numeric(6, 2) NOT NULL DEFAULT 6,
  price_rounding integer NOT NULL DEFAULT 5,
  min_callout_price numeric(10, 2) NOT NULL DEFAULT 199,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.quick_clean_settings IS
  'Quick Clean V4: hourly_rate × hours + min_callout + rounding; read by booking form and server pricing validation.';

INSERT INTO public.quick_clean_settings (
  hourly_rate_zar,
  extra_time_hours,
  max_total_hours,
  price_rounding,
  min_callout_price
)
SELECT 70, 0.5, 6, 5, 199
WHERE NOT EXISTS (SELECT 1 FROM public.quick_clean_settings LIMIT 1);

ALTER TABLE public.quick_clean_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quick_clean_settings_select_public"
  ON public.quick_clean_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Writes via service role / dashboard only (no insert/update policy for anon).
