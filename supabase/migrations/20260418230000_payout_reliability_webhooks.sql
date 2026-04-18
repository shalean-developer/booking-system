-- =============================================================================
-- Payout reliability: idempotency, processing state, webhooks, retries, liability
-- Extends 20260418220000_cleaner_wallet_payouts.sql — safe to run after it.
-- =============================================================================

DROP FUNCTION IF EXISTS public.record_failed_payout_attempt(UUID, BIGINT, TEXT);

-- -----------------------------------------------------------------------------
-- wallet_transactions: extended status, idempotency, retries
-- -----------------------------------------------------------------------------
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN public.wallet_transactions.idempotency_key IS
  'Unique per Paystack transfer attempt; duplicate cron uses same key → no double pay';
COMMENT ON COLUMN public.wallet_transactions.retry_count IS
  'For failed payouts; capped in app (e.g. 3) before manual review';

-- Drop old status check and enforce by type
ALTER TABLE public.wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_status_check;

ALTER TABLE public.wallet_transactions ADD CONSTRAINT wallet_transactions_status_by_type CHECK (
  (type = 'earning' AND status IN ('pending', 'completed'))
  OR (type = 'payout' AND status IN ('pending', 'processing', 'completed', 'failed'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_transactions_idempotency_key
  ON public.wallet_transactions (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- At most one in-flight payout per cleaner (prevents parallel double pay)
CREATE UNIQUE INDEX IF NOT EXISTS uq_wallet_one_processing_payout_per_cleaner
  ON public.wallet_transactions (cleaner_id)
  WHERE type = 'payout' AND status = 'processing';

-- -----------------------------------------------------------------------------
-- Audit log (structured events for payouts / webhooks / cron)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payout_event_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  cleaner_id UUID REFERENCES public.cleaners (id) ON DELETE SET NULL,
  wallet_transaction_id UUID REFERENCES public.wallet_transactions (id) ON DELETE SET NULL,
  idempotency_key TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_event_logs_created ON public.payout_event_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_event_logs_cleaner ON public.payout_event_logs (cleaner_id) WHERE cleaner_id IS NOT NULL;

ALTER TABLE public.payout_event_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Liability: total cents owed to cleaners (wallet + pending admin approval)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_cleaner_liability_outstanding AS
SELECT
  COALESCE(SUM(balance + pending_balance), 0)::BIGINT AS total_cents,
  COUNT(*)::INTEGER AS wallet_row_count
FROM public.cleaner_wallets;

COMMENT ON VIEW public.v_cleaner_liability_outstanding IS
  'Sum of balance + pending_balance across cleaner_wallets (company liability to cleaners)';

-- -----------------------------------------------------------------------------
-- Eligible payout: earnings (past hold) minus completed AND processing payouts
-- (processing already reserved via balance deduction on initiate)
-- -----------------------------------------------------------------------------
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
        WHEN type = 'payout'
          AND status IN ('completed', 'processing')
        THEN amount
        ELSE 0
      END
    ),
    0
  )
  FROM public.wallet_transactions
  WHERE cleaner_id = p_cleaner_id;
$$;

-- -----------------------------------------------------------------------------
-- Log helper (optional RPC for server-side inserts)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_payout_event(
  p_event_type TEXT,
  p_cleaner_id UUID,
  p_wallet_transaction_id UUID,
  p_idempotency_key TEXT,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lid UUID;
BEGIN
  INSERT INTO public.payout_event_logs (event_type, cleaner_id, wallet_transaction_id, idempotency_key, payload)
  VALUES (p_event_type, p_cleaner_id, p_wallet_transaction_id, p_idempotency_key, p_payload)
  RETURNING id INTO lid;
  RETURN lid;
END;
$$;

REVOKE ALL ON FUNCTION public.log_payout_event(TEXT, UUID, UUID, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_payout_event(TEXT, UUID, UUID, TEXT, JSONB) TO service_role;

-- -----------------------------------------------------------------------------
-- Idempotent initiate: insert processing payout + deduct balance (single TX)
-- Returns existing txn id if idempotency_key already used (completed or processing).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.initiate_payout_processing(
  p_cleaner_id UUID,
  p_amount BIGINT,
  p_idempotency_key TEXT
)
RETURNS TABLE (wallet_tx_id UUID, is_duplicate BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_id UUID;
  v_existing_status TEXT;
  new_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 OR p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) = 0 THEN
    RAISE EXCEPTION 'Invalid payout initiate parameters';
  END IF;

  SELECT wt.id, wt.status INTO v_existing_id, v_existing_status
  FROM public.wallet_transactions wt
  WHERE wt.idempotency_key = p_idempotency_key
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    IF v_existing_status IN ('completed', 'processing') THEN
      wallet_tx_id := v_existing_id;
      is_duplicate := TRUE;
      RETURN NEXT;
      RETURN;
    ELSIF v_existing_status = 'failed' THEN
      RAISE EXCEPTION 'idempotency_key_consumed_after_failure'
        USING HINT = 'Generate a fresh idempotency key for retry attempts';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.wallet_transactions
    WHERE cleaner_id = p_cleaner_id AND type = 'payout' AND status = 'processing'
  ) THEN
    RAISE EXCEPTION 'cleaner_has_processing_payout';
  END IF;

  UPDATE public.cleaner_wallets
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE cleaner_id = p_cleaner_id AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_wallet_balance';
  END IF;

  INSERT INTO public.wallet_transactions (
    cleaner_id, booking_id, amount, type, status,
    idempotency_key, processing_started_at, updated_at
  )
  VALUES (
    p_cleaner_id, NULL, p_amount, 'payout', 'processing',
    p_idempotency_key, NOW(), NOW()
  )
  RETURNING id INTO new_id;

  wallet_tx_id := new_id;
  is_duplicate := FALSE;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.initiate_payout_processing(UUID, BIGINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initiate_payout_processing(UUID, BIGINT, TEXT) TO service_role;

-- -----------------------------------------------------------------------------
-- Webhook success: processing → completed (balance already deducted at initiate)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_payout_from_webhook(
  p_idempotency_key TEXT,
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
  IF p_idempotency_key IS NULL OR length(trim(p_idempotency_key)) = 0 THEN
    RAISE EXCEPTION 'idempotency_key required';
  END IF;

  UPDATE public.wallet_transactions
  SET
    status = 'completed',
    paystack_reference = COALESCE(p_paystack_reference, paystack_reference),
    updated_at = NOW()
  WHERE idempotency_key = p_idempotency_key
    AND type = 'payout'
    AND status = 'processing'
  RETURNING id INTO tid;

  IF tid IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN tid;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_payout_from_webhook(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_payout_from_webhook(TEXT, TEXT) TO service_role;

-- -----------------------------------------------------------------------------
-- Sync/API failure after initiate: refund balance + mark failed + retry schedule
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fail_payout_processing(
  p_wallet_tx_id UUID,
  p_error_message TEXT,
  p_max_retries INTEGER DEFAULT 3,
  p_retry_delay_seconds INTEGER DEFAULT 3600
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  new_retry INTEGER;
  next_at TIMESTAMPTZ;
BEGIN
  SELECT id, cleaner_id, amount, status, retry_count INTO r
  FROM public.wallet_transactions
  WHERE id = p_wallet_tx_id AND type = 'payout';

  IF NOT FOUND OR r.status <> 'processing' THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.cleaner_wallets (cleaner_id, balance, pending_balance, updated_at)
  VALUES (r.cleaner_id, r.amount, 0, NOW())
  ON CONFLICT (cleaner_id) DO UPDATE SET
    balance = public.cleaner_wallets.balance + EXCLUDED.balance,
    updated_at = NOW();

  new_retry := r.retry_count + 1;
  next_at := CASE
    WHEN new_retry < COALESCE(p_max_retries, 3) THEN
      NOW() + make_interval(
        secs => GREATEST(
          60,
          FLOOR(
            COALESCE(p_retry_delay_seconds, 3600)::NUMERIC * POWER(2::NUMERIC, GREATEST(new_retry - 1, 0))
          )::INTEGER
        )
      )
    ELSE NULL
  END;

  UPDATE public.wallet_transactions
  SET
    status = 'failed',
    meta = COALESCE(meta, '{}'::jsonb) || jsonb_build_object(
      'error', LEFT(COALESCE(p_error_message, 'unknown'), 2000),
      'failed_at', NOW()
    ),
    retry_count = new_retry,
    next_retry_at = next_at,
    updated_at = NOW()
  WHERE id = r.id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.fail_payout_processing(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fail_payout_processing(UUID, TEXT, INTEGER, INTEGER) TO service_role;

-- -----------------------------------------------------------------------------
-- Webhook failure: same as fail_payout_processing but keyed by idempotency
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fail_payout_from_webhook(
  p_idempotency_key TEXT,
  p_error_message TEXT,
  p_max_retries INTEGER DEFAULT 3,
  p_retry_delay_seconds INTEGER DEFAULT 3600
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  txid UUID;
BEGIN
  SELECT id INTO txid
  FROM public.wallet_transactions
  WHERE idempotency_key = p_idempotency_key AND type = 'payout' AND status = 'processing'
  LIMIT 1;

  IF txid IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN public.fail_payout_processing(txid, p_error_message, p_max_retries, p_retry_delay_seconds);
END;
$$;

REVOKE ALL ON FUNCTION public.fail_payout_from_webhook(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fail_payout_from_webhook(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- -----------------------------------------------------------------------------
-- Stale processing recovery (e.g. webhook never arrived)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recover_stale_processing_payouts(
  p_max_age_hours INTEGER DEFAULT 72
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  n INTEGER := 0;
BEGIN
  FOR r IN
    SELECT id
    FROM public.wallet_transactions
    WHERE type = 'payout'
      AND status = 'processing'
      AND processing_started_at IS NOT NULL
      AND processing_started_at < NOW() - make_interval(hours => GREATEST(1, COALESCE(p_max_age_hours, 72)))
  LOOP
    IF public.fail_payout_processing(
      r.id,
      'stale_processing_timeout: no webhook confirmation',
      3,
      3600
    ) THEN
      n := n + 1;
    END IF;
  END LOOP;

  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.recover_stale_processing_payouts(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recover_stale_processing_payouts(INTEGER) TO service_role;

-- -----------------------------------------------------------------------------
-- Legacy finalize: kept for compatibility — now only used if old code paths exist.
-- Deduct + insert completed in one step (no processing row). Prefer new flow.
-- -----------------------------------------------------------------------------
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
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE cleaner_id = p_cleaner_id AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient balance or wallet missing for cleaner';
  END IF;

  INSERT INTO public.wallet_transactions (
    cleaner_id, booking_id, amount, type, status, paystack_reference, updated_at
  )
  VALUES (
    p_cleaner_id, NULL, p_amount, 'payout', 'completed', p_paystack_reference, NOW()
  )
  RETURNING id INTO tid;

  RETURN tid;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_cleaner_payout(UUID, BIGINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_cleaner_payout(UUID, BIGINT, TEXT) TO service_role;

-- -----------------------------------------------------------------------------
-- record_failed_payout_attempt: optional link to idempotency + no balance move
-- (used when transfer API fails before processing row exists — legacy)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_failed_payout_attempt(
  p_cleaner_id UUID,
  p_amount BIGINT,
  p_error_message TEXT,
  p_idempotency_key TEXT DEFAULT NULL
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
    cleaner_id, booking_id, amount, type, status, meta, idempotency_key, updated_at
  )
  VALUES (
    p_cleaner_id,
    NULL,
    GREATEST(COALESCE(p_amount, 0), 1),
    'payout',
    'failed',
    jsonb_build_object('error', LEFT(COALESCE(p_error_message, 'unknown'), 2000)),
    NULLIF(trim(COALESCE(p_idempotency_key, '')), ''),
    NOW()
  )
  RETURNING id INTO tid;

  RETURN tid;
END;
$$;

REVOKE ALL ON FUNCTION public.record_failed_payout_attempt(UUID, BIGINT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_failed_payout_attempt(UUID, BIGINT, TEXT, TEXT) TO service_role;
