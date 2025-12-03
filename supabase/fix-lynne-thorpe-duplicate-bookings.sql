-- Fix Duplicate Bookings for Lynne Thorpe
-- Purpose: Remove duplicate bookings for Lynne Thorpe on Monday and Thursday
-- Date: January 2025

BEGIN;

-- ==============================================
-- STEP 1: FIND ALL LYNNE THORPE BOOKINGS
-- ==============================================
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.status,
  b.customer_name,
  b.service_type,
  b.total_amount,
  b.cleaner_id,
  b.recurring_schedule_id,
  b.created_at,
  rs.frequency,
  rs.days_of_week
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN recurring_schedules rs ON b.recurring_schedule_id = rs.id
WHERE LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%')
ORDER BY b.booking_date, b.booking_time, b.created_at;

-- ==============================================
-- STEP 2: IDENTIFY DUPLICATES ON MONDAY (Oct 30, 2025 or Nov 1, 2025)
-- ==============================================
-- Find bookings on Monday that appear to be duplicates
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.status,
  b.customer_name,
  b.service_type,
  b.recurring_schedule_id,
  b.created_at,
  COUNT(*) OVER (PARTITION BY b.booking_date, b.booking_time, b.service_type) as duplicate_count
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND (
    -- Monday Oct 30, 2025
    (b.booking_date = '2025-10-30' AND EXTRACT(DOW FROM b.booking_date) = 1)
    OR
    -- Monday Nov 1, 2025
    (b.booking_date = '2025-11-01' AND EXTRACT(DOW FROM b.booking_date) = 1)
  )
  AND b.booking_time = '09:00:00'
  AND b.service_type = 'Standard'
ORDER BY b.booking_date, b.created_at;

-- ==============================================
-- STEP 3: IDENTIFY DUPLICATES ON THURSDAY (Nov 4, 2025)
-- ==============================================
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.status,
  b.customer_name,
  b.service_type,
  b.recurring_schedule_id,
  b.created_at,
  COUNT(*) OVER (PARTITION BY b.booking_date, b.booking_time, b.service_type) as duplicate_count
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND b.booking_date = '2025-11-04'
  AND EXTRACT(DOW FROM b.booking_date) = 4  -- Thursday
  AND b.booking_time = '09:00:00'
  AND b.service_type = 'Standard'
ORDER BY b.created_at;

-- ==============================================
-- STEP 4: FIND DUPLICATES BY DATE, TIME, AND SCHEDULE/CLEANER
-- ==============================================
-- This will show duplicate bookings (same date, time, service type, AND same schedule/cleaner)
-- NOTE: Lynne Thorpe should have 2 bookings per day (one for each cleaner: Ethel and Nyasha)
-- So we only want to remove duplicates that have the SAME recurring_schedule_id or cleaner_id
SELECT 
  b.booking_date,
  b.booking_time,
  b.service_type,
  b.recurring_schedule_id,
  b.cleaner_id,
  COUNT(*) as booking_count,
  STRING_AGG(b.id::text, ', ' ORDER BY b.created_at) as booking_ids,
  STRING_AGG(b.status, ', ' ORDER BY b.created_at) as statuses,
  STRING_AGG(b.created_at::text, ', ' ORDER BY b.created_at) as created_dates
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
GROUP BY b.booking_date, b.booking_time, b.service_type, b.recurring_schedule_id, b.cleaner_id
HAVING COUNT(*) > 1
ORDER BY b.booking_date, b.booking_time;

-- ==============================================
-- STEP 4.5: CHECK EXPECTED BOOKINGS (2 per day - one per cleaner)
-- ==============================================
-- This shows how many bookings per day and which cleaners they're for
SELECT 
  b.booking_date,
  TO_CHAR(b.booking_date, 'Day') as day_name,
  b.booking_time,
  COUNT(*) as total_bookings,
  COUNT(DISTINCT b.recurring_schedule_id) as distinct_schedules,
  COUNT(DISTINCT b.cleaner_id) as distinct_cleaners,
  STRING_AGG(DISTINCT cl.name, ', ') as cleaner_names,
  STRING_AGG(b.id::text, ', ' ORDER BY b.created_at) as booking_ids
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND b.booking_date IN ('2025-11-01', '2025-11-04')  -- Monday and Thursday
GROUP BY b.booking_date, b.booking_time
ORDER BY b.booking_date, b.booking_time;

