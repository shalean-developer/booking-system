-- SQL Script to Update Booking Amounts
-- This script helps fix bookings with missing total_amount values
-- Run this in Supabase SQL Editor

-- ==============================================
-- STEP 1: Check bookings with missing amounts
-- ==============================================
SELECT 
  id,
  booking_date,
  customer_name,
  status,
  total_amount,
  CASE 
    WHEN price_snapshot IS NOT NULL THEN 'Has price_snapshot'
    ELSE 'No price_snapshot'
  END as snapshot_status
FROM bookings
WHERE (total_amount IS NULL OR total_amount = 0)
  AND booking_date = CURRENT_DATE
  AND status = 'completed'
ORDER BY booking_date DESC;

-- ==============================================
-- STEP 2: View price_snapshot content for debugging
-- ==============================================
SELECT 
  id,
  customer_name,
  booking_date,
  total_amount,
  price_snapshot
FROM bookings
WHERE booking_date = CURRENT_DATE
  AND status = 'completed'
  AND (total_amount IS NULL OR total_amount = 0);

-- ==============================================
-- STEP 3: Update booking amount from price_snapshot (if it exists)
-- ==============================================
-- NOTE: Adjust the booking ID below to match your specific booking
-- The ID from the logs is: BK-1762075705763-rmdbr40x0

UPDATE bookings
SET total_amount = (
  CASE 
    WHEN price_snapshot::jsonb->>'total' IS NOT NULL 
    THEN (price_snapshot::jsonb->>'total')::integer
    WHEN price_snapshot::jsonb->>'totalAmount' IS NOT NULL 
    THEN (price_snapshot::jsonb->>'totalAmount')::integer
    ELSE NULL
  END
)
WHERE id = 'BK-1762075705763-rmdbr40x0'  -- Replace with actual booking ID
  AND (total_amount IS NULL OR total_amount = 0)
  AND price_snapshot IS NOT NULL;

-- ==============================================
-- STEP 4: Verify the update
-- ==============================================
SELECT 
  id,
  customer_name,
  booking_date,
  total_amount,
  ROUND(total_amount / 100.0, 2) as total_rands
FROM bookings
WHERE id = 'BK-1762075705763-rmdbr40x0';  -- Replace with actual booking ID

