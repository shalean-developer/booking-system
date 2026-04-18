-- Track last failure type per Paystack reference; extend RPC with p_failure_type.

ALTER TABLE public.payment_validation_failure_counters
  ADD COLUMN IF NOT EXISTS last_failure_type text;

COMMENT ON COLUMN public.payment_validation_failure_counters.last_failure_type IS
  'Most recent validation failure category (e.g. payment_amount_mismatch).';

DROP FUNCTION IF EXISTS public.record_payment_validation_failure(text);

CREATE OR REPLACE FUNCTION public.record_payment_validation_failure(
  p_reference text,
  p_failure_type text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_ref text;
  v_ft text;
BEGIN
  v_ref := trim(p_reference);
  IF v_ref IS NULL OR length(v_ref) = 0 THEN
    RETURN 0;
  END IF;

  v_ft := trim(coalesce(p_failure_type, ''));

  INSERT INTO public.payment_validation_failure_counters (
    payment_reference,
    failure_count,
    last_failure_type,
    updated_at
  )
  VALUES (
    v_ref,
    1,
    CASE WHEN length(v_ft) > 0 THEN v_ft ELSE NULL END,
    now()
  )
  ON CONFLICT (payment_reference) DO UPDATE
    SET failure_count = public.payment_validation_failure_counters.failure_count + 1,
        last_failure_type = CASE
          WHEN length(v_ft) > 0 THEN v_ft
          ELSE public.payment_validation_failure_counters.last_failure_type
        END,
        updated_at = now()
  RETURNING failure_count INTO v_count;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.record_payment_validation_failure(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_payment_validation_failure(text, text) TO service_role;
