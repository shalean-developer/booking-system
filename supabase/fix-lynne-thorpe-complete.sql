-- ============================================
-- COMPLETE FIX FOR LYNNE THORPE'S SCHEDULES
-- ============================================
-- This script will:
-- 1. Create/restore Nyasha's schedule if missing
-- 2. Set Ethel's schedule pricing to R306
-- 3. Set Nyasha's schedule pricing to R307
-- 4. Set cleaner earnings to R250 for both
-- 5. Update all booking prices to match
-- ============================================

BEGIN;

-- Step 1: Create Nyasha's schedule if it doesn't exist
INSERT INTO recurring_schedules (
  customer_id,
  service_type,
  bedrooms,
  bathrooms,
  frequency,
  preferred_time,
  days_of_week,
  cleaner_id,
  is_active,
  start_date,
  total_amount,
  cleaner_earnings,
  address_line1,
  address_suburb,
  address_city,
  created_at,
  updated_at
)
SELECT 
  rs.customer_id,
  rs.service_type,
  rs.bedrooms,
  rs.bathrooms,
  rs.frequency,
  rs.preferred_time,
  rs.days_of_week,
  (SELECT id FROM cleaners WHERE name = 'Nyasha Mudani' LIMIT 1) as cleaner_id,
  true as is_active,
  rs.start_date,
  30700 as total_amount, -- R307 in cents
  25000 as cleaner_earnings, -- R250 in cents
  rs.address_line1,
  rs.address_suburb,
  rs.address_city,
  NOW() as created_at,
  NOW() as updated_at
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
  AND NOT EXISTS (
    SELECT 1 FROM recurring_schedules rs2
    INNER JOIN customers c2 ON rs2.customer_id = c2.id
    INNER JOIN cleaners cl2 ON rs2.cleaner_id = cl2.id
    WHERE c2.email = 'lynthorpe@gmail.com'
      AND cl2.name = 'Nyasha Mudani'
      AND rs2.service_type = 'Standard'
      AND rs2.bedrooms = 1
      AND rs2.bathrooms = 1
      AND rs2.frequency = 'custom-weekly'
      AND rs2.preferred_time = '09:00:00'
  )
LIMIT 1;

-- Step 2: Update Ethel's schedule pricing
UPDATE recurring_schedules
SET 
  total_amount = 30600, -- R306 in cents
  cleaner_earnings = 25000, -- R250 in cents
  updated_at = NOW()
WHERE id IN (
  SELECT rs.id
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
);

-- Step 3: Update Nyasha's schedule pricing and ensure it's active
UPDATE recurring_schedules
SET 
  is_active = true,
  total_amount = 30700, -- R307 in cents
  cleaner_earnings = 25000, -- R250 in cents
  updated_at = NOW()
WHERE id IN (
  SELECT rs.id
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE c.email = 'lynthorpe@gmail.com'
    AND cl.name = 'Nyasha Mudani'
    AND rs.service_type = 'Standard'
    AND rs.bedrooms = 1
    AND rs.bathrooms = 1
    AND rs.frequency = 'custom-weekly'
    AND rs.preferred_time = '09:00:00'
);

-- Step 4: Update all booking prices to match their schedules
-- Ethel's bookings -> R306
UPDATE bookings
SET 
  total_amount = 30600, -- R306 in cents
  cleaner_earnings = 25000 -- R250 in cents
WHERE recurring_schedule_id IN (
  SELECT rs.id
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
);

-- Nyasha's bookings -> R307
UPDATE bookings
SET 
  total_amount = 30700, -- R307 in cents
  cleaner_earnings = 25000 -- R250 in cents
WHERE recurring_schedule_id IN (
  SELECT rs.id
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE c.email = 'lynthorpe@gmail.com'
    AND cl.name = 'Nyasha Mudani'
    AND rs.service_type = 'Standard'
    AND rs.bedrooms = 1
    AND rs.bathrooms = 1
    AND rs.frequency = 'custom-weekly'
    AND rs.preferred_time = '09:00:00'
);

-- Step 5: Verify final state
SELECT 
  'FINAL STATE' as step,
  rs.id as schedule_id,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.is_active,
  ROUND(rs.total_amount / 100.0, 2) as schedule_total_rands,
  ROUND(rs.cleaner_earnings / 100.0, 2) as schedule_cleaner_earnings_rands,
  rs.start_date,
  COUNT(b.id) as booking_count,
  ROUND(AVG(b.total_amount) / 100.0, 2) as avg_booking_total_rands,
  ROUND(AVG(b.cleaner_earnings) / 100.0, 2) as avg_booking_cleaner_earnings_rands
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE c.email = 'lynthorpe@gmail.com'
  AND rs.service_type = 'Standard'
  AND rs.bedrooms = 1
  AND rs.bathrooms = 1
  AND rs.frequency = 'custom-weekly'
  AND rs.preferred_time = '09:00:00'
GROUP BY rs.id, cl.name, rs.is_active, rs.total_amount, rs.cleaner_earnings, rs.start_date
ORDER BY cl.name;

-- Step 6: Show total count
SELECT 
  COUNT(*) as total_schedules,
  COUNT(*) FILTER (WHERE is_active = true) as active_schedules
FROM recurring_schedules;

COMMIT;

