-- Revert December Bookings Status
-- Purpose: Change December bookings with 'completed' status back to 'pending'
-- Exception: Keep bookings on December 1, 2, or 3 as completed
-- Date: January 2025

-- ==============================================
-- STEP 1: CHECK ALL DECEMBER COMPLETED BOOKINGS
-- ==============================================
SELECT 
  id, 
  booking_date, 
  booking_time, 
  status, 
  customer_name,
  customer_email,
  cleaner_id,
  ROUND(total_amount / 100.0, 2) as total_amount_rands,
  cleaner_completed_at
FROM bookings
WHERE status = 'completed'
  AND EXTRACT(YEAR FROM booking_date) = 2025
  AND EXTRACT(MONTH FROM booking_date) = 12
ORDER BY booking_date, booking_time;

-- ==============================================
-- STEP 2: COUNT BOOKINGS BY DATE
-- ==============================================
SELECT 
  booking_date,
  COUNT(*) as bookings_count,
  ROUND(SUM(total_amount) / 100.0, 2) as total_revenue_rands,
  CASE 
    WHEN EXTRACT(DAY FROM booking_date) IN (1, 2, 3) THEN '✅ Keep as completed'
    ELSE '⚠️ Will revert to pending'
  END as action
FROM bookings
WHERE status = 'completed'
  AND EXTRACT(YEAR FROM booking_date) = 2025
  AND EXTRACT(MONTH FROM booking_date) = 12
GROUP BY booking_date
ORDER BY booking_date;

-- ==============================================
-- STEP 3: PREVIEW BOOKINGS THAT WILL BE REVERTED
-- ==============================================
SELECT 
  id, 
  booking_date, 
  booking_time, 
  status, 
  customer_name,
  cleaner_id,
  ROUND(total_amount / 100.0, 2) as total_amount_rands,
  cleaner_completed_at
FROM bookings
WHERE status = 'completed'
  AND EXTRACT(YEAR FROM booking_date) = 2025
  AND EXTRACT(MONTH FROM booking_date) = 12
  AND EXTRACT(DAY FROM booking_date) NOT IN (1, 2, 3)
ORDER BY booking_date, booking_time;

-- ==============================================
-- STEP 4: COUNT BOOKINGS TO BE REVERTED
-- ==============================================
SELECT 
  COUNT(*) as bookings_to_revert,
  COUNT(DISTINCT booking_date) as unique_dates,
  MIN(booking_date) as earliest_date,
  MAX(booking_date) as latest_date,
  ROUND(SUM(total_amount) / 100.0, 2) as total_revenue_rands
FROM bookings
WHERE status = 'completed'
  AND EXTRACT(YEAR FROM booking_date) = 2025
  AND EXTRACT(MONTH FROM booking_date) = 12
  AND EXTRACT(DAY FROM booking_date) NOT IN (1, 2, 3);

-- ==============================================
-- STEP 5: UPDATE STATEMENT (Revert to pending)
-- ==============================================
BEGIN;

UPDATE bookings
SET 
  status = 'pending',
  cleaner_completed_at = NULL,
  updated_at = CURRENT_TIMESTAMP
WHERE status = 'completed'
  AND EXTRACT(YEAR FROM booking_date) = 2025
  AND EXTRACT(MONTH FROM booking_date) = 12
  AND EXTRACT(DAY FROM booking_date) NOT IN (1, 2, 3);

COMMIT;

-- ==============================================
-- STEP 6: VERIFICATION - Check remaining completed bookings in December
-- ==============================================
SELECT 
  booking_date,
  COUNT(*) as completed_bookings,
  ROUND(SUM(total_amount) / 100.0, 2) as total_revenue_rands
FROM bookings
WHERE status = 'completed'
  AND EXTRACT(YEAR FROM booking_date) = 2025
  AND EXTRACT(MONTH FROM booking_date) = 12
GROUP BY booking_date
ORDER BY booking_date;

-- ==============================================
-- STEP 7: VERIFICATION - Check reverted bookings
-- ==============================================
SELECT 
  booking_date,
  COUNT(*) as pending_bookings,
  ROUND(SUM(total_amount) / 100.0, 2) as total_revenue_rands
FROM bookings
WHERE status = 'pending'
  AND EXTRACT(YEAR FROM booking_date) = 2025
  AND EXTRACT(MONTH FROM booking_date) = 12
  AND EXTRACT(DAY FROM booking_date) NOT IN (1, 2, 3)
GROUP BY booking_date
ORDER BY booking_date;

-- ==============================================
-- STEP 8: FINAL SUMMARY
-- ==============================================
SELECT 
  status,
  COUNT(*) as total_bookings,
  COUNT(DISTINCT booking_date) as unique_dates,
  ROUND(SUM(total_amount) / 100.0, 2) as total_revenue_rands
FROM bookings
WHERE EXTRACT(YEAR FROM booking_date) = 2025
  AND EXTRACT(MONTH FROM booking_date) = 12
GROUP BY status
ORDER BY status;

