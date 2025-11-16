-- ============================================
-- QUICK FIX: Update Beaulla's booking with tip
-- ============================================
-- This query will update the most recent booking for Beaulla
-- with the correct tip and total amounts
-- ============================================

-- Option 1: Update by booking ID (if you know it)
-- Replace 'YOUR_BOOKING_ID' with the actual booking ID from STEP 1
/*
UPDATE bookings b
SET 
  total_amount = 61000,
  tip_amount = 5000,
  cleaner_earnings = (
    CASE 
      WHEN b.cleaner_id IS NOT NULL 
        AND b.cleaner_id != 'manual'
        AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND EXISTS (
          SELECT 1 
          FROM cleaners c 
          WHERE c.id = b.cleaner_id::uuid
            AND c.hire_date IS NOT NULL
            AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.hire_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.hire_date)) >= 4
        )
      THEN ROUND((56000 - COALESCE(b.service_fee, 0)) * 0.70) + 5000
      ELSE ROUND((56000 - COALESCE(b.service_fee, 0)) * 0.60) + 5000
    END
  )
WHERE b.id = 'YOUR_BOOKING_ID';
*/

-- Option 2: Update the most recent booking for Beaulla automatically
UPDATE bookings b
SET 
  total_amount = 61000,
  tip_amount = 5000,
  cleaner_earnings = (
    CASE 
      WHEN b.cleaner_id IS NOT NULL 
        AND b.cleaner_id != 'manual'
        AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND EXISTS (
          SELECT 1 
          FROM cleaners c 
          WHERE c.id = b.cleaner_id::uuid
            AND c.hire_date IS NOT NULL
            AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.hire_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.hire_date)) >= 4
        )
      THEN ROUND((56000 - COALESCE(b.service_fee, 0)) * 0.70) + 5000
      ELSE ROUND((56000 - COALESCE(b.service_fee, 0)) * 0.60) + 5000
    END
  )
WHERE b.id = (
  SELECT b2.id
  FROM bookings b2
  LEFT JOIN cleaners c ON (
    b2.cleaner_id IS NOT NULL 
    AND b2.cleaner_id != 'manual'
    AND b2.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    AND b2.cleaner_id::uuid = c.id
  )
  WHERE 
    (LOWER(c.name) LIKE '%beaulla%' OR LOWER(b2.customer_name) LIKE '%beaulla%')
    AND b2.booking_date >= CURRENT_DATE - INTERVAL '7 days'
    AND (b2.total_amount != 61000 OR COALESCE(b2.tip_amount, 0) != 5000)
  ORDER BY b2.booking_date DESC, b2.created_at DESC
  LIMIT 1
);

-- Verify the update
SELECT 
  b.id,
  b.booking_date,
  b.service_type,
  b.status,
  b.customer_name,
  c.name as cleaner_name,
  b.total_amount,
  b.service_fee,
  COALESCE(b.tip_amount, 0) as tip_amount,
  b.cleaner_earnings,
  ROUND(b.total_amount / 100.0, 2) as total_rand,
  ROUND(COALESCE(b.service_fee, 0) / 100.0, 2) as service_fee_rand,
  ROUND(COALESCE(b.tip_amount, 0) / 100.0, 2) as tip_rand,
  ROUND(b.cleaner_earnings / 100.0, 2) as cleaner_earnings_rand,
  ROUND((56000 - COALESCE(b.service_fee, 0)) / 100.0, 2) as service_subtotal_rand,
  CASE 
    WHEN c.hire_date IS NOT NULL 
      AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.hire_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.hire_date)) >= 4
    THEN '70%'
    ELSE '60%'
  END as commission_rate,
  ROUND((b.cleaner_earnings - COALESCE(b.tip_amount, 0)) / 100.0, 2) as commission_earnings_rand,
  ROUND(COALESCE(b.tip_amount, 0) / 100.0, 2) as tip_earnings_rand
FROM bookings b
LEFT JOIN cleaners c ON (
  b.cleaner_id IS NOT NULL 
  AND b.cleaner_id != 'manual'
  AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND b.cleaner_id::uuid = c.id
)
WHERE 
  (LOWER(c.name) LIKE '%beaulla%' OR LOWER(b.customer_name) LIKE '%beaulla%')
  AND b.booking_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY b.booking_date DESC, b.created_at DESC
LIMIT 1;

