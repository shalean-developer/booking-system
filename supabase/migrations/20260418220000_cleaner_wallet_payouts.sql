-- =============================================================================
-- Cleaner wallet + automatic Paystack payouts (weekly / monthly schedules)
-- Amounts: integer cents (ZAR). Paystack Transfer API uses smallest currency unit.
-- =============================================================================

-- Cleaners: payout preferences
ALTER TABLE public.cleaners
  ADD COLUMN IF NOT EXISTS payout_schedule TEXT NOT NULL DEFAULT 'weekly'
    CHECK (payout_schedule IN ('weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS payout_day INTEGER NOT NULL DEFAULT 5;

COMMENT ON COLUMN public.cleaners.payout_schedule IS 'weekly | monthly';
COMMENT ON COLUMN public.cleaners.payout_day IS 'weekly: 0=Sun .. 6=Sat; monthly: 1..31 (last day clamped in app if month shorter)';

-- Bookings: wallet / disbursement tracking (cleaner_earnings already exists)
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payout_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payout_status IN ('pending', 'paid'));

COMMENT ON COLUMN public.bookings.payout_status IS
  'pending = earning not yet credited to cleaner wallet; paid = credited to wallet (available per hold rules for bank payout)';

CREATE INDEX IF NOT EXISTS idx_bookings_payout_status ON public.bookings (payout_status)
  WHERE status = 'completed';

-- Wallet (one row per cleaner)
CREATE TABLE IF NOT EXISTS public.cleaner_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID NOT NULL REFERENCES public.cleaners (id) ON DELETE CASCADE,
  balance BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  pending_balance BIGINT NOT NULL DEFAULT 0 CHECK (pending_balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cleaner_id)
);

CREATE INDEX IF NOT EXISTS idx_cleaner_wallets_cleaner ON public.cleaner_wallets (cleaner_id);

COMMENT ON TABLE public.cleaner_wallets IS 'Aggregated wallet; balance = available + cleared; pending_balance = earnings awaiting admin approval';

-- Ledger
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID NOT NULL REFERENCES public.cleaners (id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.bookings (id) ON DELETE SET NULL,
  amount BIGINT NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('earning', 'payout')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  paystack_reference TEXT,
  meta JSONB,
  available_for_payout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_cleaner_created ON public.wallet_transactions (cleaner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_booking ON public.wallet_transactions (booking_id) WHERE booking_id IS NOT NULL;

-- One earning row per cleaner per booking (team jobs credit each member separately)
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_earning_booking_cleaner
  ON public.wallet_transactions (booking_id, cleaner_id)
  WHERE type = 'earning';

COMMENT ON COLUMN public.wallet_transactions.available_for_payout_at IS
  'Earning becomes eligible for Paystack transfer after this time (e.g. completed_at + hold). Null = use created_at.';

-- Paystack transfer recipients
CREATE TABLE IF NOT EXISTS public.payout_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cleaner_id UUID NOT NULL REFERENCES public.cleaners (id) ON DELETE CASCADE,
  recipient_code TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cleaner_id)
);

CREATE INDEX IF NOT EXISTS idx_payout_recipients_cleaner ON public.payout_recipients (cleaner_id);

