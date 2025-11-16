-- ============================================
-- FIX BEAULLA BOOKING WITH TIP
-- ============================================
-- This query fixes a specific booking for Beaulla
-- Booking details:
-- - Tip: R50.00 (5000 cents)
-- - Booking cost: R560.00 (56000 cents) - includes service fee
-- - Final total: R610.00 (61000 cents)
-- ============================================

-- IMPORTANT: First run the migration to add tip_amount column:
-- File: supabase/migrations/add-tip-amount.sql
-- Or run this command first:
-- ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tip_amount INTEGER DEFAULT 0;

-- STEP 1: First, find the booking for Beaulla
-- Copy the booking ID from the results and use it in STEP 2
SELECT 
  b.id,
  b.booking_date,
  b.service_type,
  b.status,
  b.total_amount,
  b.service_fee,
  COALESCE(b.tip_amount, 0) as tip_amount,
  b.cleaner_earnings as current_earnings,
  b.cleaner_id,
  c.name as cleaner_name,
  b.customer_name,
  ROUND(b.total_amount / 100.0, 2) as total_rand,
  ROUND(COALESCE(b.service_fee, 0) / 100.0, 2) as service_fee_rand,
  ROUND(COALESCE(b.tip_amount, 0) / 100.0, 2) as current_tip_rand,
  ROUND(COALESCE(b.cleaner_earnings, 0) / 100.0, 2) as current_earnings_rand
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
LIMIT 10;

-- STEP 1.5: Add tip_amount column if it doesn't exist
-- Run this FIRST if you get an error about tip_amount column not existing
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tip_amount INTEGER DEFAULT 0;
COMMENT ON COLUMN bookings.tip_amount IS 'Tip amount in cents (goes 100% to cleaner, separate from commission earnings)';

-- STEP 2: Update the booking with correct tip and total
-- IMPORTANT: Replace 'YOUR_BOOKING_ID_HERE' with the actual booking ID from STEP 1
-- 
-- Booking details:
--   - Total: R610.00 (61000 cents) - includes tip
--   - Tip: R50.00 (5000 cents)
--   - Service cost: R560.00 (56000 cents) - includes service fee
-- 
-- Calculation:
--   - Service subtotal = 56000 - service_fee
--   - Cleaner earnings = (service_subtotal × commission_rate) + tip_amount
--   - Commission rate: 60% if hire_date is null or < 4 months, 70% if >= 4 months

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
WHERE b.id = 'YOUR_BOOKING_ID_HERE';

-- STEP 3: Verify the update
-- Replace 'YOUR_BOOKING_ID_HERE' with the actual booking ID
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
WHERE b.id = 'YOUR_BOOKING_ID_HERE';

