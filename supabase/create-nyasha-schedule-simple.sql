-- ============================================
-- CREATE NYASHA MUDANI'S SCHEDULE FOR LYNNE THORPE
-- ============================================
-- Simple script to create Nyasha's schedule based on Ethel's
-- ============================================

BEGIN;

-- Step 1: Check if Nyasha's schedule already exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM recurring_schedules rs
      INNER JOIN customers c ON rs.customer_id = c.id
      INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
      WHERE c.email = 'lynthorpe@gmail.com'
        AND cl.name = 'Nyasha Mudani'
        AND rs.service_type = 'Standard'
        AND rs.bedrooms = 1
        AND rs.bathrooms = 1
        AND rs.frequency = 'custom-weekly'
        AND rs.preferred_time = '09:00:00'
    ) THEN 'EXISTS - Will update'
    ELSE 'DOES NOT EXIST - Will create'
  END as status;

-- Step 2: Create Nyasha's schedule based on Ethel's schedule
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
    -- Don't create if it already exists
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

-- Step 3: If it already exists, just update it to be active and set pricing
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

-- Step 4: Verify both schedules exist
SELECT 
  rs.id as schedule_id,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.is_active,
  ROUND(rs.total_amount / 100.0, 2) as total_amount_rands,
  ROUND(rs.cleaner_earnings / 100.0, 2) as cleaner_earnings_rands,
  rs.start_date,
  COUNT(b.id) as booking_count
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

-- Step 5: Show total count
SELECT 
  COUNT(*) as total_schedules,
  COUNT(*) FILTER (WHERE is_active = true) as active_schedules
FROM recurring_schedules;

COMMIT;

