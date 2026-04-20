-- Idempotent post-payment loyalty / referral rewards (Edge + Next.js both may finalize Paystack)

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS loyalty_rewards_applied_at TIMESTAMPTZ;

COMMENT ON COLUMN public.bookings.loyalty_rewards_applied_at IS 'First-set timestamp when loyalty + referral rewards were applied after payment (prevents duplicate credits).';
