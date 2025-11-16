-- ============================================
-- VERIFY EARNINGS WITH TIPS - DIAGNOSTIC REPORT
-- ============================================
-- Purpose:
-- 1) Find bookings where cleaner_earnings do not match the expected formula:
--    cleaner_earnings = (total_amount - service_fee - tip_amount) * rate + tip_amount
--    where rate is 0.60 (<4 months) or 0.70 (>=4 months)
-- 2) Show deltas and suggested fixes
--
-- Notes:
-- - Works safely with manual/NULL cleaner_id
-- - Uses UUID validation for cleaner_id
-- - Only checks rows with non-null total_amount
-- ============================================

WITH enriched AS (
  SELECT
    b.id,
    b.booking_date,
    b.status,
    b.service_type,
    b.total_amount,
    COALESCE(b.service_fee, 0) AS service_fee,
    COALESCE(b.tip_amount, 0) AS tip_amount,
    COALESCE(b.cleaner_earnings, 0) AS cleaner_earnings,
    b.cleaner_id,
    c.name AS cleaner_name,
    c.hire_date,
    CASE
      WHEN b.cleaner_id IS NOT NULL
        AND b.cleaner_id != 'manual'
        AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND c.hire_date IS NOT NULL
        AND (EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.hire_date)) * 12
             + EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.hire_date))) >= 4
      THEN 0.70
      ELSE 0.60
    END AS rate
  FROM bookings b
  LEFT JOIN cleaners c ON (
    b.cleaner_id IS NOT NULL
    AND b.cleaner_id != 'manual'
    AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND b.cleaner_id::uuid = c.id
  )
  WHERE b.total_amount IS NOT NULL
)
SELECT
  e.id,
  e.booking_date,
  e.status,
  e.service_type,
  e.cleaner_name,
  e.total_amount,
  e.service_fee,
  e.tip_amount,
  e.cleaner_earnings,
  -- expected = round((total - service_fee - tip) * rate) + tip
  ROUND(((e.total_amount - e.service_fee - e.tip_amount) * e.rate)) + e.tip_amount AS expected_earnings,
  (ROUND(((e.total_amount - e.service_fee - e.tip_amount) * e.rate)) + e.tip_amount) - e.cleaner_earnings AS delta,
  ROUND(e.total_amount / 100.0, 2) AS total_rand,
  ROUND(e.service_fee / 100.0, 2) AS service_fee_rand,
  ROUND(e.tip_amount / 100.0, 2) AS tip_rand,
  ROUND(e.cleaner_earnings / 100.0, 2) AS cleaner_earnings_rand
FROM enriched e
WHERE
  -- Only show mismatches greater than 1 cent to avoid rounding noise
  ABS(
    (ROUND(((e.total_amount - e.service_fee - e.tip_amount) * e.rate)) + e.tip_amount)
    - e.cleaner_earnings
  ) >= 1
ORDER BY e.booking_date DESC, e.id DESC;