-- ==============================================
-- STEP 5: DELETE DUPLICATES (KEEP THE OLDEST/MOST COMPLETE)
-- ==============================================
-- This will keep the first booking (oldest created_at) and delete the rest
-- For each duplicate group, keeps 1 booking and deletes the rest
DO $$
DECLARE
  booking_record RECORD;
  kept_booking_id TEXT;
  deleted_count INTEGER := 0;
  total_deleted INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'REMOVING DUPLICATE BOOKINGS FOR LYNNE THORPE';
  RAISE NOTICE '========================================';
  
  -- Process each group of duplicates
  -- IMPORTANT: Only remove duplicates that have the SAME recurring_schedule_id or cleaner_id
  -- Lynne Thorpe should have 2 bookings per day (one for Ethel, one for Nyasha)
  FOR booking_record IN
    SELECT 
      b.booking_date,
      b.booking_time,
      b.service_type,
      b.recurring_schedule_id,
      b.cleaner_id,
      ARRAY_AGG(b.id ORDER BY b.created_at) as booking_ids,
      COUNT(*) as duplicate_count
    FROM bookings b
    LEFT JOIN customers c ON b.customer_id = c.id
    WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
       OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
    GROUP BY b.booking_date, b.booking_time, b.service_type, b.recurring_schedule_id, b.cleaner_id
    HAVING COUNT(*) > 1
    ORDER BY b.booking_date, b.booking_time
  LOOP
    -- Keep the first (oldest) booking, delete the rest
    -- This ensures we keep 1 booking per schedule/cleaner, but allow 2 different cleaners
    kept_booking_id := booking_record.booking_ids[1];
    
    RAISE NOTICE '';
    RAISE NOTICE 'Found % duplicate(s) for % at % (Service: %, Schedule: %, Cleaner: %)', 
      booking_record.duplicate_count,
      booking_record.booking_date, 
      booking_record.booking_time,
      booking_record.service_type,
      booking_record.recurring_schedule_id,
      booking_record.cleaner_id;
    RAISE NOTICE '  Keeping booking ID: % (oldest)', kept_booking_id;
    RAISE NOTICE '  Will delete % booking(s)', booking_record.duplicate_count - 1;
    
    -- Delete all except the first one (same schedule/cleaner)
    DELETE FROM bookings
    WHERE id = ANY(booking_record.booking_ids[2:array_length(booking_record.booking_ids, 1)])
      AND booking_date = booking_record.booking_date
      AND booking_time = booking_record.booking_time
      AND service_type = booking_record.service_type
      AND (booking_record.recurring_schedule_id IS NULL OR recurring_schedule_id = booking_record.recurring_schedule_id)
      AND (booking_record.cleaner_id IS NULL OR cleaner_id = booking_record.cleaner_id);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE '  ✅ Deleted % duplicate booking(s)', deleted_count;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ DUPLICATE REMOVAL COMPLETE!';
  RAISE NOTICE 'Total duplicates removed: %', total_deleted;
  RAISE NOTICE '========================================';
END $$;

-- ==============================================
-- STEP 6: CHECK IF BOOKINGS NEED TO BE RESTORED
-- ==============================================
-- Lynne Thorpe should have 2 bookings per Monday/Thursday (one per cleaner)
-- If Monday only has 1, we need to check which cleaner is missing
SELECT 
  b.booking_date,
  TO_CHAR(b.booking_date, 'Day') as day_name,
  b.booking_time,
  COUNT(*) as booking_count,
  COUNT(DISTINCT b.recurring_schedule_id) as distinct_schedules,
  COUNT(DISTINCT b.cleaner_id) as distinct_cleaners,
  STRING_AGG(DISTINCT cl.name, ', ') as cleaner_names,
  STRING_AGG(b.id::text, ', ' ORDER BY b.created_at) as booking_ids
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND b.booking_date IN ('2025-11-01', '2025-11-04')  -- Monday and Thursday
  AND b.booking_time = '09:00:00'
