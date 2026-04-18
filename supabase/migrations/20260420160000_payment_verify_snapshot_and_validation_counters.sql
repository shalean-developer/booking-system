-- Audit: Paystack verify snapshot on successful payment finalize + validation failure counters for alerting.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS paid_amount_minor bigint,
  ADD COLUMN IF NOT EXISTS paid_currency text,
  ADD COLUMN IF NOT EXISTS paystack_verified_at timestamptz;

COMMENT ON COLUMN public.bookings.paid_amount_minor IS
  'Amount in Paystack/API minor units (e.g. ZAR cents) from verify response at successful finalize.';
COMMENT ON COLUMN public.bookings.paid_currency IS 'ISO currency from Paystack verify at finalize (e.g. ZAR).';
COMMENT ON COLUMN public.bookings.paystack_verified_at IS 'Server time when Paystack verify succeeded and finalize ran.';

CREATE TABLE IF NOT EXISTS public.payment_validation_failure_counters (
  payment_reference text PRIMARY KEY,
  failure_count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_validation_failure_counters_updated_at
  ON public.payment_validation_failure_counters (updated_at DESC);

COMMENT ON TABLE public.payment_validation_failure_counters IS
  'Increments per Paystack reference on payment_amount_mismatch / invalid_currency / payment_reference_mismatch for alerting.';

ALTER TABLE public.payment_validation_failure_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_validation_failure_counters_no_access"
  ON public.payment_validation_failure_counters
  FOR ALL USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.record_payment_validation_failure(p_reference text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_ref text;
BEGIN
  v_ref := trim(p_reference);
  IF v_ref IS NULL OR length(v_ref) = 0 THEN
    RETURN 0;
  END IF;

  INSERT INTO public.payment_validation_failure_counters (payment_reference, failure_count, updated_at)
  VALUES (v_ref, 1, now())
  ON CONFLICT (payment_reference) DO UPDATE
    SET failure_count = public.payment_validation_failure_counters.failure_count + 1,
        updated_at = now()
  RETURNING failure_count INTO v_count;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.record_payment_validation_failure(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_payment_validation_failure(text) TO service_role;
