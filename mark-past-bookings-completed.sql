-- Mark Past Bookings as Completed
-- Purpose: Update bookings with 'pending' status from October 1, 2024 to today to 'completed'
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
  cleaner_id
FROM bookings
WHERE status = 'pending'
  AND booking_date >= '2024-10-01'
  AND booking_date <= CURRENT_DATE
ORDER BY booking_date, booking_time;

-- ==============================================
-- STEP 2: COUNT QUERY (See how many records will be affected)
-- ==============================================
SELECT COUNT(*) as records_to_update
FROM bookings
WHERE status = 'pending'
  AND booking_date >= '2024-10-01'
  AND booking_date <= CURRENT_DATE;

-- ==============================================
-- STEP 3: UPDATE STATEMENT (Execute this to mark bookings as completed)
-- ==============================================
UPDATE bookings
SET 
  status = 'completed',
  cleaner_completed_at = CURRENT_TIMESTAMP
WHERE status = 'pending'
  AND booking_date >= '2024-10-01'
  AND booking_date <= CURRENT_DATE;

-- ==============================================
-- STEP 4: VERIFICATION QUERY (Confirm the changes were applied)
-- ==============================================
SELECT COUNT(*) as updated_count
FROM bookings
WHERE status = 'completed'
  AND booking_date >= '2024-10-01'
  AND booking_date <= CURRENT_DATE
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
  cleaner_completed_at
FROM bookings
WHERE status = 'completed'
  AND booking_date >= '2024-10-01'
  AND booking_date <= CURRENT_DATE
  AND cleaner_completed_at >= CURRENT_DATE - INTERVAL '1 minute'
ORDER BY cleaner_completed_at DESC
LIMIT 10;
