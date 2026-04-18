-- Company profit snapshot (after cleaner payout resolved) + optional earnings debug JSON.
-- Nullable for backward compatibility; existing rows unchanged.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS company_profit_cents integer,
  ADD COLUMN IF NOT EXISTS earnings_breakdown jsonb;

COMMENT ON COLUMN public.bookings.company_profit_cents IS 'total_amount minus total cleaner payout (cents), set on approval or at auto-approved insert';
COMMENT ON COLUMN public.bookings.earnings_breakdown IS 'Debug snapshot: subtotal, pool, caps, excluded company-only lines';
