-- Restore Missing Monday Booking for Lynne Thorpe
-- Purpose: Restore the missing booking on Monday Nov 1, 2025
-- Lynne Thorpe should have 2 bookings on Monday (one for Ethel, one for Nyasha)
-- Date: January 2025

BEGIN;

-- ==============================================
-- STEP 1: CHECK CURRENT STATE
-- ==============================================
SELECT 
  b.booking_date,
  b.booking_time,
  cl.name as cleaner_name,
  b.recurring_schedule_id,
  b.id as booking_id,
  b.status
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND b.booking_date = '2025-11-01'  -- Monday
  AND b.booking_time = '09:00:00'
ORDER BY b.created_at;

-- ==============================================
-- STEP 2: FIND WHICH CLEANER IS MISSING
-- ==============================================
-- Check which schedules exist and which cleaner has a booking
WITH lynne_customer AS (
  SELECT id FROM customers WHERE email = 'lynthorpe@gmail.com' LIMIT 1
),
existing_bookings AS (
  SELECT 
    b.cleaner_id::uuid as cleaner_id_uuid,
    b.recurring_schedule_id,
    cl.name as cleaner_name
  FROM bookings b
  INNER JOIN lynne_customer lc ON b.customer_id = lc.id
  LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
  WHERE b.booking_date = '2025-11-01'
    AND b.booking_time = '09:00:00'
    AND b.cleaner_id IS NOT NULL
    AND b.cleaner_id != 'manual'
),
all_schedules AS (
  SELECT 
    rs.id as schedule_id,
    rs.customer_id,
    cl.name as cleaner_name,
    rs.cleaner_id::uuid as cleaner_id_uuid,
    rs.total_amount,
    rs.cleaner_earnings,
    rs.service_type,
    rs.bedrooms,
    rs.bathrooms,
    rs.preferred_time,
    rs.address_line1,
    rs.address_suburb,
    rs.address_city
  FROM recurring_schedules rs
  INNER JOIN lynne_customer lc ON rs.customer_id = lc.id
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE rs.is_active = true
    AND rs.service_type = 'Standard'
    AND rs.frequency = 'custom-weekly'
    AND rs.preferred_time = '09:00:00'
    AND rs.days_of_week @> ARRAY[1]  -- Monday
)
SELECT 
  s.schedule_id,
  s.cleaner_name,
  CASE WHEN eb.cleaner_id_uuid IS NOT NULL THEN 'Has booking' ELSE 'Missing booking' END as status
FROM all_schedules s
LEFT JOIN existing_bookings eb ON s.cleaner_id_uuid = eb.cleaner_id_uuid
ORDER BY s.cleaner_name;

-- ==============================================
-- STEP 3: CREATE MISSING BOOKING
-- ==============================================
-- This will create the missing booking for the cleaner that doesn't have one
DO $$
DECLARE
  v_customer_id UUID;
  v_missing_schedule_id UUID;
  v_missing_cleaner_id UUID;
  v_missing_cleaner_name TEXT;
  v_booking_id TEXT;
  v_existing_cleaner_ids UUID[];
  -- Schedule data variables
  v_customer_name TEXT;
  v_customer_email TEXT;
  v_customer_phone TEXT;
  v_service_type TEXT;
  v_bedrooms INTEGER;
  v_bathrooms INTEGER;
  v_preferred_time TIME;
  v_address_line1 TEXT;
  v_address_suburb TEXT;
  v_address_city TEXT;
  v_total_amount INTEGER;
  v_cleaner_earnings INTEGER;
  v_cleaner_id_for_booking TEXT;
