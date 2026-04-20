-- Loyalty redemption on bookings + referral tracking + public referral codes on customers

ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS referral_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_referral_code_upper
  ON public.customers (upper(referral_code))
  WHERE referral_code IS NOT NULL AND btrim(referral_code) <> '';

COMMENT ON COLUMN public.customers.referral_code IS 'Shareable code (e.g. SHALEAN1A2B) for referral program; unique.';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS points_redeemed INTEGER NOT NULL DEFAULT 0 CHECK (points_redeemed >= 0);

COMMENT ON COLUMN public.bookings.points_redeemed IS 'Loyalty points applied as R1-per-point discount on this booking.';

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.customers (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  reward_granted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals (status);

COMMENT ON TABLE public.referrals IS 'Referrer/referee relationship; status completed when first paid booking settles.';
