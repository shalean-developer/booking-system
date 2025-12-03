-- Find and Merge Duplicate Customers
-- Purpose: Find duplicate customers and merge them
-- This script helps you identify duplicates first, then merge them
-- Date: January 2025

-- ==============================================
-- STEP 1: SEARCH FOR CUSTOMERS (CUSTOMIZE THIS SEARCH)
-- ==============================================
-- Modify the search term below to find your customer
-- Examples:
--   '%fatima%' - finds Fatima, Fatimah, etc.
--   '%john%' - finds John, Johnny, etc.
--   'john@example.com' - finds by exact email

-- Search by name or email
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
  updated_at,
  -- Count related records
  (SELECT COUNT(*) FROM bookings WHERE customer_id = customers.id) as booking_count,
  (SELECT COUNT(*) FROM recurring_schedules WHERE customer_id = customers.id) as schedule_count
FROM customers
WHERE LOWER(first_name) LIKE '%fatima%'
   OR LOWER(last_name) LIKE '%fatima%'
   OR LOWER(email) LIKE '%fatima%'
   OR LOWER(first_name || ' ' || last_name) LIKE '%fatima%'
ORDER BY created_at;

-- ==============================================
-- STEP 2: FIND DUPLICATES BY EMAIL
-- ==============================================
-- This finds customers with the same email
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

-- ==============================================
-- STEP 3: FIND DUPLICATES BY NAME
-- ==============================================
-- This finds customers with the same first and last name
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
-- STEP 4: MANUAL MERGE (RUN THIS AFTER IDENTIFYING DUPLICATES)
-- ==============================================
-- Replace the UUIDs below with the actual customer IDs you want to merge
-- PRIMARY_ID = the customer you want to keep
-- DUPLICATE_IDS = array of customer IDs to merge into the primary

DO $$
DECLARE
  -- SET THESE VALUES BASED ON STEP 1 RESULTS:
  primary_customer_id UUID := 'REPLACE_WITH_PRIMARY_CUSTOMER_ID';
  duplicate_customer_ids UUID[] := ARRAY[
    'REPLACE_WITH_DUPLICATE_ID_1'::UUID,
    'REPLACE_WITH_DUPLICATE_ID_2'::UUID
    -- Add more duplicate IDs here if needed
  ];
  customer_record RECORD;
  bookings_updated INTEGER := 0;
  schedules_updated INTEGER := 0;
  customers_deleted INTEGER := 0;
BEGIN
  -- Validate primary customer exists
  IF NOT EXISTS (SELECT 1 FROM customers WHERE id = primary_customer_id) THEN
    RAISE EXCEPTION 'Primary customer ID % does not exist', primary_customer_id;
  END IF;

  -- Validate duplicate customers exist
  FOR customer_record IN 
    SELECT id, first_name, last_name, email 
    FROM customers 
    WHERE id = ANY(duplicate_customer_ids)
  LOOP
    RAISE NOTICE 'Found duplicate: % % (Email: %, ID: %)', 
      customer_record.first_name, 
      customer_record.last_name, 
      customer_record.email, 
      customer_record.id;
  END LOOP;

  -- Check if primary is in duplicates list (shouldn't be)
  IF primary_customer_id = ANY(duplicate_customer_ids) THEN
    RAISE EXCEPTION 'Primary customer ID cannot be in the duplicates list';
  END IF;

  RAISE NOTICE 'Primary customer ID: %', primary_customer_id;
  RAISE NOTICE 'Merging % duplicate customer(s)', array_length(duplicate_customer_ids, 1);

  -- ==============================================
  -- UPDATE BOOKINGS TO POINT TO PRIMARY CUSTOMER
  -- ==============================================
  UPDATE bookings
  SET customer_id = primary_customer_id,
      updated_at = NOW()
  WHERE customer_id = ANY(duplicate_customer_ids);
  
  GET DIAGNOSTICS bookings_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % booking(s)', bookings_updated;

  -- ==============================================
  -- UPDATE RECURRING SCHEDULES TO POINT TO PRIMARY CUSTOMER
  -- ==============================================
  UPDATE recurring_schedules
  SET customer_id = primary_customer_id,
      updated_at = NOW()
  WHERE customer_id = ANY(duplicate_customer_ids);
  
  GET DIAGNOSTICS schedules_updated = ROW_COUNT;
  RAISE NOTICE 'Updated % recurring schedule(s)', schedules_updated;

  -- ==============================================
  -- MERGE CUSTOMER DATA (FILL IN MISSING INFO)
  -- ==============================================
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
  -- DELETE DUPLICATE CUSTOMERS
  -- ==============================================
  DELETE FROM customers
  WHERE id = ANY(duplicate_customer_ids);
  
  GET DIAGNOSTICS customers_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % duplicate customer(s)', customers_deleted;

  RAISE NOTICE '✅ Merge complete!';
  RAISE NOTICE '   - Primary customer ID: %', primary_customer_id;
  RAISE NOTICE '   - Bookings updated: %', bookings_updated;
  RAISE NOTICE '   - Schedules updated: %', schedules_updated;
  RAISE NOTICE '   - Customers deleted: %', customers_deleted;
END $$;

-- ==============================================
-- STEP 5: VERIFICATION - Check final state
-- ==============================================
-- After running the merge, verify the results:
SELECT 
  id,
  first_name,
  last_name,
  email,
  phone,
  total_bookings,
  created_at,
  (SELECT COUNT(*) FROM bookings WHERE customer_id = customers.id) as actual_booking_count,
  (SELECT COUNT(*) FROM recurring_schedules WHERE customer_id = customers.id) as schedule_count
FROM customers
WHERE (LOWER(first_name) LIKE '%fatima%' 
       OR LOWER(last_name) LIKE '%fatima%' 
       OR LOWER(email) LIKE '%fatima%'
       OR LOWER(first_name || ' ' || last_name) LIKE '%fatima%')
ORDER BY created_at;

-- ==============================================
-- INSTRUCTIONS:
-- ==============================================
-- 1. Run STEP 1 to find all customers matching your search
-- 2. Review the results and identify which are duplicates
-- 3. Note the customer IDs (UUIDs) from the results
-- 4. In STEP 4, replace:
--    - primary_customer_id with the UUID you want to KEEP
--    - duplicate_customer_ids array with UUIDs you want to MERGE
-- 5. Run STEP 4 to perform the merge
-- 6. Run STEP 5 to verify the merge worked
--
-- IMPORTANT: The script is wrapped in a transaction, so you can
-- rollback if something goes wrong by running: ROLLBACK;

