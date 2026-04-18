-- DB-level payout safety: eligible check + transaction-scoped advisory lock (per cleaner)
-- inside initiate_payout_processing. Also: RPC to detect wallet rows tied to refunded bookings.

CREATE OR REPLACE FUNCTION public.initiate_payout_processing(
  p_cleaner_id UUID,
  p_amount BIGINT,
  p_idempotency_key TEXT,
  p_payout_batch_id TEXT DEFAULT NULL
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
  v_eligible BIGINT;
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

  PERFORM pg_advisory_xact_lock(884201, hashtext(p_cleaner_id::text));

  v_eligible := public.get_eligible_payout_cents(p_cleaner_id);

  IF p_amount > v_eligible THEN
    RAISE EXCEPTION 'Payout exceeds eligible amount';
  END IF;

  UPDATE public.cleaner_wallets
  SET balance = balance - p_amount, updated_at = NOW()
  WHERE cleaner_id = p_cleaner_id AND balance >= p_amount;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'insufficient_wallet_balance';
  END IF;

  INSERT INTO public.wallet_transactions (
    cleaner_id, booking_id, amount, type, status,
    idempotency_key, payout_batch_id, processing_started_at, updated_at
  )
  VALUES (
    p_cleaner_id, NULL, p_amount, 'payout', 'processing',
    p_idempotency_key, NULLIF(trim(COALESCE(p_payout_batch_id, '')), ''), NOW(), NOW()
  )
  RETURNING id INTO new_id;

  wallet_tx_id := new_id;
  is_duplicate := FALSE;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.initiate_payout_processing(UUID, BIGINT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.initiate_payout_processing(UUID, BIGINT, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.cleaner_has_refunded_booking_with_earning(p_cleaner_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.wallet_transactions wt
    INNER JOIN public.bookings b ON b.id = wt.booking_id
    WHERE wt.cleaner_id = p_cleaner_id
      AND wt.type = 'earning'
      AND wt.status = 'completed'
      AND wt.amount > 0
      AND LOWER(COALESCE(b.payment_status, '')) = 'refunded'
  );
$$;

REVOKE ALL ON FUNCTION public.cleaner_has_refunded_booking_with_earning(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleaner_has_refunded_booking_with_earning(UUID) TO service_role;

COMMENT ON FUNCTION public.cleaner_has_refunded_booking_with_earning(UUID) IS
  'True if cleaner has completed earning rows still linked to refunded bookings (reconcile wallet vs refunds).';
