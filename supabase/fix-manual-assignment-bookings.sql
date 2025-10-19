-- ============================================
-- FIX MANUAL ASSIGNMENT BOOKINGS
-- ============================================
-- This script fixes bookings with cleaner_id = 'manual' so they appear in Available Jobs
-- ============================================

-- STEP 1: Check current state of manual assignment bookings
SELECT 
  'BEFORE FIX' as status,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE cleaner_id = 'manual') as manual_assignment_bookings,
  COUNT(*) FILTER (WHERE cleaner_id IS NULL) as unassigned_bookings,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings
FROM bookings;

-- Show specific manual assignment bookings
SELECT 
  id,
  booking_date,
  booking_time,
  status,
  cleaner_id,
  address_city,
  address_suburb,
  customer_name,
  service_type
FROM bookings
WHERE cleaner_id = 'manual'
ORDER BY booking_date, booking_time;

-- STEP 2: Fix manual assignment bookings
-- Set cleaner_id to NULL and status to 'pending' so they appear in Available Jobs
UPDATE bookings
SET 
  cleaner_id = NULL,
  status = 'pending'
WHERE cleaner_id = 'manual';

-- STEP 3: Verify the fix
SELECT 
  'AFTER FIX' as status,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE cleaner_id = 'manual') as manual_assignment_bookings,
  COUNT(*) FILTER (WHERE cleaner_id IS NULL) as unassigned_bookings,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_bookings
FROM bookings;

-- Show the fixed bookings
SELECT 
  id,
  booking_date,
  booking_time,
  status,
  cleaner_id,
  address_city,
  address_suburb,
  customer_name,
  service_type,
  CASE 
    WHEN cleaner_id IS NULL AND status = 'pending' THEN '✅ Now available for cleaners'
    ELSE '❌ Still has issues'
  END as availability_status
FROM bookings
WHERE cleaner_id IS NULL AND status = 'pending'
ORDER BY booking_date, booking_time;

-- STEP 4: Test what cleaners will see
-- Check which cleaners can see these bookings based on their service areas
SELECT 
  c.name as cleaner_name,
  c.areas as service_areas,
  COUNT(b.id) as available_bookings
FROM cleaners c
LEFT JOIN bookings b ON (
  b.cleaner_id IS NULL 
  AND b.status = 'pending'
  AND b.booking_date >= CURRENT_DATE
  AND (
    EXISTS (
      SELECT 1
      FROM unnest(c.areas) as area
      WHERE LOWER(b.address_city) LIKE '%' || LOWER(area) || '%'
         OR LOWER(b.address_suburb) LIKE '%' || LOWER(area) || '%'
    )
  )
)
GROUP BY c.id, c.name, c.areas
ORDER BY available_bookings DESC;

-- ============================================
-- SUMMARY
-- ============================================
-- After running this script:
-- 1. All bookings with cleaner_id = 'manual' will have cleaner_id = NULL
-- 2. All these bookings will have status = 'pending'
-- 3. These bookings will now appear in "Available Jobs" for cleaners
-- 4. Cleaners can claim these bookings from their dashboard
-- ============================================

