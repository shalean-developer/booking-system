-- Complete Fix: Handle Invalid Frequency Data and Update Constraint
-- Run this entire script in Supabase SQL Editor

-- ============================================
-- STEP 1: Check what frequency values exist
-- ============================================
SELECT 'Current frequency values in bookings table:' as info;
SELECT DISTINCT frequency, COUNT(*) as count
FROM bookings 
WHERE frequency IS NOT NULL
GROUP BY frequency
ORDER BY frequency;

-- ============================================
-- STEP 2: Find problematic rows
-- ============================================
SELECT 'Bookings with invalid frequencies:' as info;
SELECT id, frequency, booking_date, customer_name, created_at
FROM bookings 
WHERE frequency IS NOT NULL 
  AND frequency NOT IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly')
ORDER BY created_at DESC;

-- ============================================
-- STEP 3: Fix invalid data (CHOOSE ONE OPTION)
-- ============================================

-- OPTION A: Delete bookings with invalid frequencies (if they're test data)
-- Uncomment the line below if you want to DELETE invalid bookings:
-- DELETE FROM bookings WHERE frequency IS NOT NULL AND frequency NOT IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly');

-- OPTION B: Set invalid frequencies to NULL (keeps the bookings)
-- Uncomment the line below if you want to keep the bookings but remove invalid frequency:
-- UPDATE bookings SET frequency = NULL WHERE frequency IS NOT NULL AND frequency NOT IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly');

-- OPTION C: Convert invalid frequencies to 'weekly' (if they should be weekly)
-- Uncomment the line below if you want to convert them:
-- UPDATE bookings SET frequency = 'weekly' WHERE frequency IS NOT NULL AND frequency NOT IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly');

-- ============================================
-- STEP 4: Drop existing frequency constraints
-- ============================================
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'bookings'::regclass 
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%frequency%'
    LOOP
        EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- ============================================
-- STEP 5: Add new constraint with custom frequencies
-- ============================================
ALTER TABLE bookings
ADD CONSTRAINT bookings_frequency_check 
CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly'));

-- ============================================
-- STEP 6: Verify the fix
-- ============================================
SELECT 'Verification - New constraint:' as info;
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'bookings'::regclass 
AND conname = 'bookings_frequency_check';

SELECT 'All bookings frequency values (should all be valid now):' as info;
SELECT DISTINCT frequency, COUNT(*) as count
FROM bookings 
WHERE frequency IS NOT NULL
GROUP BY frequency
ORDER BY frequency;

