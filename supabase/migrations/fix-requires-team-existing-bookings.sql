-- ============================================
-- FIX REQUIRES_TEAM FLAG FOR EXISTING BOOKINGS
-- ============================================
-- This migration fixes the requires_team flag for existing bookings
-- based on their service type. This addresses the issue where all
-- bookings were showing "Team Assigned" in the admin dashboard.
-- ============================================

-- First, let's see what we're working with
SELECT 
  service_type,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN requires_team = true THEN 1 END) as team_bookings,
  COUNT(CASE WHEN requires_team = false THEN 1 END) as individual_bookings,
  COUNT(CASE WHEN requires_team IS NULL THEN 1 END) as null_bookings
FROM bookings 
GROUP BY service_type
ORDER BY service_type;

-- Update Standard and Airbnb bookings to require individual cleaners
UPDATE bookings 
SET requires_team = false
WHERE service_type IN ('Standard', 'Airbnb')
  AND (requires_team IS NULL OR requires_team = true);

-- Update Deep and Move In/Out bookings to require teams
UPDATE bookings 
SET requires_team = true
WHERE service_type IN ('Deep', 'Move In/Out')
  AND (requires_team IS NULL OR requires_team = false);

-- Verify the changes
SELECT 
  service_type,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN requires_team = true THEN 1 END) as team_bookings,
  COUNT(CASE WHEN requires_team = false THEN 1 END) as individual_bookings,
  COUNT(CASE WHEN requires_team IS NULL THEN 1 END) as null_bookings
FROM bookings 
GROUP BY service_type
ORDER BY service_type;

-- Show sample of updated bookings
SELECT 
  id,
  service_type,
  requires_team,
  cleaner_id,
  customer_name,
  booking_date
FROM bookings 
ORDER BY created_at DESC 
LIMIT 10;

-- Add comment for documentation
COMMENT ON COLUMN bookings.requires_team IS 'True for Deep/Move In-Out services (team required), False for Standard/Airbnb services (individual cleaner)';
