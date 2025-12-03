-- ============================================
-- FIX LYNNE THORPE'S BOOKINGS FOR BOTH CLEANERS
-- ============================================
-- This script will:
-- 1. Calculate all Monday and Thursday dates for Oct, Nov, Dec 2025
-- 2. Delete existing incorrect bookings
-- 3. Create correct bookings for Ethel (R306, R250 earnings)
-- 4. Create correct bookings for Nyasha (R307, R250 earnings)
-- ============================================

BEGIN;

-- Step 1: Get schedule IDs
WITH lynne_schedules AS (
  SELECT 
    rs.id as schedule_id,
    cl.name as cleaner_name,
    rs.total_amount as schedule_total_cents,
    rs.cleaner_earnings as schedule_cleaner_earnings_cents
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
)
SELECT 
  schedule_id,
  cleaner_name,
  schedule_total_cents,
  schedule_cleaner_earnings_cents
FROM lynne_schedules;

-- Step 2: Calculate all Monday and Thursday dates for Oct, Nov, Dec 2024
-- Monday = 1, Thursday = 4
WITH date_series AS (
  SELECT generate_series(
    '2025-10-01'::date,
    '2025-12-31'::date,
    '1 day'::interval
  )::date as booking_date
),
monday_thursday_dates AS (
  SELECT booking_date
  FROM date_series
  WHERE EXTRACT(DOW FROM booking_date) IN (1, 4) -- Monday = 1, Thursday = 4
)
SELECT 
  booking_date,
  TO_CHAR(booking_date, 'Day') as day_name,
  CASE 
    WHEN EXTRACT(MONTH FROM booking_date) = 10 THEN 'October'
    WHEN EXTRACT(MONTH FROM booking_date) = 11 THEN 'November'
    WHEN EXTRACT(MONTH FROM booking_date) = 12 THEN 'December'
  END as month_name
FROM monday_thursday_dates
ORDER BY booking_date;

-- Step 3: Delete existing bookings for Lynne Thorpe's schedules
DELETE FROM bookings
WHERE recurring_schedule_id IN (
  SELECT rs.id
  FROM recurring_schedules rs
  INNER JOIN customers c ON rs.customer_id = c.id
  WHERE c.email = 'lynthorpe@gmail.com'
    AND rs.service_type = 'Standard'
    AND rs.bedrooms = 1
    AND rs.bathrooms = 1
    AND rs.frequency = 'custom-weekly'
    AND rs.preferred_time = '09:00:00'
    AND rs.is_active = true
)
AND booking_date >= '2024-10-01'
AND booking_date <= '2024-12-31';

-- Step 4: Create bookings for Ethel (R306, R250 earnings)
WITH date_series AS (
  SELECT generate_series(
    '2025-10-01'::date,
    '2025-12-31'::date,
    '1 day'::interval
  )::date as booking_date
),
monday_thursday_dates AS (
  SELECT booking_date
  FROM date_series
  WHERE EXTRACT(DOW FROM booking_date) IN (1, 4) -- Monday = 1, Thursday = 4
),
ethel_schedule AS (
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
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE c.email = 'lynthorpe@gmail.com'
    AND cl.name = 'Ethel Chizombe'
    AND rs.service_type = 'Standard'
    AND rs.bedrooms = 1
    AND rs.bathrooms = 1
    AND rs.frequency = 'custom-weekly'
    AND rs.preferred_time = '09:00:00'
    AND rs.is_active = true
  LIMIT 1
)
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
  es.customer_id,
  es.customer_name,
  es.customer_email,
  es.customer_phone,
  es.service_type,
  mtd.booking_date,
  es.booking_time,
  es.address_line1,
  es.address_suburb,
  es.address_city,
  es.total_amount_cents,
  es.cleaner_earnings_cents,
  es.cleaner_id,
  es.schedule_id,
  'pending' as status,
  jsonb_build_object(
    'service_type', es.service_type,
    'bedrooms', es.bedrooms,
    'bathrooms', es.bathrooms,
    'extras', '[]'::jsonb,
    'extrasQuantities', '{}'::jsonb,
    'subtotal', ROUND(es.total_amount_cents / 100.0 - 50, 0),
    'serviceFee', 50,
    'frequencyDiscount', 0,
    'total', ROUND(es.total_amount_cents / 100.0, 2),
    'snapshot_date', NOW()::text,
    'manual_pricing', true
  ) as price_snapshot,
  NOW() as created_at,
  NOW() as updated_at
FROM monday_thursday_dates mtd
CROSS JOIN ethel_schedule es;

-- Step 5: Create bookings for Nyasha (R307, R250 earnings)
WITH date_series AS (
  SELECT generate_series(
    '2025-10-01'::date,
    '2025-12-31'::date,
    '1 day'::interval
  )::date as booking_date
),
monday_thursday_dates AS (
  SELECT booking_date
  FROM date_series
  WHERE EXTRACT(DOW FROM booking_date) IN (1, 4) -- Monday = 1, Thursday = 4
),
nyasha_schedule AS (
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
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE c.email = 'lynthorpe@gmail.com'
    AND cl.name = 'Nyasha Mudani'
    AND rs.service_type = 'Standard'
    AND rs.bedrooms = 1
    AND rs.bathrooms = 1
    AND rs.frequency = 'custom-weekly'
    AND rs.preferred_time = '09:00:00'
    AND rs.is_active = true
  LIMIT 1
)
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
  ns.customer_id,
  ns.customer_name,
  ns.customer_email,
  ns.customer_phone,
  ns.service_type,
  mtd.booking_date,
  ns.booking_time,
  ns.address_line1,
  ns.address_suburb,
  ns.address_city,
  ns.total_amount_cents,
  ns.cleaner_earnings_cents,
  ns.cleaner_id,
  ns.schedule_id,
  'pending' as status,
  jsonb_build_object(
    'service_type', ns.service_type,
    'bedrooms', ns.bedrooms,
    'bathrooms', ns.bathrooms,
    'extras', '[]'::jsonb,
    'extrasQuantities', '{}'::jsonb,
    'subtotal', ROUND(ns.total_amount_cents / 100.0 - 50, 0),
    'serviceFee', 50,
    'frequencyDiscount', 0,
    'total', ROUND(ns.total_amount_cents / 100.0, 2),
    'snapshot_date', NOW()::text,
    'manual_pricing', true
  ) as price_snapshot,
  NOW() as created_at,
  NOW() as updated_at
FROM monday_thursday_dates mtd
CROSS JOIN nyasha_schedule ns;

-- Step 6: Verify booking counts per month for each cleaner
SELECT 
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  CASE 
    WHEN EXTRACT(MONTH FROM b.booking_date) = 10 THEN 'October'
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
WHERE c.email = 'lynthorpe@gmail.com'
  AND b.booking_date >= '2025-10-01'
  AND b.booking_date <= '2025-12-31'
GROUP BY cl.name, EXTRACT(MONTH FROM b.booking_date)
ORDER BY cl.name, EXTRACT(MONTH FROM b.booking_date);

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
WHERE c.email = 'lynthorpe@gmail.com'
  AND b.booking_date >= '2025-10-01'
  AND b.booking_date <= '2025-12-31'
ORDER BY b.booking_date, cl.name;

COMMIT;

