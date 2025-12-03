-- Merge Duplicate Fatima Customer Records
-- Purpose: Find and merge duplicate customer records for Fatima
-- This script will:
-- 1. Identify all duplicate Fatima customers
-- 2. Select the primary record (oldest or most complete)
-- 3. Merge all related data (bookings, recurring_schedules) to the primary record
-- 4. Delete duplicate records
-- Date: January 2025

-- ==============================================
-- STEP 0: FIRST, FIND ALL CUSTOMERS (BROAD SEARCH)
-- ==============================================
-- Run this first to see what customers exist
-- This helps identify the correct name/spelling
SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  created_at
FROM customers
ORDER BY created_at DESC
LIMIT 50;

-- ==============================================
-- STEP 0.5: SEARCH FOR SIMILAR NAMES
-- ==============================================
-- Try different search patterns to find the customer
-- Uncomment and modify the search term as needed:

-- Search for "fatima" variations:
-- SELECT * FROM customers WHERE LOWER(first_name || ' ' || last_name) LIKE '%fati%';

-- Search by email if you know it:
-- SELECT * FROM customers WHERE email LIKE '%@%' ORDER BY email;

-- Search recent customers:
-- SELECT * FROM customers ORDER BY created_at DESC LIMIT 20;

BEGIN;

-- ==============================================
-- STEP 1: IDENTIFY ALL FATIMA CUSTOMERS
-- ==============================================
SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  address_line1,
  address_suburb,
  address_city,
  total_bookings,
  created_at,
  updated_at
FROM customers
WHERE LOWER(first_name) LIKE '%fatima%'
   OR LOWER(last_name) LIKE '%fatima%'
   OR LOWER(email) LIKE '%fatima%'
   OR LOWER(first_name || ' ' || last_name) LIKE '%fatima%'
ORDER BY created_at;

-- ==============================================
-- STEP 2: FIND DUPLICATES BY EMAIL OR NAME
-- ==============================================
-- Find customers with same email
SELECT 
  email,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as customer_ids,
  STRING_AGG(first_name || ' ' || last_name, ' | ') as names
FROM customers
WHERE email IS NOT NULL 
  AND email != ''
  AND (LOWER(first_name) LIKE '%fatima%' 
       OR LOWER(last_name) LIKE '%fatima%' 
       OR LOWER(email) LIKE '%fatima%'
       OR LOWER(first_name || ' ' || last_name) LIKE '%fatima%')
GROUP BY email
HAVING COUNT(*) > 1;

-- Find customers with same name
SELECT 
  first_name,
  last_name,
  COUNT(*) as duplicate_count,
  STRING_AGG(id::text, ', ') as customer_ids,
  STRING_AGG(email, ' | ') as emails
FROM customers
WHERE (LOWER(first_name) LIKE '%fatima%' 
       OR LOWER(last_name) LIKE '%fatima%' 
       OR LOWER(first_name || ' ' || last_name) LIKE '%fatima%')
GROUP BY first_name, last_name
HAVING COUNT(*) > 1;

-- ==============================================
-- STEP 3: SELECT PRIMARY CUSTOMER (KEEP THIS ONE)
-- ==============================================
-- Choose the customer with:
-- 1. Most bookings (if any)
-- 2. Most complete information
-- 3. Oldest created_at (if tied)
DO $$
DECLARE
  primary_customer_id UUID;
  duplicate_customer_ids UUID[];
  customer_record RECORD;
  fatima_count INTEGER;
