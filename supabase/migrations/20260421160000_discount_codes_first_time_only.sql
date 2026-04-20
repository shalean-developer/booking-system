-- Optional: restrict codes to first-time paying customers (see lib/pricing/discounts.ts)

ALTER TABLE public.discount_codes
  ADD COLUMN IF NOT EXISTS first_time_only BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.discount_codes.first_time_only IS 'When true, code applies only if customer has no successful prior payments.';
