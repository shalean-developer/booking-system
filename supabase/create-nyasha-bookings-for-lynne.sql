-- Create Missing Nyasha Bookings for Lynne Thorpe
-- Purpose: Create all missing bookings for Nyasha Mudani (Lynne should have 2 bookings per Monday/Thursday)
-- Date: January 2025

BEGIN;

-- ==============================================
-- STEP 1: CHECK CURRENT STATE
-- ==============================================
-- Show current bookings grouped by cleaner
SELECT 
  cl.name as cleaner_name,
  COUNT(*) as booking_count,
  MIN(b.booking_date) as earliest_date,
  MAX(b.booking_date) as latest_date
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND b.booking_date >= '2025-10-01'
  AND b.booking_date <= '2025-12-31'
GROUP BY cl.name
ORDER BY cl.name;

-- ==============================================
-- STEP 2: VERIFY NYASHA'S RECURRING SCHEDULE EXISTS
-- ==============================================
SELECT 
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  cl.name as cleaner_name,
  rs.service_type,
  rs.frequency,
  rs.days_of_week,
  rs.preferred_time,
  rs.total_amount,
  rs.cleaner_earnings,
  rs.is_active,
  rs.start_date
FROM recurring_schedules rs
INNER JOIN customers c ON rs.customer_id = c.id
INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
WHERE c.email = 'lynthorpe@gmail.com'
  AND cl.name = 'Nyasha Mudani'
  AND rs.is_active = true
ORDER BY rs.created_at;

-- ==============================================
-- STEP 3: CALCULATE ALL MONDAY AND THURSDAY DATES
-- ==============================================
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
  COUNT(*) OVER () as total_dates
FROM monday_thursday_dates
ORDER BY booking_date;

-- ==============================================
-- STEP 4: CREATE MISSING NYASHA BOOKINGS
-- ==============================================
-- This will create bookings for Nyasha for all Mondays and Thursdays
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
    rs.cleaner_id,
    rs.days_of_week
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
),
existing_nyasha_bookings AS (
  SELECT DISTINCT b.booking_date
  FROM bookings b
  INNER JOIN nyasha_schedule ns ON b.customer_id = ns.customer_id
  LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
  WHERE cl.name = 'Nyasha Mudani'
    AND b.booking_date >= '2025-10-01'
    AND b.booking_date <= '2025-12-31'
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
  ns.cleaner_id::text,
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
CROSS JOIN nyasha_schedule ns
WHERE NOT EXISTS (
  SELECT 1 
  FROM existing_nyasha_bookings enb 
  WHERE enb.booking_date = mtd.booking_date
)
AND ns.schedule_id IS NOT NULL;

-- ==============================================
-- STEP 5: VERIFICATION - Check booking counts per cleaner
-- ==============================================
SELECT 
  cl.name as cleaner_name,
  COUNT(*) as total_bookings,
  COUNT(CASE WHEN EXTRACT(DOW FROM b.booking_date) = 1 THEN 1 END) as monday_bookings,
  COUNT(CASE WHEN EXTRACT(DOW FROM b.booking_date) = 4 THEN 1 END) as thursday_bookings,
  MIN(b.booking_date) as earliest_date,
  MAX(b.booking_date) as latest_date
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND b.booking_date >= '2025-10-01'
  AND b.booking_date <= '2025-12-31'
GROUP BY cl.name
ORDER BY cl.name;

-- ==============================================
-- STEP 6: VERIFICATION - Check specific dates (Monday Nov 1, Thursday Nov 4)
-- ==============================================
SELECT 
  b.booking_date,
  TO_CHAR(b.booking_date, 'Day') as day_name,
  b.booking_time,
  cl.name as cleaner_name,
  b.id as booking_id,
  b.status
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND b.booking_date IN ('2025-11-01', '2025-11-04')
  AND b.booking_time = '09:00:00'
ORDER BY b.booking_date, cl.name;

COMMIT;