BEGIN
  -- First, check if any Fatima customers exist
  SELECT COUNT(*) INTO fatima_count
  FROM customers
  WHERE (LOWER(first_name) LIKE '%fatima%' 
         OR LOWER(last_name) LIKE '%fatima%' 
         OR LOWER(email) LIKE '%fatima%'
         OR LOWER(first_name || ' ' || last_name) LIKE '%fatima%');

  IF fatima_count = 0 THEN
    RAISE NOTICE 'No customers found matching "Fatima". Showing all customers for reference:';
    FOR customer_record IN 
      SELECT id, first_name, last_name, email, phone, created_at
      FROM customers
      ORDER BY created_at DESC
      LIMIT 20
    LOOP
      RAISE NOTICE 'Customer: % % (Email: %, ID: %)', 
        customer_record.first_name, 
        customer_record.last_name, 
        customer_record.email, 
        customer_record.id;
    END LOOP;
    RAISE EXCEPTION 'No Fatima customer found. Please check the name spelling or use a different search term.';
  END IF;

  RAISE NOTICE 'Found % customer(s) matching "Fatima"', fatima_count;

  -- Find the best primary customer (most bookings, most complete info, oldest)
  SELECT id INTO primary_customer_id
  FROM customers
  WHERE (LOWER(first_name) LIKE '%fatima%' 
         OR LOWER(last_name) LIKE '%fatima%' 
         OR LOWER(email) LIKE '%fatima%'
         OR LOWER(first_name || ' ' || last_name) LIKE '%fatima%')
  ORDER BY 
    COALESCE(total_bookings, 0) DESC,
    CASE WHEN email IS NOT NULL AND email != '' THEN 1 ELSE 0 END DESC,
    CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 ELSE 0 END DESC,
    CASE WHEN address_line1 IS NOT NULL AND address_line1 != '' THEN 1 ELSE 0 END DESC,
    created_at ASC
  LIMIT 1;

  IF primary_customer_id IS NULL THEN
    RAISE EXCEPTION 'Could not determine primary customer ID';
  END IF;

  RAISE NOTICE 'Primary customer ID: %', primary_customer_id;

  -- Get all duplicate customer IDs (excluding primary)
  SELECT ARRAY_AGG(id) INTO duplicate_customer_ids
  FROM customers
  WHERE (LOWER(first_name) LIKE '%fatima%' 
         OR LOWER(last_name) LIKE '%fatima%' 
         OR LOWER(email) LIKE '%fatima%'
         OR LOWER(first_name || ' ' || last_name) LIKE '%fatima%')
    AND id != primary_customer_id;

  IF duplicate_customer_ids IS NULL OR array_length(duplicate_customer_ids, 1) IS NULL THEN
    RAISE NOTICE 'No duplicates found';
    RETURN;
  END IF;

  RAISE NOTICE 'Found % duplicate customers to merge', array_length(duplicate_customer_ids, 1);

  -- ==============================================
  -- STEP 4: UPDATE BOOKINGS TO POINT TO PRIMARY CUSTOMER
  -- ==============================================
  UPDATE bookings
  SET customer_id = primary_customer_id,
      updated_at = NOW()
  WHERE customer_id = ANY(duplicate_customer_ids);

  RAISE NOTICE 'Updated bookings: %', ROW_COUNT;

  -- ==============================================
  -- STEP 5: UPDATE RECURRING SCHEDULES TO POINT TO PRIMARY CUSTOMER
  -- ==============================================
  UPDATE recurring_schedules
  SET customer_id = primary_customer_id,
      updated_at = NOW()
  WHERE customer_id = ANY(duplicate_customer_ids);

  RAISE NOTICE 'Updated recurring schedules: %', ROW_COUNT;

  -- ==============================================
  -- STEP 6: MERGE CUSTOMER DATA (FILL IN MISSING INFO)
  -- ==============================================
  -- Update primary customer with best data from duplicates
  UPDATE customers
  SET 
    email = COALESCE(
      NULLIF(email, ''),
      (SELECT email FROM customers WHERE id = ANY(duplicate_customer_ids) AND email IS NOT NULL AND email != '' LIMIT 1)
    ),
    phone = COALESCE(
      NULLIF(phone, ''),
      (SELECT phone FROM customers WHERE id = ANY(duplicate_customer_ids) AND phone IS NOT NULL AND phone != '' LIMIT 1)
    ),
    address_line1 = COALESCE(
      NULLIF(address_line1, ''),
      (SELECT address_line1 FROM customers WHERE id = ANY(duplicate_customer_ids) AND address_line1 IS NOT NULL AND address_line1 != '' LIMIT 1)
    ),
    address_suburb = COALESCE(
      NULLIF(address_suburb, ''),
      (SELECT address_suburb FROM customers WHERE id = ANY(duplicate_customer_ids) AND address_suburb IS NOT NULL AND address_suburb != '' LIMIT 1)
    ),
    address_city = COALESCE(
      NULLIF(address_city, ''),
      (SELECT address_city FROM customers WHERE id = ANY(duplicate_customer_ids) AND address_city IS NOT NULL AND address_city != '' LIMIT 1)
    ),
    total_bookings = (
      SELECT COUNT(*) FROM bookings WHERE customer_id = primary_customer_id
    ),
    updated_at = NOW()
  WHERE id = primary_customer_id;

  RAISE NOTICE 'Updated primary customer data';

  -- ==============================================
  -- STEP 7: DELETE DUPLICATE CUSTOMERS
  -- ==============================================
  DELETE FROM customers
  WHERE id = ANY(duplicate_customer_ids);

  RAISE NOTICE 'Deleted % duplicate customers', ROW_COUNT;

  RAISE NOTICE '✅ Merge complete! Primary customer ID: %', primary_customer_id;
END $$;

-- ==============================================
-- STEP 8: VERIFICATION - Check final state
-- ==============================================
SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  total_bookings,
  created_at
FROM customers
WHERE (LOWER(first_name) LIKE '%fatima%' 
       OR LOWER(last_name) LIKE '%fatima%' 
       OR LOWER(email) LIKE '%fatima%'
       OR LOWER(first_name || ' ' || last_name) LIKE '%fatima%')
ORDER BY created_at;

-- Check bookings count
SELECT 
  c.id,
  c.first_name || ' ' || c.last_name as customer_name,
  COUNT(b.id) as booking_count
FROM customers c
LEFT JOIN bookings b ON b.customer_id = c.id
WHERE (LOWER(c.first_name) LIKE '%fatima%' 
       OR LOWER(c.last_name) LIKE '%fatima%' 
       OR LOWER(c.email) LIKE '%fatima%'
       OR LOWER(c.first_name || ' ' || c.last_name) LIKE '%fatima%')
GROUP BY c.id, c.first_name, c.last_name;

-- Check recurring schedules count
SELECT 
  c.id,
  c.first_name || ' ' || c.last_name as customer_name,
  COUNT(rs.id) as recurring_schedule_count
FROM customers c
LEFT JOIN recurring_schedules rs ON rs.customer_id = c.id
WHERE (LOWER(c.first_name) LIKE '%fatima%' 
       OR LOWER(c.last_name) LIKE '%fatima%' 
       OR LOWER(c.email) LIKE '%fatima%'
       OR LOWER(c.first_name || ' ' || c.last_name) LIKE '%fatima%')
GROUP BY c.id, c.first_name, c.last_name;

COMMIT;

-- ==============================================
-- ROLLBACK INSTRUCTIONS
-- ==============================================
-- If something goes wrong, run:
-- ROLLBACK;
--
-- To see what will be merged before committing, run steps 1-3 only,
-- then manually set the primary_customer_id in the DO block above.

