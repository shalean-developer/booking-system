-- Allow cleaners to claim paid bookings (pay-later flow uses status = paid after Paystack)
-- and require a payment reference before claim (blocks unpaid pending rows).

-- Postgres cannot change the OUT/return row type with CREATE OR REPLACE alone; drop first.
DROP FUNCTION IF EXISTS claim_booking_safe(TEXT, TEXT, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION claim_booking_safe(
  booking_id_param TEXT,
  cleaner_id_param TEXT,
  claimed_at_param TIMESTAMPTZ
)
RETURNS TABLE(
  id TEXT,
  status TEXT,
  cleaner_id TEXT,
  customer_name TEXT,
  booking_date TEXT,
  booking_time TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_row RECORD;
BEGIN
  UPDATE bookings
  SET
    cleaner_id = cleaner_id_param::UUID,
    cleaner_claimed_at = claimed_at_param
  WHERE
    id = booking_id_param
    AND cleaner_id IS NULL
    AND status IN ('pending', 'paid')
    AND (
      (payment_reference IS NOT NULL AND payment_reference <> '')
      OR (paystack_ref IS NOT NULL AND paystack_ref <> '')
    )
  RETURNING
    bookings.id,
    bookings.status,
    bookings.cleaner_id::TEXT,
    bookings.customer_name,
    bookings.booking_date,
    bookings.booking_time
  INTO result_row;

  RETURN QUERY SELECT
    result_row.id,
    result_row.status,
    result_row.cleaner_id,
    result_row.customer_name,
    result_row.booking_date,
    result_row.booking_time;
END;
$$;

GRANT EXECUTE ON FUNCTION claim_booking_safe(TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_booking_safe(TEXT, TEXT, TIMESTAMPTZ) TO anon;