GROUP BY b.booking_date, b.booking_time
ORDER BY b.booking_date;

-- ==============================================
-- STEP 7: RESTORE MISSING BOOKINGS IF NEEDED
-- ==============================================
-- If Monday only has 1 booking, restore the missing one from the recurring schedule
DO $$
DECLARE
  monday_date DATE := '2025-11-01';
  thursday_date DATE := '2025-11-04';
  monday_count INTEGER;
  thursday_count INTEGER;
  ethel_schedule_id UUID;
  nyasha_schedule_id UUID;
  customer_record RECORD;
BEGIN
  -- Get customer and schedule IDs
  SELECT id INTO customer_record
  FROM customers
  WHERE email = 'lynthorpe@gmail.com'
  LIMIT 1;
  
  IF customer_record IS NULL THEN
    RAISE NOTICE 'Lynne Thorpe customer not found';
    RETURN;
  END IF;
  
  -- Get Ethel's schedule
  SELECT rs.id INTO ethel_schedule_id
  FROM recurring_schedules rs
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE rs.customer_id = customer_record.id
    AND cl.name = 'Ethel Chizombe'
    AND rs.is_active = true
  LIMIT 1;
  
  -- Get Nyasha's schedule
  SELECT rs.id INTO nyasha_schedule_id
  FROM recurring_schedules rs
  INNER JOIN cleaners cl ON rs.cleaner_id = cl.id
  WHERE rs.customer_id = customer_record.id
    AND cl.name = 'Nyasha Mudani'
    AND rs.is_active = true
  LIMIT 1;
  
  -- Check Monday bookings
  SELECT COUNT(*) INTO monday_count
  FROM bookings b
  WHERE b.customer_id = customer_record.id
    AND b.booking_date = monday_date
    AND b.booking_time = '09:00:00';
  
  -- Check Thursday bookings
  SELECT COUNT(*) INTO thursday_count
  FROM bookings b
  WHERE b.customer_id = customer_record.id
    AND b.booking_date = thursday_date
    AND b.booking_time = '09:00:00';
  
  RAISE NOTICE 'Monday bookings: %, Thursday bookings: %', monday_count, thursday_count;
  RAISE NOTICE 'Ethel schedule: %, Nyasha schedule: %', ethel_schedule_id, nyasha_schedule_id;
  
  -- If Monday has less than 2, check which cleaner is missing and restore
  IF monday_count < 2 AND (ethel_schedule_id IS NOT NULL OR nyasha_schedule_id IS NOT NULL) THEN
    RAISE NOTICE 'Monday needs restoration. Checking which cleaner is missing...';
    -- The fix-lynne-thorpe-bookings.sql script should be used to regenerate all bookings
    RAISE NOTICE 'Consider running fix-lynne-thorpe-bookings.sql to regenerate all bookings correctly';
  END IF;
END $$;

-- ==============================================
-- STEP 8: VERIFICATION - Final booking count per day
-- ==============================================
SELECT 
  b.booking_date,
  TO_CHAR(b.booking_date, 'Day') as day_name,
  COUNT(*) as total_bookings,
  COUNT(DISTINCT b.recurring_schedule_id) as distinct_schedules,
  COUNT(DISTINCT b.cleaner_id) as distinct_cleaners,
  STRING_AGG(DISTINCT cl.name, ', ') as cleaner_names
FROM bookings b
LEFT JOIN customers c ON b.customer_id = c.id
LEFT JOIN cleaners cl ON b.cleaner_id::uuid = cl.id
WHERE (LOWER(b.customer_name) LIKE '%lynne%thorpe%'
   OR (c.first_name ILIKE '%lynne%' AND c.last_name ILIKE '%thorpe%'))
  AND b.booking_date >= '2025-11-01'
  AND b.booking_date <= '2025-11-07'
GROUP BY b.booking_date
ORDER BY b.booking_date;

COMMIT;

-- ==============================================
-- ROLLBACK INSTRUCTIONS
-- ==============================================
-- If something goes wrong, run:
-- ROLLBACK;

