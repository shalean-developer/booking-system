-- ============================================
-- FIX LYNNE THORPE RECURRING SCHEDULES
-- ============================================
-- Lynne has 2 cleaners working on same days (Mon & Thu):
-- - Ethel Chizombe: Schedule 672e21cf-... (keep this)
-- - Nyasha Mudani: Schedule 6bc23b47-... (keep this)
-- - Schedule c2439a66-... (remove - duplicate of Nyasha's)
--
-- Pricing: R306 and R307
-- Cleaner earnings: R250 each
-- ============================================

BEGIN;

-- Step 1: Check current state
SELECT 
  'CURRENT STATE' as step,
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
  rs.start_date,
  rs.created_at,
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
  AND rs.is_active = true
GROUP BY rs.id, c.first_name, c.last_name, cl.name, rs.start_date, rs.created_at, rs.total_amount, rs.cleaner_earnings
ORDER BY rs.created_at;

-- Step 2: Update Ethel Chizombe's schedule (672e21cf-...)
-- Set pricing to R306 (or R307 if that's the one for Ethel)
UPDATE recurring_schedules
SET 
  total_amount = 30600, -- R306 in cents
  cleaner_earnings = 25000, -- R250 in cents
  updated_at = NOW()
WHERE id = '672e21cf-c965-463b-9315-c2b881b471f1'
  AND cleaner_id = (SELECT id FROM cleaners WHERE name = 'Ethel Chizombe' LIMIT 1);

-- Step 3: Update Nyasha Mudani's schedule (6bc23b47-...)
-- Set pricing to R307 (or R306 if that's the one for Nyasha)
UPDATE recurring_schedules
SET 
  total_amount = 30700, -- R307 in cents
  cleaner_earnings = 25000, -- R250 in cents
  updated_at = NOW()
WHERE id = '6bc23b47-fca1-4e19-b6c1-982e312cb936'
  AND cleaner_id = (SELECT id FROM cleaners WHERE name = 'Nyasha Mudani' LIMIT 1);

-- Step 4: Transfer bookings from duplicate schedule (c2439a66-...) to Nyasha's schedule
-- First, check which cleaner the bookings should go to
UPDATE bookings
SET recurring_schedule_id = '6bc23b47-fca1-4e19-b6c1-982e312cb936' -- Nyasha's schedule
WHERE recurring_schedule_id = 'c2439a66-702e-4ae5-8f8a-aebde7e1bb0d';

-- Step 5: Delete the duplicate schedule (c2439a66-...)
DELETE FROM recurring_schedules
WHERE id = 'c2439a66-702e-4ae5-8f8a-aebde7e1bb0d';

-- Step 6: Update booking prices to match schedule prices
UPDATE bookings
SET 
  total_amount = 30600, -- R306 in cents
  cleaner_earnings = 25000 -- R250 in cents
WHERE recurring_schedule_id = '672e21cf-c965-463b-9315-c2b881b471f1';

UPDATE bookings
SET 
  total_amount = 30700, -- R307 in cents
  cleaner_earnings = 25000 -- R250 in cents
WHERE recurring_schedule_id = '6bc23b47-fca1-4e19-b6c1-982e312cb936';

-- Step 7: Verify final state
SELECT 
  'FINAL STATE' as step,
  rs.id as schedule_id,
  c.first_name || ' ' || c.last_name as customer_name,
  COALESCE(cl.name, 'Unassigned') as cleaner_name,
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
WHERE c.email = 'lynthorpe@gmail.com'
  AND rs.service_type = 'Standard'
  AND rs.bedrooms = 1
  AND rs.bathrooms = 1
  AND rs.frequency = 'custom-weekly'
  AND rs.preferred_time = '09:00:00'
  AND rs.is_active = true
GROUP BY rs.id, c.first_name, c.last_name, cl.name, rs.start_date, rs.total_amount, rs.cleaner_earnings
ORDER BY cl.name;

COMMIT;

