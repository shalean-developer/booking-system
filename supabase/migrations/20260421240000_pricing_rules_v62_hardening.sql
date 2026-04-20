-- V6.2 hardening: rule types, schedule, audit, notes.

ALTER TABLE public.pricing_rules
  ADD COLUMN IF NOT EXISTS rule_type text DEFAULT 'multiplier',
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text;

COMMENT ON COLUMN public.pricing_rules.rule_type IS
  'override | multiplier | cap | disable — stacked in priority order after base dynamic layer.';

COMMENT ON COLUMN public.pricing_rules.starts_at IS 'Rule active from this instant (inclusive); null = no lower bound.';
COMMENT ON COLUMN public.pricing_rules.ends_at IS 'Rule active until this instant (exclusive); null = no upper bound.';

-- Preserve prior replace semantics for existing rows that set a labour multiplier.
UPDATE public.pricing_rules
SET rule_type = 'override'
WHERE multiplier_override IS NOT NULL
  AND (rule_type IS NULL OR rule_type = 'multiplier');
