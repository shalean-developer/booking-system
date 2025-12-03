-- Complete All Past Bookings with Pending Status
-- Purpose: Update all past bookings that still have 'pending' status to 'completed'
-- This ensures that bookings from the past are properly marked as completed
-- Date: January 2025

-- ==============================================
-- STEP 1: VERIFICATION QUERY (Run this first to see what will be updated)
-- ==============================================
SELECT 
  id, 
  booking_date, 
  booking_time, 
  status, 
  customer_name,
  customer_email,
  cleaner_id,
  total_amount,
  cleaner_earnings
FROM bookings
WHERE status = 'pending'
  AND booking_date < CURRENT_DATE
ORDER BY booking_date DESC, booking_time;

-- ==============================================
-- STEP 2: COUNT QUERY (See how many records will be affected)
-- ==============================================
SELECT 
  COUNT(*) as records_to_update,
  COUNT(DISTINCT booking_date) as unique_dates,
  MIN(booking_date) as oldest_booking,
  MAX(booking_date) as newest_booking,
  ROUND(SUM(total_amount) / 100.0, 2) as total_revenue_rands,
  ROUND(SUM(cleaner_earnings) / 100.0, 2) as total_cleaner_earnings_rands
FROM bookings
WHERE status = 'pending'
  AND booking_date < CURRENT_DATE;

-- ==============================================
-- STEP 3: UPDATE STATEMENT (Execute this to mark bookings as completed)
-- ==============================================
BEGIN;

UPDATE bookings
SET 
  status = 'completed',
  cleaner_completed_at = COALESCE(cleaner_completed_at, CURRENT_TIMESTAMP),
  updated_at = CURRENT_TIMESTAMP
WHERE status = 'pending'
  AND booking_date < CURRENT_DATE;

COMMIT;

-- ==============================================
-- STEP 4: VERIFICATION QUERY (Confirm the changes were applied)
-- ==============================================
SELECT 
  COUNT(*) as completed_count,
  COUNT(DISTINCT booking_date) as unique_dates,
  MIN(booking_date) as oldest_booking,
  MAX(booking_date) as newest_booking
FROM bookings
WHERE status = 'completed'
  AND booking_date < CURRENT_DATE
  AND cleaner_completed_at >= CURRENT_DATE - INTERVAL '1 minute';

-- ==============================================
-- STEP 5: FINAL CHECK (Show some of the updated records)
-- ==============================================
SELECT 
  id, 
  booking_date, 
  booking_time, 
  status, 
  customer_name,
  cleaner_id,
  cleaner_completed_at,
  ROUND(total_amount / 100.0, 2) as total_amount_rands
FROM bookings
WHERE status = 'completed'
  AND booking_date < CURRENT_DATE
  AND cleaner_completed_at >= CURRENT_DATE - INTERVAL '1 minute'
ORDER BY cleaner_completed_at DESC
LIMIT 20;

-- ==============================================
-- STEP 6: SUMMARY BY DATE (Optional - see distribution)
-- ==============================================
SELECT 
  booking_date,
  COUNT(*) as bookings_completed,
  ROUND(SUM(total_amount) / 100.0, 2) as total_revenue_rands
FROM bookings
WHERE status = 'completed'
  AND booking_date < CURRENT_DATE
  AND cleaner_completed_at >= CURRENT_DATE - INTERVAL '1 minute'
GROUP BY booking_date
ORDER BY booking_date DESC;

