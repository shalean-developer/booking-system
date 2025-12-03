-- Complete All Accepted Past Bookings
-- Purpose: Update all bookings with 'accepted' status to 'completed' for:
--   - All of October 2025
--   - All of November 2025
--   - December 1, 2, 3, 2025
-- Date: January 2025

-- ==============================================
-- STEP 1: CHECK ALL ACCEPTED BOOKINGS IN TARGET PERIOD
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
  ROUND(cleaner_earnings / 100.0, 2) as cleaner_earnings_rands,
  cleaner_accepted_at
FROM bookings
WHERE status = 'accepted'
  AND (
    -- October 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 10)
    OR
    -- November 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 11)
    OR
    -- December 1, 2, 3, 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 
     AND EXTRACT(MONTH FROM booking_date) = 12 
     AND EXTRACT(DAY FROM booking_date) IN (1, 2, 3))
  )
ORDER BY booking_date DESC, booking_time;

-- ==============================================
-- STEP 2: COUNT BOOKINGS BY MONTH AND DATE
-- ==============================================
SELECT 
  EXTRACT(MONTH FROM booking_date) as month,
  EXTRACT(DAY FROM booking_date) as day,
  booking_date,
  COUNT(*) as bookings_count,
  ROUND(SUM(total_amount) / 100.0, 2) as total_revenue_rands,
  ROUND(SUM(cleaner_earnings) / 100.0, 2) as total_cleaner_earnings_rands
FROM bookings
WHERE status = 'accepted'
  AND (
    -- October 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 10)
    OR
    -- November 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 11)
    OR
    -- December 1, 2, 3, 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 
     AND EXTRACT(MONTH FROM booking_date) = 12 
     AND EXTRACT(DAY FROM booking_date) IN (1, 2, 3))
  )
GROUP BY booking_date, EXTRACT(MONTH FROM booking_date), EXTRACT(DAY FROM booking_date)
ORDER BY booking_date;

-- ==============================================
-- STEP 3: SUMMARY BY MONTH
-- ==============================================
SELECT 
  CASE 
    WHEN EXTRACT(MONTH FROM booking_date) = 10 THEN 'October 2025'
    WHEN EXTRACT(MONTH FROM booking_date) = 11 THEN 'November 2025'
    WHEN EXTRACT(MONTH FROM booking_date) = 12 THEN 'December 2025 (Days 1-3)'
  END as period,
  COUNT(*) as total_bookings,
  COUNT(DISTINCT booking_date) as unique_dates,
  MIN(booking_date) as earliest_date,
  MAX(booking_date) as latest_date,
  ROUND(SUM(total_amount) / 100.0, 2) as total_revenue_rands,
  ROUND(SUM(cleaner_earnings) / 100.0, 2) as total_cleaner_earnings_rands
FROM bookings
WHERE status = 'accepted'
  AND (
    -- October 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 10)
    OR
    -- November 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 11)
    OR
    -- December 1, 2, 3, 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 
     AND EXTRACT(MONTH FROM booking_date) = 12 
     AND EXTRACT(DAY FROM booking_date) IN (1, 2, 3))
  )
GROUP BY EXTRACT(MONTH FROM booking_date)
ORDER BY EXTRACT(MONTH FROM booking_date);

-- ==============================================
-- STEP 4: TOTAL COUNT AND SUMMARY
-- ==============================================
SELECT 
  COUNT(*) as total_bookings_to_complete,
  COUNT(DISTINCT booking_date) as unique_dates,
  COUNT(DISTINCT cleaner_id) as unique_cleaners,
  MIN(booking_date) as earliest_booking,
  MAX(booking_date) as latest_booking,
  ROUND(SUM(total_amount) / 100.0, 2) as total_revenue_rands,
  ROUND(SUM(cleaner_earnings) / 100.0, 2) as total_cleaner_earnings_rands
FROM bookings
WHERE status = 'accepted'
  AND (
    -- October 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 10)
    OR
    -- November 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 11)
    OR
    -- December 1, 2, 3, 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 
     AND EXTRACT(MONTH FROM booking_date) = 12 
     AND EXTRACT(DAY FROM booking_date) IN (1, 2, 3))
  );

-- ==============================================
-- STEP 5: UPDATE STATEMENT (Complete the bookings)
-- ==============================================
BEGIN;

UPDATE bookings
SET 
  status = 'completed',
  cleaner_completed_at = COALESCE(cleaner_completed_at, CURRENT_TIMESTAMP),
  updated_at = CURRENT_TIMESTAMP
WHERE status = 'accepted'
  AND (
    -- October 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 10)
    OR
    -- November 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 11)
    OR
    -- December 1, 2, 3, 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 
     AND EXTRACT(MONTH FROM booking_date) = 12 
     AND EXTRACT(DAY FROM booking_date) IN (1, 2, 3))
  );

COMMIT;

-- ==============================================
-- STEP 6: VERIFICATION - Check completed bookings by month
-- ==============================================
SELECT 
  CASE 
    WHEN EXTRACT(MONTH FROM booking_date) = 10 THEN 'October 2025'
    WHEN EXTRACT(MONTH FROM booking_date) = 11 THEN 'November 2025'
    WHEN EXTRACT(MONTH FROM booking_date) = 12 THEN 'December 2025 (Days 1-3)'
  END as period,
  COUNT(*) as completed_bookings,
  ROUND(SUM(total_amount) / 100.0, 2) as total_revenue_rands
FROM bookings
WHERE status = 'completed'
  AND (
    -- October 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 10)
    OR
    -- November 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 11)
    OR
    -- December 1, 2, 3, 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 
     AND EXTRACT(MONTH FROM booking_date) = 12 
     AND EXTRACT(DAY FROM booking_date) IN (1, 2, 3))
  )
  AND cleaner_completed_at >= CURRENT_DATE - INTERVAL '1 minute'
GROUP BY EXTRACT(MONTH FROM booking_date)
ORDER BY EXTRACT(MONTH FROM booking_date);

-- ==============================================
-- STEP 7: VERIFICATION - Check if any accepted bookings remain
-- ==============================================
SELECT 
  COUNT(*) as remaining_accepted_bookings
FROM bookings
WHERE status = 'accepted'
  AND (
    -- October 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 10)
    OR
    -- November 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 11)
    OR
    -- December 1, 2, 3, 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 
     AND EXTRACT(MONTH FROM booking_date) = 12 
     AND EXTRACT(DAY FROM booking_date) IN (1, 2, 3))
  );

-- ==============================================
-- STEP 8: FINAL CHECK - Sample of updated bookings
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
  AND (
    -- October 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 10)
    OR
    -- November 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 AND EXTRACT(MONTH FROM booking_date) = 11)
    OR
    -- December 1, 2, 3, 2025
    (EXTRACT(YEAR FROM booking_date) = 2025 
     AND EXTRACT(MONTH FROM booking_date) = 12 
     AND EXTRACT(DAY FROM booking_date) IN (1, 2, 3))
  )
  AND cleaner_completed_at >= CURRENT_DATE - INTERVAL '1 minute'
ORDER BY cleaner_completed_at DESC
LIMIT 20;

