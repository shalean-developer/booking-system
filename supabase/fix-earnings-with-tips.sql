-- ============================================
-- AUTO-FIX EARNINGS WITH TIPS (USE WITH CARE)
-- ============================================
-- Purpose:
-- Fix bookings where cleaner_earnings != expected_earnings
-- Formula:
--   expected = round((total - service_fee - tip) * rate) + tip
--   rate = 0.60 (<4 months or no hire_date) | 0.70 (>=4 months)
--
-- Safety:
-- - Only fixes rows where total_amount IS NOT NULL
-- - Validates cleaner_id format
-- - Skips rows where fields are NULL unexpectedly
-- ============================================

WITH enriched AS (
  SELECT
    b.id,
    b.total_amount,
    COALESCE(b.service_fee, 0) AS service_fee,
    COALESCE(b.tip_amount, 0) AS tip_amount,
    COALESCE(b.cleaner_earnings, 0) AS cleaner_earnings,
    b.cleaner_id,
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
    END AS rate,
    ROUND(((b.total_amount - COALESCE(b.service_fee,0) - COALESCE(b.tip_amount,0)) * 
            CASE
              WHEN b.cleaner_id IS NOT NULL
                AND b.cleaner_id != 'manual'
                AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                AND c.hire_date IS NOT NULL
                AND (EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.hire_date)) * 12
                     + EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.hire_date))) >= 4
              THEN 0.70 ELSE 0.60
            END)) 
      + COALESCE(b.tip_amount,0) AS expected_earnings
  FROM bookings b
  LEFT JOIN cleaners c ON (
    b.cleaner_id IS NOT NULL
    AND b.cleaner_id != 'manual'
    AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND b.cleaner_id::uuid = c.id
  )
  WHERE b.total_amount IS NOT NULL
)
UPDATE bookings b
SET cleaner_earnings = e.expected_earnings
FROM enriched e
WHERE b.id = e.id
  AND ABS(e.expected_earnings - e.cleaner_earnings) >= 1; -- avoid 1c rounding noise

-- Verification (post-fix): should return zero rows
WITH enriched AS (
  SELECT
    b.id,
    b.total_amount,
    COALESCE(b.service_fee, 0) AS service_fee,
    COALESCE(b.tip_amount, 0) AS tip_amount,
    COALESCE(b.cleaner_earnings, 0) AS cleaner_earnings,
    b.cleaner_id,
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
SELECT e.id
FROM enriched e
WHERE
  ABS(
    (ROUND(((e.total_amount - e.service_fee - e.tip_amount) * e.rate)) + e.tip_amount)
    - e.cleaner_earnings
  ) >= 1
LIMIT 10;


