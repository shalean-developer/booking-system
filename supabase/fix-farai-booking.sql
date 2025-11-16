-- ============================================
-- FIX SPECIFIC BOOKING: SCS-21850857
-- ============================================
-- This fixes the earnings for today's booking with Farai
-- Booking ID: SCS-21850857
-- ============================================

-- Fix the earnings for the specific booking
UPDATE bookings
SET cleaner_earnings = ROUND((total_amount - COALESCE(service_fee, 0)) * 0.60)
WHERE id = 'SCS-21850857'
  AND (cleaner_earnings IS NULL OR cleaner_earnings = 0)
  AND total_amount > 0;

-- Verify the fix
SELECT 
  b.id,
  b.booking_date,
  b.service_type,
  b.status,
  b.customer_name,
  c.name as cleaner_name,
  ROUND(b.total_amount / 100.0, 2) as total_rand,
  ROUND(b.service_fee / 100.0, 2) as service_fee_rand,
  ROUND(b.cleaner_earnings / 100.0, 2) as cleaner_earnings_rand,
  ROUND((b.total_amount - b.service_fee - b.cleaner_earnings) / 100.0, 2) as company_earnings_rand,
  '60% (hire_date is null)' as commission_rate
FROM bookings b
LEFT JOIN cleaners c ON (
  b.cleaner_id IS NOT NULL 
  AND b.cleaner_id != 'manual'
  AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND b.cleaner_id::uuid = c.id
)
WHERE b.id = 'SCS-21850857';

-- Alternative: Fix ALL today's bookings for Farai with 0 earnings
/*
UPDATE bookings b
SET cleaner_earnings = ROUND((b.total_amount - COALESCE(b.service_fee, 0)) * 0.60)
FROM cleaners c
WHERE b.cleaner_id IS NOT NULL
  AND b.cleaner_id != 'manual'
  AND b.cleaner_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND b.cleaner_id::uuid = c.id
  AND b.booking_date = CURRENT_DATE
  AND LOWER(b.customer_name) LIKE '%farai%'
  AND (b.cleaner_earnings IS NULL OR b.cleaner_earnings = 0)
  AND b.total_amount > 0
  AND NOT (LOWER(b.service_type) LIKE '%deep%' OR LOWER(b.service_type) LIKE '%move%');
*/

