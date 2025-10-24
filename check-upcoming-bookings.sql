-- Check Upcoming Bookings - Comprehensive Analysis
-- Purpose: Analyze all upcoming bookings to understand the data structure and dates

-- ==============================================
-- 1. CHECK ALL BOOKINGS WITH DATES
-- ==============================================
SELECT 
  id,
  booking_date,
  booking_time,
  customer_name,
  service_type,
  status,
  cleaner_id,
  created_at
FROM bookings
ORDER BY booking_date, booking_time;

-- ==============================================
-- 2. CHECK BOOKINGS BY DATE RANGE
-- ==============================================
-- Today's bookings
SELECT 
  id,
  booking_date,
  booking_time,
  customer_name,
  service_type,
  status,
  cleaner_id
FROM bookings
WHERE booking_date = CURRENT_DATE
ORDER BY booking_time;

-- Tomorrow's bookings
SELECT 
  id,
  booking_date,
  booking_time,
  customer_name,
  service_type,
  status,
  cleaner_id
FROM bookings
WHERE booking_date = CURRENT_DATE + INTERVAL '1 day'
ORDER BY booking_time;

-- Next 7 days bookings
SELECT 
  id,
  booking_date,
  booking_time,
  customer_name,
  service_type,
  status,
  cleaner_id
FROM bookings
WHERE booking_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
ORDER BY booking_date, booking_time;

-- ==============================================
-- 3. CHECK BOOKINGS BY STATUS
-- ==============================================
-- Pending bookings
SELECT 
  id,
  booking_date,
  booking_time,
  customer_name,
  service_type,
  status,
  cleaner_id
FROM bookings
WHERE status = 'pending'
ORDER BY booking_date, booking_time;

-- Accepted bookings
SELECT 
  id,
  booking_date,
  booking_time,
  customer_name,
  service_type,
  status,
  cleaner_id
FROM bookings
WHERE status = 'accepted'
ORDER BY booking_date, booking_time;

-- ==============================================
-- 4. CHECK SPECIFIC DATES FROM YOUR DATA
-- ==============================================
-- October 1st bookings (from your debug logs)
SELECT 
  id,
  booking_date,
  booking_time,
  customer_name,
  service_type,
  status,
  cleaner_id
FROM bookings
WHERE booking_date = '2025-10-01'
ORDER BY booking_time;

-- October 25th bookings (tomorrow's date)
SELECT 
  id,
  booking_date,
  booking_time,
  customer_name,
  service_type,
  status,
  cleaner_id
FROM bookings
WHERE booking_date = '2025-10-25'
ORDER BY booking_time;

-- ==============================================
-- 5. SUMMARY STATISTICS
-- ==============================================
-- Count bookings by date
SELECT 
  booking_date,
  COUNT(*) as booking_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
FROM bookings
GROUP BY booking_date
ORDER BY booking_date;

-- ==============================================
-- 6. CHECK CLEANER ASSIGNMENTS
-- ==============================================
-- Bookings with cleaner assignments
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.customer_name,
  b.service_type,
  b.status,
  b.cleaner_id,
  CASE 
    WHEN b.cleaner_id = 'manual' THEN 'Manual Assignment'
    WHEN b.cleaner_id IS NULL THEN 'No Cleaner Assigned'
    ELSE 'Cleaner Assigned'
  END as cleaner_status
FROM bookings b
WHERE b.booking_date >= CURRENT_DATE
ORDER BY b.booking_date, b.booking_time;
