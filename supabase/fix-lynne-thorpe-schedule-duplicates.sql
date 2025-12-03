-- ============================================
-- FIX LYNNE THORPE'S SCHEDULE DUPLICATES
-- ============================================
-- Issue: Ethel appears twice (1 bed Oct, 2 bed Nov)
--        Nyasha appears once (1 bed Oct)
-- Fix: Both should have 1 bed, 1 bath starting Oct 1, 2025
-- ============================================

BEGIN;

-- Step 1: Check current state
SELECT 
  rs.id as schedule_id,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.start_date,
  rs.created_at,
  rs.is_active,
  COUNT(b.id) as booking_count
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE c.email = 'lynthorpe@gmail.com'
  AND rs.is_active = true
GROUP BY rs.id, cl.name, rs.service_type, rs.bedrooms, rs.bathrooms, rs.start_date, rs.created_at, rs.is_active
ORDER BY cl.name, rs.start_date, rs.created_at;

-- Step 2: Find the incorrect 2 bed, 2 bath schedule for Ethel
SELECT 
  rs.id as schedule_id,
  cl.name as cleaner_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.start_date
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
WHERE c.email = 'lynthorpe@gmail.com'
  AND cl.name = 'Ethel Chizombe'
  AND rs.service_type = 'Standard'
  AND rs.bedrooms = 2
  AND rs.bathrooms = 2
  AND rs.is_active = true;

-- Step 3: Transfer bookings from incorrect schedule to correct one (if any)
-- First, get the correct Ethel schedule (1 bed, 1 bath, Oct 1)
WITH correct_ethel_schedule AS (
  SELECT rs.id as correct_schedule_id
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE c.email = 'lynthorpe@gmail.com'
    AND cl.name = 'Ethel Chizombe'
    AND rs.service_type = 'Standard'
    AND rs.bedrooms = 1
    AND rs.bathrooms = 1
    AND rs.frequency = 'custom-weekly'
    AND rs.preferred_time = '09:00:00'
    AND rs.is_active = true
  ORDER BY rs.start_date ASC, rs.created_at ASC
  LIMIT 1
),
incorrect_ethel_schedule AS (
  SELECT rs.id as incorrect_schedule_id
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE c.email = 'lynthorpe@gmail.com'
    AND cl.name = 'Ethel Chizombe'
    AND rs.service_type = 'Standard'
    AND rs.bedrooms = 2
    AND rs.bathrooms = 2
    AND rs.is_active = true
  LIMIT 1
)
UPDATE bookings
SET recurring_schedule_id = (SELECT correct_schedule_id FROM correct_ethel_schedule)
WHERE recurring_schedule_id = (SELECT incorrect_schedule_id FROM incorrect_ethel_schedule);

-- Step 4: Delete the incorrect 2 bed, 2 bath schedule for Ethel
DELETE FROM recurring_schedules
WHERE id IN (
  SELECT rs.id
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE c.email = 'lynthorpe@gmail.com'
    AND cl.name = 'Ethel Chizombe'
    AND rs.service_type = 'Standard'
    AND rs.bedrooms = 2
    AND rs.bathrooms = 2
    AND rs.is_active = true
);

-- Step 5: Ensure both schedules have correct start date (Oct 1, 2025)
UPDATE recurring_schedules
SET 
  start_date = '2025-10-01',
  updated_at = NOW()
WHERE id IN (
  SELECT rs.id
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE c.email = 'lynthorpe@gmail.com'
    AND rs.service_type = 'Standard'
    AND rs.bedrooms = 1
    AND rs.bathrooms = 1
    AND rs.frequency = 'custom-weekly'
    AND rs.preferred_time = '09:00:00'
    AND rs.is_active = true
    AND cl.name IN ('Ethel Chizombe', 'Nyasha Mudani')
);

-- Step 6: Verify final state
SELECT 
  rs.id as schedule_id,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.start_date,
  rs.created_at,
  rs.is_active,
  ROUND(rs.total_amount / 100.0, 2) as total_amount_rands,
  ROUND(rs.cleaner_earnings / 100.0, 2) as cleaner_earnings_rands,
  COUNT(b.id) as booking_count
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE c.email = 'lynthorpe@gmail.com'
  AND rs.is_active = true
GROUP BY rs.id, cl.name, rs.service_type, rs.bedrooms, rs.bathrooms, rs.start_date, rs.created_at, rs.is_active, rs.total_amount, rs.cleaner_earnings
ORDER BY cl.name, rs.start_date;

COMMIT;

