-- Simple Script to Find and Merge Duplicate Customers
-- Follow these steps one at a time
-- Date: January 2025

-- ==============================================
-- STEP 1: FIND CUSTOMERS (RUN THIS FIRST)
-- ==============================================
-- This will show you all customers. Look for duplicates.
-- You can modify the search term or remove the WHERE clause to see all customers

SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  total_bookings,
  created_at,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = customers.id) as actual_bookings,
  (SELECT COUNT(*) FROM recurring_schedules WHERE customer_id = customers.id) as schedules
FROM customers
-- Uncomment and modify one of these lines to search:
-- WHERE LOWER(first_name) LIKE '%fatima%' OR LOWER(last_name) LIKE '%fatima%'
-- WHERE email LIKE '%@example.com%'  -- Replace with actual email domain
-- WHERE LOWER(first_name || ' ' || last_name) LIKE '%search_term%'
ORDER BY created_at DESC;

-- ==============================================
-- STEP 2: FIND DUPLICATES BY EMAIL
-- ==============================================
-- This finds customers with the same email address

SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as customer_ids,
  STRING_AGG(first_name || ' ' || last_name, ' | ') as names
FROM customers
WHERE email IS NOT NULL AND email != ''
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- ==============================================
-- STEP 3: FIND DUPLICATES BY NAME
-- ==============================================
-- This finds customers with the same first and last name

SELECT 
  first_name,
  last_name,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as customer_ids,
  STRING_AGG(email, ' | ') as emails
FROM customers
GROUP BY first_name, last_name
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- ==============================================
-- STEP 4: MERGE DUPLICATES (RUN AFTER STEP 1-3)
-- ==============================================
-- IMPORTANT: Replace the UUIDs below with actual customer IDs from Step 1-3
-- 
-- PRIMARY_ID: The customer you want to KEEP (best one with most data/bookings)
-- DUPLICATE_IDS: The customers you want to MERGE INTO the primary (will be deleted)

BEGIN;

DO $$
DECLARE
  -- ⚠️ REPLACE THESE WITH ACTUAL UUIDs FROM STEP 1-3 ⚠️
  -- Example: primary_customer_id UUID := '123e4567-e89b-12d3-a456-426614174000';
  primary_customer_id UUID;
  duplicate_customer_ids UUID[];
  
  -- Or set them directly here (uncomment and fill in):
  -- primary_customer_id UUID := 'PASTE_PRIMARY_UUID_HERE';
  -- duplicate_customer_ids UUID[] := ARRAY['PASTE_DUPLICATE_UUID_1', 'PASTE_DUPLICATE_UUID_2'];
BEGIN
  -- ⚠️ SET YOUR CUSTOMER IDs HERE ⚠️
  -- Copy the UUIDs from Step 1 results and paste them here:
  
  primary_customer_id := NULL;  -- Replace NULL with your primary customer UUID
  duplicate_customer_ids := ARRAY[]::UUID[];  -- Replace [] with array of duplicate UUIDs
  
  -- Example format:
  -- primary_customer_id := '550e8400-e29b-41d4-a716-446655440000'::UUID;
  -- duplicate_customer_ids := ARRAY[
  --   '660e8400-e29b-41d4-a716-446655440001'::UUID,
  --   '770e8400-e29b-41d4-a716-446655440002'::UUID
  -- ];
  
  -- Validation
  IF primary_customer_id IS NULL THEN
    RAISE EXCEPTION 'Please set primary_customer_id with the UUID of the customer you want to keep';
  END IF;
  
  IF array_length(duplicate_customer_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Please set duplicate_customer_ids with an array of UUIDs to merge';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM customers WHERE id = primary_customer_id) THEN
    RAISE EXCEPTION 'Primary customer ID % does not exist', primary_customer_id;
  END IF;
  
  -- Show what will be merged
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MERGING DUPLICATE CUSTOMERS';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Primary customer (KEEP): %', primary_customer_id;
  RAISE NOTICE 'Duplicates to merge: %', array_length(duplicate_customer_ids, 1);
  
  -- Update bookings
  UPDATE bookings
  SET customer_id = primary_customer_id, updated_at = NOW()
  WHERE customer_id = ANY(duplicate_customer_ids);
  RAISE NOTICE 'Updated % booking(s)', ROW_COUNT;
  
  -- Update recurring schedules
  UPDATE recurring_schedules
  SET customer_id = primary_customer_id, updated_at = NOW()
  WHERE customer_id = ANY(duplicate_customer_ids);
  RAISE NOTICE 'Updated % recurring schedule(s)', ROW_COUNT;
  
  -- Merge customer data (fill missing info from duplicates)
  UPDATE customers
  SET 
    email = COALESCE(NULLIF(email, ''), 
      (SELECT email FROM customers WHERE id = ANY(duplicate_customer_ids) AND email IS NOT NULL AND email != '' LIMIT 1)),
    phone = COALESCE(NULLIF(phone, ''), 
      (SELECT phone FROM customers WHERE id = ANY(duplicate_customer_ids) AND phone IS NOT NULL AND phone != '' LIMIT 1)),
    address_line1 = COALESCE(NULLIF(address_line1, ''), 
      (SELECT address_line1 FROM customers WHERE id = ANY(duplicate_customer_ids) AND address_line1 IS NOT NULL AND address_line1 != '' LIMIT 1)),
    address_suburb = COALESCE(NULLIF(address_suburb, ''), 
      (SELECT address_suburb FROM customers WHERE id = ANY(duplicate_customer_ids) AND address_suburb IS NOT NULL AND address_suburb != '' LIMIT 1)),
    address_city = COALESCE(NULLIF(address_city, ''), 
      (SELECT address_city FROM customers WHERE id = ANY(duplicate_customer_ids) AND address_city IS NOT NULL AND address_city != '' LIMIT 1)),
    total_bookings = (SELECT COUNT(*) FROM bookings WHERE customer_id = primary_customer_id),
    updated_at = NOW()
  WHERE id = primary_customer_id;
  RAISE NOTICE 'Merged customer data';
  
  -- Delete duplicates
  DELETE FROM customers WHERE id = ANY(duplicate_customer_ids);
  RAISE NOTICE 'Deleted % duplicate customer(s)', ROW_COUNT;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MERGE COMPLETE!';
  RAISE NOTICE '========================================';
END $$;

-- Uncomment to commit, or run ROLLBACK; if something went wrong
-- COMMIT;

-- ==============================================
-- STEP 5: VERIFY THE MERGE
-- ==============================================
-- Run this after the merge to verify it worked

SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  total_bookings,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = customers.id) as actual_bookings,
  (SELECT COUNT(*) FROM recurring_schedules WHERE customer_id = customers.id) as schedules
FROM customers
WHERE id = 'PASTE_PRIMARY_UUID_HERE'  -- Replace with your primary customer UUID
ORDER BY created_at;