-- -----------------------------------------------------------------------------
-- RPC: increment_wallet_balance — required by product spec (wallet upsert)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.increment_wallet_balance(
  cleaner_id_input UUID,
  amount_input BIGINT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF amount_input IS NULL OR amount_input = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.cleaner_wallets (cleaner_id, balance, pending_balance, updated_at)
  VALUES (cleaner_id_input, amount_input, 0, NOW())
  ON CONFLICT (cleaner_id) DO UPDATE SET
    balance = public.cleaner_wallets.balance + amount_input,
    updated_at = NOW();
END;
$$;

REVOKE ALL ON FUNCTION public.increment_wallet_balance(UUID, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_wallet_balance(UUID, BIGINT) TO service_role;

-- -----------------------------------------------------------------------------
-- RPC: atomic earning credit + ledger row (avoids drift between balance and tx)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_wallet_earning(
  cleaner_id_input UUID,
  booking_id_input TEXT,
  amount_input BIGINT,
  credit_pending BOOLEAN DEFAULT FALSE,
  available_for_payout_at_input TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id UUID;
  st TEXT;
BEGIN
  IF amount_input IS NULL OR amount_input <= 0 THEN
    RETURN NULL;
  END IF;

  st := CASE WHEN credit_pending THEN 'pending' ELSE 'completed' END;

  INSERT INTO public.cleaner_wallets (cleaner_id, balance, pending_balance, updated_at)
  VALUES (
    cleaner_id_input,
    CASE WHEN credit_pending THEN 0 ELSE amount_input END,
    CASE WHEN credit_pending THEN amount_input ELSE 0 END,
    NOW()
  )
  ON CONFLICT (cleaner_id) DO UPDATE SET
    balance = public.cleaner_wallets.balance + CASE WHEN credit_pending THEN 0 ELSE amount_input END,
    pending_balance = public.cleaner_wallets.pending_balance + CASE WHEN credit_pending THEN amount_input ELSE 0 END,
    updated_at = NOW();

  INSERT INTO public.wallet_transactions (
    cleaner_id,
    booking_id,
    amount,
    type,
    status,
    available_for_payout_at
  )
  VALUES (
    cleaner_id_input,
    booking_id_input,
    amount_input,
    'earning',
    st,
    available_for_payout_at_input
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_wallet_earning(UUID, TEXT, BIGINT, BOOLEAN, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_wallet_earning(UUID, TEXT, BIGINT, BOOLEAN, TIMESTAMPTZ) TO service_role;

-- -----------------------------------------------------------------------------
-- RPC: move pending earning into available balance after admin approval
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.release_pending_wallet_earnings_for_booking(p_booking_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, cleaner_id, amount
    FROM public.wallet_transactions
    WHERE booking_id = p_booking_id
      AND type = 'earning'
      AND status = 'pending'
  LOOP
    UPDATE public.cleaner_wallets w
    SET
      pending_balance = GREATEST(0, w.pending_balance - r.amount),
      balance = w.balance + r.amount,
      updated_at = NOW()
    WHERE w.cleaner_id = r.cleaner_id;

    UPDATE public.wallet_transactions
    SET status = 'completed'
    WHERE id = r.id;

    n := n + 1;
  END LOOP;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.release_pending_wallet_earnings_for_booking(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_pending_wallet_earnings_for_booking(TEXT) TO service_role;

-- After a successful Paystack transfer: record payout + reduce balance
CREATE OR REPLACE FUNCTION public.finalize_cleaner_payout(
  p_cleaner_id UUID,
  p_amount BIGINT,
  p_paystack_reference TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid payout amount';
  END IF;

  UPDATE public.cleaner_wallets
  SET
    balance = balance - p_amount,
    updated_at = NOW()
  WHERE cleaner_id = p_cleaner_id
    AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or wallet missing for cleaner';
  END IF;

  INSERT INTO public.wallet_transactions (
    cleaner_id,
    booking_id,
    amount,
    type,
    status,
    paystack_reference
  )
  VALUES (
    p_cleaner_id,
    NULL,
    p_amount,
    'payout',
    'completed',
    p_paystack_reference
  )
  RETURNING id INTO tid;

  RETURN tid;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_cleaner_payout(UUID, BIGINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_cleaner_payout(UUID, BIGINT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.record_failed_payout_attempt(
  p_cleaner_id UUID,
  p_amount BIGINT,
  p_error_message TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tid UUID;
BEGIN
  INSERT INTO public.wallet_transactions (
    cleaner_id,
    booking_id,
    amount,
    type,
    status,
    meta
  )
  VALUES (
    p_cleaner_id,
    NULL,
    GREATEST(COALESCE(p_amount, 0), 1),
    'payout',
    'failed',
    jsonb_build_object('error', LEFT(COALESCE(p_error_message, 'unknown'), 2000))
  )
  RETURNING id INTO tid;

  RETURN tid;
END;
$$;

REVOKE ALL ON FUNCTION public.record_failed_payout_attempt(UUID, BIGINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_failed_payout_attempt(UUID, BIGINT, TEXT) TO service_role;

-- Eligible amount for Paystack (earnings past hold minus completed payouts)
CREATE OR REPLACE FUNCTION public.get_eligible_payout_cents(p_cleaner_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    SUM(
      CASE
        WHEN type = 'earning'
          AND status = 'completed'
          AND (available_for_payout_at IS NULL OR available_for_payout_at <= NOW())
        THEN amount
        ELSE 0
      END
    ),
    0
  ) - COALESCE(
    SUM(
      CASE
        WHEN type = 'payout' AND status = 'completed' THEN amount
        ELSE 0
      END
    ),
    0
  )
  FROM public.wallet_transactions
  WHERE cleaner_id = p_cleaner_id;
$$;

REVOKE ALL ON FUNCTION public.get_eligible_payout_cents(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_eligible_payout_cents(UUID) TO service_role;

ALTER TABLE public.cleaner_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_recipients ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies — server uses service_role only for writes.
