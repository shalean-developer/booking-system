-- V6.2 — Admin hybrid rules on top of dynamic pricing (overrides, caps, area/time filters).

CREATE TABLE public.pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  service_type text,
  area text,
  day_of_week int,
  time_start int,
  time_end int,

  multiplier_override numeric,
  min_price_zar numeric,
  max_price_zar numeric,

  dynamic_enabled boolean NOT NULL DEFAULT true,

  priority int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pricing_rules_active_priority_idx ON public.pricing_rules (is_active, priority DESC);

COMMENT ON TABLE public.pricing_rules IS 'V6.2 admin pricing: optional filters + dynamic override/caps; highest priority wins.';

ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY pricing_rules_select_admin ON public.pricing_rules
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY pricing_rules_insert_admin ON public.pricing_rules
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY pricing_rules_update_admin ON public.pricing_rules
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY pricing_rules_delete_admin ON public.pricing_rules
  FOR DELETE TO authenticated
  USING (is_admin());
