-- ============================================
-- FIX BEAULLA BOOKING: SCS-21850857
-- ============================================
-- This booking needs:
--   - Tip: R50.00 (5000 cents)
--   - Total: R610.00 (61000 cents) - already correct
--   - Service cost: R560.00 (56000 cents) - includes service_fee of R50.00
--   - Cleaner earnings should be recalculated with tip
-- ============================================

-- Update the specific booking
UPDATE bookings b
SET 
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
WHERE b.id = 'SCS-21850857';

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
  b.tip_amount,
  b.cleaner_earnings,
  ROUND(b.total_amount / 100.0, 2) as total_rand,
  ROUND(COALESCE(b.service_fee, 0) / 100.0, 2) as service_fee_rand,
  ROUND(COALESCE(b.tip_amount, 0) / 100.0, 2) as tip_rand,
  ROUND(b.cleaner_earnings / 100.0, 2) as cleaner_earnings_rand,
  -- Breakdown
  ROUND((56000 - COALESCE(b.service_fee, 0)) / 100.0, 2) as service_subtotal_rand,
  CASE 
    WHEN c.hire_date IS NOT NULL 
      AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.hire_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.hire_date)) >= 4
    THEN '70%'
    ELSE '60%'
  END as commission_rate,
  ROUND((b.cleaner_earnings - COALESCE(b.tip_amount, 0)) / 100.0, 2) as commission_earnings_rand,
  ROUND(COALESCE(b.tip_amount, 0) / 100.0, 2) as tip_earnings_rand,
  -- Expected values
  'R610.00' as expected_total,
  'R50.00' as expected_tip
FROM bookings b
LEFT JOIN cleaners c ON (
  b.cleaner_id IS NOT NULL 
  AND b.cleaner_id != 'manual'
  AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND b.cleaner_id::uuid = c.id
)
WHERE b.id = 'SCS-21850857';

