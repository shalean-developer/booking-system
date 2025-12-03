-- ============================================
-- FIX BASHEERAH BEHARDIEN'S RECURRING SCHEDULE
-- ============================================
-- Schedule: Bi-weekly (every other Tuesday)
-- Cleaner: Natasha Magashito
-- Total Cost: R420.00 (42000 cents)
-- Cleaner Earnings: R250 (25000 cents)
-- Start Date: November 8, 2025
-- Period: November, December 2025
-- ============================================

BEGIN;

-- Step 1: Check current state
SELECT 
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.frequency,
  rs.preferred_time,
  rs.start_date,
  ROUND(rs.total_amount / 100.0, 2) as total_amount_rands,
  ROUND(rs.cleaner_earnings / 100.0, 2) as cleaner_earnings_rands,
  COUNT(b.id) as booking_count
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE c.email = 'behardienbasheerah@gmail.com'
  AND rs.is_active = true
GROUP BY rs.id, c.first_name, c.last_name, cl.name, rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.preferred_time, rs.start_date, rs.total_amount, rs.cleaner_earnings
ORDER BY rs.created_at;

-- Step 2: Update or create the schedule
-- First, try to update existing schedule
UPDATE recurring_schedules
SET 
  frequency = 'bi-weekly',
  day_of_week = 2, -- Tuesday = 2
  preferred_time = '09:00:00',
  start_date = '2025-11-08',
  total_amount = 42000, -- R420.00 in cents
  cleaner_earnings = 25000, -- R250 in cents
  cleaner_id = (SELECT id FROM cleaners WHERE name = 'Natasha Magashito' LIMIT 1),
  updated_at = NOW()
WHERE id IN (
  SELECT rs.id
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  WHERE c.email = 'behardienbasheerah@gmail.com'
    AND rs.is_active = true
  LIMIT 1
);

-- If no schedule exists, create one
-- Get customer ID and cleaner ID first
DO $$
DECLARE
  v_customer_id UUID;
  v_cleaner_id UUID;
  v_schedule_id UUID;
  v_existing_count INTEGER;