BEGIN
  -- Get customer ID
  SELECT id INTO v_customer_id FROM customers WHERE email = 'lynthorpe@gmail.com' LIMIT 1;
  
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Lynne Thorpe customer not found';
  END IF;
  
  -- Get existing cleaner IDs for Monday Nov 1
  SELECT ARRAY_AGG(DISTINCT cleaner_id::uuid) INTO v_existing_cleaner_ids
  FROM bookings
  WHERE customer_id = v_customer_id
    AND booking_date = '2025-11-01'
    AND booking_time = '09:00:00'
    AND cleaner_id IS NOT NULL
    AND cleaner_id != 'manual';
  
  -- Find the schedule that doesn't have a booking (the missing cleaner)
  SELECT 
    rs.id,
    rs.cleaner_id::uuid,
    cl.name
  INTO v_missing_schedule_id, v_missing_cleaner_id, v_missing_cleaner_name
  FROM recurring_schedules rs
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE rs.customer_id = v_customer_id
    AND rs.is_active = true
    AND rs.service_type = 'Standard'
    AND rs.frequency = 'custom-weekly'
    AND rs.preferred_time = '09:00:00'
    AND rs.days_of_week @> ARRAY[1]  -- Monday
    AND (v_existing_cleaner_ids IS NULL OR rs.cleaner_id::uuid != ALL(v_existing_cleaner_ids))
  LIMIT 1;
  
  IF v_missing_schedule_id IS NULL THEN
    RAISE NOTICE 'No missing booking found. Both cleaners may already have bookings.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found missing booking for cleaner: % (Schedule: %)', v_missing_cleaner_name, v_missing_schedule_id;
  
  -- Get schedule data with customer info
  SELECT 
    c.first_name || ' ' || c.last_name,
    c.email,
    c.phone,
    rs.service_type,
    rs.bedrooms,
    rs.bathrooms,
    rs.preferred_time,
    rs.address_line1,
    rs.address_suburb,
    rs.address_city,
    rs.total_amount,
    rs.cleaner_earnings,
    rs.cleaner_id::text
  INTO 
    v_customer_name,
    v_customer_email,
    v_customer_phone,
    v_service_type,
    v_bedrooms,
    v_bathrooms,
    v_preferred_time,
    v_address_line1,
    v_address_suburb,
    v_address_city,
    v_total_amount,
    v_cleaner_earnings,
    v_cleaner_id_for_booking
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  WHERE rs.id = v_missing_schedule_id;
  
  -- Generate booking ID
  v_booking_id := 'SCS-' || LPAD((FLOOR(RANDOM() * 90000000) + 10000000 + (EXTRACT(EPOCH FROM NOW())::bigint % 1000000))::text, 8, '0');
  
  -- Create the missing booking
  INSERT INTO bookings (
    id,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    service_type,
    booking_date,
    booking_time,
    address_line1,
    address_suburb,
    address_city,
    total_amount,
    cleaner_earnings,
    cleaner_id,
    recurring_schedule_id,
    status,
    price_snapshot,
    created_at,
    updated_at
  )
  VALUES (
    v_booking_id,
    v_customer_id,
    v_customer_name,
    v_customer_email,
    v_customer_phone,
    v_service_type,
    '2025-11-01',  -- Monday
    v_preferred_time,
    v_address_line1,
    v_address_suburb,
    v_address_city,
    v_total_amount,
    v_cleaner_earnings,
    v_cleaner_id_for_booking,
    v_missing_schedule_id,
    'pending',
    jsonb_build_object(
      'service_type', v_service_type,
      'bedrooms', v_bedrooms,
      'bathrooms', v_bathrooms,
      'extras', '[]'::jsonb,
      'extrasQuantities', '{}'::jsonb,
      'subtotal', ROUND(v_total_amount / 100.0 - 50, 0),
      'serviceFee', 50,
      'frequencyDiscount', 0,
      'total', ROUND(v_total_amount / 100.0, 2),
      'snapshot_date', NOW()::text,
      'manual_pricing', true
    ),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Created missing booking: % for %', v_booking_id, v_missing_cleaner_name;
END $$;

-- ==============================================
-- STEP 4: VERIFICATION
-- ==============================================
SELECT 
  b.booking_date,
  TO_CHAR(b.booking_date, 'Day') as day_name,
  b.booking_time,
  cl.name as cleaner_name,
  b.recurring_schedule_id,
  b.id as booking_id,
  b.status,
  ROUND(b.total_amount / 100.0, 2) as total_rands
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND b.booking_date = '2025-11-01'  -- Monday
  AND b.booking_time = '09:00:00'
ORDER BY cl.name;

COMMIT;

