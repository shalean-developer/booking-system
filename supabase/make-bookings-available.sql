-- ============================================
-- QUICK FIX: Make bookings available for cleaners
-- ============================================

-- This script will:
-- 1. Set cleaner_id to NULL (unassign any cleaners)
-- 2. Set status to 'pending'
-- 3. Move past dates to today
-- 4. Ensure address fields match cleaner service areas

-- BEFORE running this, check what you have:
SELECT 
  id,
  booking_date,
  status,
  cleaner_id,
  address_city,
  address_suburb
FROM bookings;

-- Also check cleaner areas:
SELECT name, areas FROM cleaners;

-- ============================================
-- OPTION 1: Make ALL bookings available
-- ============================================
-- This will reset ALL bookings to be available for claiming

UPDATE bookings
SET 
  cleaner_id = NULL,
  status = 'pending',
  booking_date = CASE 
    WHEN booking_date < CURRENT_DATE THEN CURRENT_DATE + interval '1 day'
    ELSE booking_date
  END;

-- ============================================
-- OPTION 2: Make only specific bookings available
-- ============================================
-- Uncomment and replace the IDs with your actual booking IDs:
/*
UPDATE bookings
SET 
  cleaner_id = NULL,
  status = 'pending',
  booking_date = CASE 
    WHEN booking_date < CURRENT_DATE THEN CURRENT_DATE + interval '1 day'
    ELSE booking_date
  END
WHERE id IN (
  'your-booking-id-1',
  'your-booking-id-2',
  'your-booking-id-3'
);
*/

-- ============================================
-- OPTION 3: Fix address to match cleaner areas
-- ============================================
-- If your bookings don't match cleaner service areas, update them:
-- First check what areas cleaners service:
SELECT DISTINCT unnest(areas) as area FROM cleaners;

-- Then update bookings to use matching cities:
-- Example: If your cleaner services "Johannesburg, Pretoria, Cape Town"
/*
UPDATE bookings
SET 
  address_city = 'Johannesburg',
  address_suburb = 'Sandton'
WHERE address_city IS NULL OR address_city = '';
*/

-- ============================================
-- VERIFY: Check if bookings are now available
-- ============================================
-- Run this to confirm bookings should now appear:
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.status,
  b.cleaner_id,
  b.address_city,
  b.address_suburb,
  CASE 
    WHEN b.cleaner_id IS NOT NULL THEN '❌ Has cleaner'
    WHEN b.status != 'pending' THEN '❌ Status: ' || b.status
    WHEN b.booking_date < CURRENT_DATE THEN '❌ Past date'
    WHEN b.address_city IS NULL AND b.address_suburb IS NULL THEN '❌ No location'
    ELSE '✅ Should be available'
  END as availability
FROM bookings b
ORDER BY b.booking_date, b.booking_time;

-- ============================================
-- Test with specific cleaner
-- ============================================
-- Replace 'YOUR_CLEANER_ID' with your actual cleaner ID
-- to see which bookings they should see:
/*
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.address_city,
  b.address_suburb,
  b.service_type,
  c.name as cleaner_name,
  c.areas as cleaner_areas
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

