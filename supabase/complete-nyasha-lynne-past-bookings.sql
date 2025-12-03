-- Complete All Past Bookings for Nyasha and Customer Lynne Thorpe
-- Purpose: Mark all past bookings (before today) as 'completed' for Nyasha's bookings with Lynne
-- Date: January 2025

BEGIN;

-- ==============================================
-- STEP 1: CHECK CURRENT STATE
-- ==============================================
-- Show all Nyasha bookings for Lynne, grouped by status
SELECT 
  b.status,
  COUNT(*) as booking_count,
  MIN(b.booking_date) as earliest_date,
  MAX(b.booking_date) as latest_date
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND cl.name = 'Nyasha Mudani'
GROUP BY b.status
ORDER BY b.status;

-- ==============================================
-- STEP 2: SHOW PAST BOOKINGS THAT WILL BE COMPLETED
-- ==============================================
-- Show all past bookings (before today) that are not already completed
SELECT 
  b.id,
  b.booking_date,
  TO_CHAR(b.booking_date, 'Day') as day_name,
  b.booking_time,
  b.status,
  b.customer_name,
  cl.name as cleaner_name,
  ROUND(b.total_amount / 100.0, 2) as total_rands,
  b.cleaner_completed_at
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND cl.name = 'Nyasha Mudani'
  AND b.booking_date < CURRENT_DATE
  AND b.status != 'completed'
ORDER BY b.booking_date DESC, b.booking_time;

-- ==============================================
-- STEP 3: COMPLETE ALL PAST BOOKINGS
-- ==============================================
-- Update all past bookings (before today) to 'completed' status
-- Set cleaner_completed_at to the booking date at the booking time
UPDATE bookings b
SET 
  status = 'completed',
  cleaner_completed_at = (b.booking_date + b.booking_time)::timestamp,
  updated_at = NOW()
FROM customers c, cleaners cl
WHERE b.customer_id = c.id
  AND b.cleaner_id::uuid = cl.id
  AND (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND cl.name = 'Nyasha Mudani'
  AND b.booking_date < CURRENT_DATE
  AND b.status != 'completed';

-- Show how many bookings were updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE '✅ Updated % past booking(s) to completed status', updated_count;
END $$;

-- ==============================================
-- STEP 4: VERIFICATION - Check completed bookings
-- ==============================================
-- Show all completed bookings for Nyasha and Lynne
SELECT 
  b.booking_date,
  TO_CHAR(b.booking_date, 'Day') as day_name,
  b.booking_time,
  b.status,
  b.cleaner_completed_at,
  ROUND(b.total_amount / 100.0, 2) as total_rands,
  ROUND(b.cleaner_earnings / 100.0, 2) as cleaner_earnings_rands
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND cl.name = 'Nyasha Mudani'
  AND b.status = 'completed'
ORDER BY b.booking_date DESC, b.booking_time;

-- ==============================================
-- STEP 5: SUMMARY BY MONTH
-- ==============================================
-- Show summary of completed bookings by month
SELECT 
  TO_CHAR(b.booking_date, 'YYYY-MM') as month,
  COUNT(*) as completed_bookings,
  ROUND(SUM(b.total_amount) / 100.0, 2) as total_revenue_rands,
  ROUND(SUM(b.cleaner_earnings) / 100.0, 2) as total_cleaner_earnings_rands
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND cl.name = 'Nyasha Mudani'
  AND b.status = 'completed'
GROUP BY TO_CHAR(b.booking_date, 'YYYY-MM')
ORDER BY month DESC;

-- ==============================================
-- STEP 6: CHECK REMAINING NON-COMPLETED BOOKINGS
-- ==============================================
-- Show any remaining bookings that are not completed (should only be future bookings)
SELECT 
  b.booking_date,
  TO_CHAR(b.booking_date, 'Day') as day_name,
  b.booking_time,
  b.status,
  CASE 
    WHEN b.booking_date < CURRENT_DATE THEN 'Past'
    WHEN b.booking_date = CURRENT_DATE THEN 'Today'
    ELSE 'Future'
  END as date_category
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND cl.name = 'Nyasha Mudani'
  AND b.status != 'completed'
ORDER BY b.booking_date, b.booking_time;

COMMIT;

-- ==============================================
-- ROLLBACK INSTRUCTIONS
-- ==============================================
-- If something goes wrong, run:
-- ROLLBACK;

