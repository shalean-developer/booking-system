-- ============================================
-- FIX YOUR BOOKINGS - Make them available now
-- ============================================
-- Based on your diagnostic results:
-- - 5 bookings with status='confirmed' 
-- - All have cleaners assigned (need to unassign)
-- - All are future dates (good!)
-- ============================================

-- STEP 1: Check current state
SELECT 
  id,
  booking_date,
  booking_time,
  status,
  cleaner_id,
  address_city,
  address_suburb,
  customer_name
FROM bookings
WHERE status = 'confirmed'
ORDER BY booking_date, booking_time;

-- STEP 2: Make them available for cleaners to claim
UPDATE bookings
SET 
  cleaner_id = NULL,        -- Remove current cleaner assignment
  status = 'pending'        -- Change status to pending
WHERE status = 'confirmed';

-- STEP 3: Verify the fix
SELECT 
  id,
  booking_date,
  booking_time,
  status,
  cleaner_id,
  address_city,
  address_suburb,
  CASE 
    WHEN cleaner_id IS NULL AND status = 'pending' THEN '✅ Now available!'
    ELSE '❌ Still has issues'
  END as availability_status
FROM bookings
WHERE status = 'pending'
ORDER BY booking_date, booking_time;

-- STEP 4: Check which cleaner will see which bookings
-- (Replace 'YOUR_CLEANER_ID' with actual cleaner ID to test)
/*
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.address_city,
  b.address_suburb,
  c.name as cleaner_name,
  c.areas as service_areas
FROM bookings b
CROSS JOIN cleaners c
WHERE c.id = 'YOUR_CLEANER_ID'
  AND b.cleaner_id IS NULL
  AND b.status = 'pending'
  AND b.booking_date >= CURRENT_DATE
  AND (
    EXISTS (
      SELECT 1
      FROM unnest(c.areas) as area
      WHERE LOWER(b.address_city) LIKE '%' || LOWER(area) || '%'
         OR LOWER(b.address_suburb) LIKE '%' || LOWER(area) || '%'
    )
  );
*/

-- ============================================
-- After running this:
-- 1. Go to cleaner dashboard
-- 2. Click "Available Jobs" tab
-- 3. Click refresh button
-- 4. Bookings should now appear!
-- ============================================

