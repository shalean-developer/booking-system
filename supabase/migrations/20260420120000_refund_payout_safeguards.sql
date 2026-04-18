-- Refund / payout integrity: allow marking bookings as blocked from payout, and exclude
-- refunded-job earnings from get_eligible_payout_cents (wallet eligibility).

DO $$
DECLARE
  cname TEXT;
BEGIN
  FOR cname IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'bookings'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%payout_status%'
  LOOP
    EXECUTE format('ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS %I', cname);
  END LOOP;
END $$;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payout_status_check
  CHECK (payout_status IN ('pending', 'paid', 'blocked'));

COMMENT ON COLUMN public.bookings.payout_status IS
  'pending | paid | blocked (e.g. refund — do not include in payout eligibility).';

-- Eligible payout: exclude earning rows tied to refunded bookings (financial integrity).
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
        WHEN wt.type = 'earning'
          AND wt.status = 'completed'
          AND (wt.available_for_payout_at IS NULL OR wt.available_for_payout_at <= NOW())
          AND (
            wt.booking_id IS NULL
            OR NOT EXISTS (
              SELECT 1
              FROM public.bookings b
              WHERE b.id = wt.booking_id
                AND LOWER(COALESCE(b.payment_status, '')) = 'refunded'
            )
          )
        THEN wt.amount
        ELSE 0
      END
    ),
    0
  ) - COALESCE(
    SUM(
      CASE
        WHEN wt.type = 'payout'
          AND wt.status IN ('completed', 'processing')
        THEN wt.amount
        ELSE 0
      END
    ),
    0
  )
  FROM public.wallet_transactions wt
  WHERE wt.cleaner_id = p_cleaner_id;
$$;

REVOKE ALL ON FUNCTION public.get_eligible_payout_cents(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_eligible_payout_cents(UUID) TO service_role;
