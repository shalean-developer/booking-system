-- ============================================
-- RESTORE/CREATE NYASHA MUDANI'S SCHEDULE FOR LYNNE THORPE
-- ============================================
-- This script will:
-- 1. Check if Nyasha's schedule exists (active or inactive)
-- 2. If it exists but is inactive, reactivate it
-- 3. If it doesn't exist, create it based on Ethel's schedule
-- ============================================

BEGIN;

-- Step 1: Check current state
SELECT 
  'BEFORE RESTORATION' as step,
  rs.id as schedule_id,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.is_active,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
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
GROUP BY rs.id, cl.name, rs.is_active, rs.service_type, rs.bedrooms, rs.bathrooms, rs.start_date
ORDER BY cl.name;

-- Step 2: Check if Nyasha's schedule exists (even if inactive)
WITH lynne_customer AS (
  SELECT id FROM customers WHERE email = 'lynthorpe@gmail.com' LIMIT 1
),
nyasha_cleaner AS (
  SELECT id FROM cleaners WHERE name = 'Nyasha Mudani' LIMIT 1
),
ethel_schedule AS (
  SELECT 
    rs.*,
    (SELECT id FROM lynne_customer) as customer_id,
    (SELECT id FROM nyasha_cleaner) as nyasha_id
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
  LIMIT 1
)
SELECT 
  CASE 
    WHEN EXISTS (
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
    ) THEN 'EXISTS - Will reactivate'
    ELSE 'DOES NOT EXIST - Will create new'
  END as nyasha_schedule_status;

-- Step 3: Reactivate or create Nyasha's schedule
-- First, try to reactivate if it exists
UPDATE recurring_schedules
SET 
  is_active = true,
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

-- If no rows were updated, create a new schedule
-- Get the IDs we need
DO $$
DECLARE
  v_customer_id UUID;
  v_nyasha_id UUID;
  v_ethel_schedule_id UUID;
  v_new_schedule_id UUID;
  v_days_of_week INTEGER[];
BEGIN
  -- Get customer ID
  SELECT id INTO v_customer_id FROM customers WHERE email = 'lynthorpe@gmail.com' LIMIT 1;
  
  -- Get Nyasha's cleaner ID
  SELECT id INTO v_nyasha_id FROM cleaners WHERE name = 'Nyasha Mudani' LIMIT 1;
  
  -- Get Ethel's schedule to copy settings
  SELECT 
    rs.id,
    rs.days_of_week
  INTO 
    v_ethel_schedule_id,
    v_days_of_week
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
  LIMIT 1;
  
  -- Check if Nyasha's schedule already exists (even if inactive)
  SELECT id INTO v_new_schedule_id
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE c.email = 'lynthorpe@gmail.com'
    AND cl.name = 'Nyasha Mudani'
    AND rs.service_type = 'Standard'
    AND rs.bedrooms = 1
    AND rs.bathrooms = 1
    AND rs.frequency = 'custom-weekly'
    AND rs.preferred_time = '09:00:00';
  
  -- If it doesn't exist, create it
  IF v_new_schedule_id IS NULL AND v_customer_id IS NOT NULL AND v_nyasha_id IS NOT NULL AND v_ethel_schedule_id IS NOT NULL THEN
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
      v_customer_id,
      service_type,
      bedrooms,
      bathrooms,
      frequency,
      preferred_time,
      days_of_week,
      v_nyasha_id, -- Use Nyasha's ID instead of Ethel's
      true, -- Active
      start_date,
      30700, -- R307 in cents
      25000, -- R250 in cents
      address_line1,
      address_suburb,
      address_city,
      NOW(),
      NOW()
    FROM recurring_schedules
    WHERE id = v_ethel_schedule_id
    RETURNING id INTO v_new_schedule_id;
    
    RAISE NOTICE 'Created new schedule for Nyasha Mudani with ID: %', v_new_schedule_id;
  ELSE
    RAISE NOTICE 'Nyasha schedule already exists or required data missing';
  END IF;
END $$;

-- Step 4: Update Nyasha's schedule pricing
UPDATE recurring_schedules
SET 
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

-- Step 5: Verify final state
SELECT 
  'AFTER RESTORATION' as step,
  rs.id as schedule_id,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.is_active,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.start_date,
  ROUND(rs.total_amount / 100.0, 2) as total_amount_rands,
  ROUND(rs.cleaner_earnings / 100.0, 2) as cleaner_earnings_rands,
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
GROUP BY rs.id, cl.name, rs.is_active, rs.service_type, rs.bedrooms, rs.bathrooms, rs.start_date, rs.total_amount, rs.cleaner_earnings
ORDER BY cl.name;

COMMIT;

