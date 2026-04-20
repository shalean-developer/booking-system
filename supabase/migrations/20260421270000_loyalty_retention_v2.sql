-- Retention & loyalty: tier, lifetime points, transaction log, engagement timestamps

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS loyalty_lifetime_points INTEGER NOT NULL DEFAULT 0 CHECK (loyalty_lifetime_points >= 0);

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS user_tier TEXT NOT NULL DEFAULT 'bronze'
  CHECK (user_tier IN ('bronze', 'silver', 'gold', 'platinum'));

COMMENT ON COLUMN public.customers.loyalty_lifetime_points IS 'Cumulative points earned (excludes redemptions)';
COMMENT ON COLUMN public.customers.user_tier IS 'Bronze default; Silver 5+ completed; Gold 15+; Platinum 30+ completed bookings';

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS loyalty_last_nudge_at TIMESTAMPTZ;

COMMENT ON COLUMN public.customers.loyalty_last_nudge_at IS 'Last re-engagement / rebooking reminder sent';

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  points_delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  booking_id TEXT REFERENCES public.bookings (id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_customer_created ON public.loyalty_transactions (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_booking ON public.loyalty_transactions (booking_id);

COMMENT ON TABLE public.loyalty_transactions IS 'Audit log for earn, redeem, bonuses, referrals';
