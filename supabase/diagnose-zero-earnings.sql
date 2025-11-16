-- ============================================
-- DIAGNOSE BOOKINGS WITH ZERO CLEANER EARNINGS
-- ============================================
-- This query helps identify why bookings have cleaner_earnings = 0
-- ============================================

-- Find all bookings with zero or null cleaner_earnings
SELECT 
  b.id,
  b.booking_date,
  b.service_type,
  b.status,
  b.total_amount,
  b.service_fee,
  b.cleaner_earnings,
  b.cleaner_id,
  c.name as cleaner_name,
  c.hire_date,
  CASE 
    WHEN b.total_amount IS NULL THEN '❌ Total amount is NULL'
    WHEN b.total_amount = 0 THEN '❌ Total amount is 0'
    WHEN b.cleaner_id IS NULL THEN '⚠️ Cleaner not assigned (unassigned booking)'
    WHEN b.cleaner_id = 'manual' THEN '⚠️ Manual assignment (no cleaner ID)'
    WHEN LOWER(b.service_type) LIKE '%deep%' OR LOWER(b.service_type) LIKE '%move%' THEN '⚠️ Team booking - earnings calculated on team assignment'
    WHEN c.hire_date IS NULL AND b.cleaner_id IS NOT NULL THEN '⚠️ Cleaner has no hire_date (defaulting to 60%)'
    WHEN b.cleaner_earnings IS NULL THEN '❌ cleaner_earnings is NULL (never calculated)'
    WHEN b.cleaner_earnings = 0 AND b.total_amount > 0 THEN '⚠️ Earnings calculated as 0 (possible calculation issue)'
    ELSE '✅ Should have earnings'
  END as issue_reason,
  -- Calculate what the earnings should be
  CASE 
    WHEN b.total_amount IS NULL OR b.total_amount = 0 THEN 0
    WHEN b.cleaner_id IS NULL OR b.cleaner_id = 'manual' THEN 
      ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 0.60)
    WHEN c.hire_date IS NULL THEN
      ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 0.60)
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.hire_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.hire_date)) >= 4 THEN
      ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 0.70)
    ELSE
      ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 0.60)
  END as calculated_earnings,
  -- Show amounts in Rands for readability
  ROUND(b.total_amount / 100.0, 2) as total_rand,
  ROUND(COALESCE(b.service_fee, 0) / 100.0, 2) as service_fee_rand,
  ROUND(COALESCE(b.cleaner_earnings, 0) / 100.0, 2) as current_earnings_rand
FROM bookings b
LEFT JOIN cleaners c ON (
  b.cleaner_id IS NOT NULL 
  AND b.cleaner_id != 'manual'
  AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND b.cleaner_id::uuid = c.id
)
WHERE b.cleaner_earnings IS NULL 
   OR b.cleaner_earnings = 0
ORDER BY b.created_at DESC
LIMIT 50;

-- Summary statistics
SELECT 
  'Total bookings with zero/null earnings' as metric,
  COUNT(*) as count
FROM bookings
WHERE cleaner_earnings IS NULL OR cleaner_earnings = 0

UNION ALL

SELECT 
  'Unassigned bookings (no cleaner_id)' as metric,
  COUNT(*) as count
FROM bookings
WHERE (cleaner_earnings IS NULL OR cleaner_earnings = 0)
  AND (cleaner_id IS NULL OR cleaner_id = 'manual')

UNION ALL

SELECT 
  'Team bookings (Deep/Move In/Out)' as metric,
  COUNT(*) as count
FROM bookings
WHERE (cleaner_earnings IS NULL OR cleaner_earnings = 0)
  AND (LOWER(service_type) LIKE '%deep%' OR LOWER(service_type) LIKE '%move%')

UNION ALL

SELECT 
  'Assigned bookings with zero earnings' as metric,
  COUNT(*) as count
FROM bookings b
WHERE (b.cleaner_earnings IS NULL OR b.cleaner_earnings = 0)
  AND b.cleaner_id IS NOT NULL 
  AND b.cleaner_id != 'manual'
  AND b.total_amount > 0
  AND NOT (LOWER(b.service_type) LIKE '%deep%' OR LOWER(b.service_type) LIKE '%move%');

-- Fix query: Recalculate earnings for bookings that should have earnings
-- (Uncomment and run after reviewing the diagnostics above)
/*
UPDATE bookings b
SET cleaner_earnings = CASE
  -- For unassigned bookings, calculate as if 60% commission
  WHEN b.cleaner_id IS NULL OR b.cleaner_id = 'manual' THEN
    ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 0.60)
  -- For assigned bookings with cleaners
  WHEN b.cleaner_id IS NOT NULL AND c.hire_date IS NOT NULL THEN
    ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 
          CASE 
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.hire_date)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.hire_date)) >= 4 
            THEN 0.70  -- 70% for 4+ months experience
            ELSE 0.60  -- 60% for < 4 months experience
          END)
  -- Default 60% for cleaners without hire_date
  ELSE ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 0.60)
END
FROM cleaners c
WHERE b.cleaner_id IS NOT NULL
  AND b.cleaner_id != 'manual'
  AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND b.cleaner_id::uuid = c.id
  AND (b.cleaner_earnings IS NULL OR b.cleaner_earnings = 0)
  AND b.total_amount > 0
  -- Exclude team bookings (they get earnings on team assignment)
  AND NOT (LOWER(b.service_type) LIKE '%deep%' OR LOWER(b.service_type) LIKE '%move%');
*/