BEGIN
  -- Get customer ID
  SELECT id INTO v_customer_id FROM customers WHERE email = 'behardienbasheerah@gmail.com' LIMIT 1;
  
  -- Get cleaner ID
  SELECT id INTO v_cleaner_id FROM cleaners WHERE name = 'Natasha Magashito' LIMIT 1;
  
  -- Check if schedule exists
  SELECT COUNT(*) INTO v_existing_count
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  WHERE c.email = 'behardienbasheerah@gmail.com'
    AND rs.is_active = true;
  
  -- If no schedule exists, create one
  IF v_existing_count = 0 AND v_customer_id IS NOT NULL AND v_cleaner_id IS NOT NULL THEN
    -- Get address from existing schedule or use defaults
    INSERT INTO recurring_schedules (
      customer_id,
      service_type,
      bedrooms,
      bathrooms,
      frequency,
      day_of_week,
      preferred_time,
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
      'Standard' as service_type,
      1 as bedrooms,
      1 as bathrooms,
      'bi-weekly' as frequency,
      2 as day_of_week, -- Tuesday
      '09:00:00' as preferred_time,
      v_cleaner_id,
      true as is_active,
      '2025-11-08' as start_date,
      42000 as total_amount, -- R420.00 in cents
      25000 as cleaner_earnings, -- R250 in cents
      COALESCE(MAX(rs.address_line1), '') as address_line1,
      COALESCE(MAX(rs.address_suburb), '') as address_suburb,
      COALESCE(MAX(rs.address_city), '') as address_city,
      NOW() as created_at,
      NOW() as updated_at
    FROM recurring_schedules rs
    INNER JOIN customers c ON rs.customer_id = c.id
    WHERE c.email = 'behardienbasheerah@gmail.com'
    GROUP BY v_customer_id, v_cleaner_id
    LIMIT 1
    RETURNING id INTO v_schedule_id;
    
    RAISE NOTICE 'Created new schedule for Basheerah Behardien with ID: %', v_schedule_id;
  END IF;
END $$;

-- Step 3: Delete existing bookings for Nov, Dec 2025
DELETE FROM bookings
WHERE recurring_schedule_id IN (
  SELECT rs.id
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  WHERE c.email = 'behardienbasheerah@gmail.com'
    AND rs.is_active = true
)
AND booking_date >= '2025-11-01'
AND booking_date <= '2025-12-31';

-- Step 4: Create bookings for bi-weekly Tuesdays starting from Nov 8, 2025
-- Bi-weekly means every 14 days starting from the schedule start date
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
SELECT 
  'SCS-' || LPAD((FLOOR(RANDOM() * 90000000) + 10000000 + (EXTRACT(EPOCH FROM NOW())::bigint % 1000000))::text, 8, '0') as id,
  si.customer_id,
  si.customer_name,
  si.customer_email,
  si.customer_phone,
  si.service_type,
  bwd.booking_date,
  si.booking_time,
  si.address_line1,
  si.address_suburb,
  si.address_city,
  si.total_amount_cents,
  si.cleaner_earnings_cents,
  si.cleaner_id,
  si.schedule_id,
  'pending' as status,
  jsonb_build_object(
    'service_type', si.service_type,
    'bedrooms', si.bedrooms,
    'bathrooms', si.bathrooms,
    'extras', '[]'::jsonb,
    'extrasQuantities', '{}'::jsonb,
    'subtotal', ROUND(si.total_amount_cents / 100.0 - 50, 0),
    'serviceFee', 50,
    'frequencyDiscount', 0,
    'total', ROUND(si.total_amount_cents / 100.0, 2),
    'snapshot_date', NOW()::text,
    'manual_pricing', true
  ) as price_snapshot,
  NOW() as created_at,
  NOW() as updated_at
FROM (
  SELECT 
    (rs.start_date + (generate_series(0, 70, 14) * interval '1 day'))::date as booking_date
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  WHERE c.email = 'behardienbasheerah@gmail.com'
    AND rs.is_active = true
    AND rs.start_date IS NOT NULL
  LIMIT 1
) bwd
CROSS JOIN (
  SELECT 
    rs.id as schedule_id,
    rs.customer_id,
    c.first_name || ' ' || c.last_name as customer_name,
    c.email as customer_email,
    c.phone as customer_phone,
    rs.service_type,
    rs.bedrooms,
    rs.bathrooms,
    rs.preferred_time as booking_time,
    rs.address_line1,
    rs.address_suburb,
    rs.address_city,
    rs.total_amount as total_amount_cents,
    rs.cleaner_earnings as cleaner_earnings_cents,
    rs.cleaner_id
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  WHERE c.email = 'behardienbasheerah@gmail.com'
    AND rs.is_active = true
  LIMIT 1
) si
WHERE bwd.booking_date <= '2025-12-31' 
  AND bwd.booking_date >= '2025-11-08'
  AND EXTRACT(DOW FROM bwd.booking_date) = 2; -- Ensure it's a Tuesday

-- Step 5: Verify final state
SELECT 
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.service_type || ', ' || rs.bedrooms || ' bed, ' || rs.bathrooms || ' bath' as service,
  rs.frequency,
  rs.preferred_time,
  rs.start_date,
  ROUND(rs.total_amount / 100.0, 2) as schedule_total_rands,
  ROUND(rs.cleaner_earnings / 100.0, 2) as schedule_cleaner_earnings_rands,
  COUNT(b.id) as booking_count,
  ROUND(AVG(b.total_amount) / 100.0, 2) as avg_booking_total_rands,
  ROUND(AVG(b.cleaner_earnings) / 100.0, 2) as avg_booking_cleaner_earnings_rands
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON rs.cleaner_id = cl.id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
WHERE c.email = 'behardienbasheerah@gmail.com'
  AND rs.is_active = true
GROUP BY rs.id, c.first_name, c.last_name, cl.name, rs.service_type, rs.bedrooms, rs.bathrooms, rs.frequency, rs.preferred_time, rs.start_date, rs.total_amount, rs.cleaner_earnings;

-- Step 6: Show booking counts per month
SELECT 
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  CASE 
    WHEN EXTRACT(MONTH FROM b.booking_date) = 11 THEN 'November'
    WHEN EXTRACT(MONTH FROM b.booking_date) = 12 THEN 'December'
  END as month,
  COUNT(*) as booking_count,
  ROUND(SUM(b.total_amount) / 100.0, 2) as total_revenue_rands,
  ROUND(SUM(b.cleaner_earnings) / 100.0, 2) as total_cleaner_earnings_rands
FROM bookings b
INNER JOIN recurring_schedules rs ON b.recurring_schedule_id = rs.id
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id IS NOT NULL 
  AND b.cleaner_id != 'manual' 
  AND b.cleaner_id::uuid = cl.id
WHERE c.email = 'behardienbasheerah@gmail.com'
  AND b.booking_date >= '2025-11-01'
  AND b.booking_date <= '2025-12-31'
GROUP BY cl.name, EXTRACT(MONTH FROM b.booking_date)
ORDER BY EXTRACT(MONTH FROM b.booking_date);

-- Step 7: Show all bookings by date
SELECT 
  b.booking_date,
  TO_CHAR(b.booking_date, 'Day') as day_name,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  ROUND(b.total_amount / 100.0, 2) as total_rands,
  ROUND(b.cleaner_earnings / 100.0, 2) as cleaner_earnings_rands
FROM bookings b
INNER JOIN recurring_schedules rs ON b.recurring_schedule_id = rs.id
INNER JOIN customers c ON rs.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id IS NOT NULL 
  AND b.cleaner_id != 'manual' 
  AND b.cleaner_id::uuid = cl.id
WHERE c.email = 'behardienbasheerah@gmail.com'
  AND b.booking_date >= '2025-11-01'
  AND b.booking_date <= '2025-12-31'
ORDER BY b.booking_date;

COMMIT;

