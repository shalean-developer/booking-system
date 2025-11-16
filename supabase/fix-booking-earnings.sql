-- ============================================
-- FIX SPECIFIC BOOKING EARNINGS
-- ============================================
-- This query fixes cleaner earnings for a specific booking
-- Replace 'BEAULLA' with the actual cleaner name or booking ID
-- ============================================

-- First, find the booking
SELECT 
  b.id,
  b.booking_date,
  b.service_type,
  b.status,
  b.total_amount,
  b.service_fee,
  b.cleaner_earnings as current_earnings,
  b.cleaner_id,
  b.customer_name,
  c.name as cleaner_name,
  c.hire_date,
  -- Calculate what earnings should be
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
  END as should_be_earnings,
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
WHERE 
  -- Find today's booking with Farai as customer
  b.booking_date = CURRENT_DATE
  AND LOWER(b.customer_name) LIKE '%farai%'
  -- OR find by cleaner name (uncomment and adjust as needed)
  -- AND LOWER(c.name) LIKE '%beaulla%'
ORDER BY b.created_at DESC;

-- Fix the earnings for this specific booking
-- Uncomment and run after verifying the booking above
/*
UPDATE bookings b
SET cleaner_earnings = CASE
  -- If cleaner has hire_date, use experience-based calculation
  WHEN b.cleaner_id IS NOT NULL 
       AND b.cleaner_id != 'manual'
       AND c.hire_date IS NOT NULL THEN
    ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 
          CASE 
            WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.hire_date)) * 12 + 
                 EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.hire_date)) >= 4 
            THEN 0.70  -- 70% for 4+ months experience
            ELSE 0.60  -- 60% for < 4 months experience
          END)
  -- Default 60% for cleaners without hire_date or unassigned
  ELSE ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 0.60)
END
FROM cleaners c
WHERE b.cleaner_id IS NOT NULL
  AND b.cleaner_id != 'manual'
  AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND b.cleaner_id::uuid = c.id
  AND b.booking_date = CURRENT_DATE
  AND LOWER(b.customer_name) LIKE '%farai%'
  -- Ensure we don't override team bookings (they get earnings on team assignment)
  AND NOT (LOWER(b.service_type) LIKE '%deep%' OR LOWER(b.service_type) LIKE '%move%')
  -- Only fix if earnings are 0 or null
  AND (b.cleaner_earnings IS NULL OR b.cleaner_earnings = 0)
  -- Only fix if total_amount exists and is greater than 0
  AND b.total_amount > 0;

-- Verify the fix
SELECT 
  b.id,
  b.booking_date,
  b.service_type,
  b.customer_name,
  c.name as cleaner_name,
  ROUND(b.total_amount / 100.0, 2) as total_rand,
  ROUND(b.service_fee / 100.0, 2) as service_fee_rand,
  ROUND(b.cleaner_earnings / 100.0, 2) as cleaner_earnings_rand,
  ROUND((b.total_amount - b.service_fee - b.cleaner_earnings) / 100.0, 2) as company_earnings_rand,
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.hire_date)) * 12 + 
         EXTRACT(MONTH FROM AGE(CURRENT_DATE, c.hire_date)) >= 4 
    THEN '70% (Experienced)'
    ELSE '60% (New)'
  END as commission_rate
FROM bookings b
LEFT JOIN cleaners c ON (
  b.cleaner_id IS NOT NULL 
  AND b.cleaner_id != 'manual'
  AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND b.cleaner_id::uuid = c.id
)
WHERE b.booking_date = CURRENT_DATE
  AND LOWER(b.customer_name) LIKE '%farai%';
*/

