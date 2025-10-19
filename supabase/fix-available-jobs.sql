-- ============================================
-- DIAGNOSE & FIX AVAILABLE JOBS ISSUE
-- ============================================

-- STEP 1: Check all bookings in the database
SELECT 
  id,
  booking_date,
  booking_time,
  status,
  cleaner_id,
  address_city,
  address_suburb,
  service_type,
  total_amount,
  CASE 
    WHEN cleaner_id IS NOT NULL THEN '❌ Has cleaner assigned'
    WHEN status != 'pending' THEN '❌ Status is not pending'
    WHEN booking_date < CURRENT_DATE THEN '❌ Date is in the past'
    ELSE '✅ Available'
  END as availability_status
FROM bookings
ORDER BY booking_date DESC;

-- STEP 2: Check cleaner service areas
SELECT 
  id,
  name,
  phone,
  areas,
  is_available
FROM cleaners;

-- STEP 3: Check which bookings would match cleaner's areas
-- (Replace 'YOUR_CLEANER_ID' with actual cleaner ID)
WITH cleaner_areas AS (
  SELECT unnest(areas) as area
  FROM cleaners
  WHERE id = 'YOUR_CLEANER_ID'
)
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.address_city,
  b.address_suburb,
  b.status,
  b.cleaner_id,
  ca.area as matching_area,
  CASE 
    WHEN ca.area IS NOT NULL THEN '✅ Matches area'
    ELSE '❌ No area match'
  END as area_match_status
FROM bookings b
LEFT JOIN cleaner_areas ca 
  ON LOWER(b.address_city) LIKE '%' || LOWER(ca.area) || '%'
  OR LOWER(b.address_suburb) LIKE '%' || LOWER(ca.area) || '%'
WHERE b.cleaner_id IS NULL
  AND b.status = 'pending'
  AND b.booking_date >= CURRENT_DATE
ORDER BY b.booking_date, b.booking_time;

-- ============================================
-- FIX COMMANDS
-- ============================================

-- FIX 1: Make bookings available (set cleaner_id to NULL and status to pending)
-- Uncomment and run if needed:
/*
UPDATE bookings
SET 
  cleaner_id = NULL,
  status = 'pending'
WHERE id IN (
  -- Add your booking IDs here
  'booking-id-1',
  'booking-id-2'
);
*/

-- FIX 2: Update booking dates to future dates
-- Uncomment and run if needed:
/*
UPDATE bookings
SET booking_date = '2025-10-20'  -- Change to desired date
WHERE id = 'your-booking-id';
*/

-- FIX 3: Update booking location to match cleaner areas
-- First, check what areas your cleaners service:
SELECT id, name, areas FROM cleaners;

-- Then update bookings to use those areas:
/*
UPDATE bookings
SET 
  address_city = 'Johannesburg',  -- Must match one of the cleaner's areas
  address_suburb = 'Sandton'       -- Or suburb that matches
WHERE id = 'your-booking-id';
*/

-- ============================================
-- QUICK FIX: Make ALL bookings available
-- ============================================
-- WARNING: This will make ALL bookings available for claiming
-- Uncomment ONLY if you want to reset all bookings:
/*
UPDATE bookings
SET 
  cleaner_id = NULL,
  status = 'pending',
  booking_date = CASE 
    WHEN booking_date < CURRENT_DATE THEN CURRENT_DATE
    ELSE booking_date
  END
WHERE status IN ('pending', 'confirmed', 'scheduled');
*/

-- ============================================
-- VERIFY: Check available jobs for a cleaner
-- ============================================
-- Run this query to see what bookings would show for a cleaner
-- (Replace 'YOUR_CLEANER_ID' with actual cleaner ID)
/*
WITH cleaner_info AS (
  SELECT id, areas
  FROM cleaners
  WHERE id = 'YOUR_CLEANER_ID'
)
SELECT 
  b.*,
  ci.areas as cleaner_areas
FROM bookings b
CROSS JOIN cleaner_info ci
WHERE b.cleaner_id IS NULL
  AND b.status = 'pending'
  AND b.booking_date >= CURRENT_DATE
  AND (
    EXISTS (
      SELECT 1
      FROM unnest(ci.areas) as area
      WHERE LOWER(b.address_city) LIKE '%' || LOWER(area) || '%'
         OR LOWER(b.address_suburb) LIKE '%' || LOWER(area) || '%'
    )
  )
ORDER BY b.booking_date, b.booking_time;
*/

