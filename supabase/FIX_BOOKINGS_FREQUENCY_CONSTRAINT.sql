-- Fix: Bookings Frequency Constraint Issue
-- This script handles existing data and updates the constraint

-- Step 1: Check what frequencies exist in the bookings table
SELECT DISTINCT frequency, COUNT(*) as count
FROM bookings 
WHERE frequency IS NOT NULL
GROUP BY frequency
ORDER BY frequency;

-- Step 2: Check if there's invalid data
SELECT id, frequency, booking_date, customer_name
FROM bookings 
WHERE frequency NOT IN ('weekly', 'bi-weekly', 'monthly')
ORDER BY created_at DESC
LIMIT 10;

-- Step 3: Drop the existing constraint (it might have a different name)
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    -- Find all check constraints on bookings table related to frequency
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'bookings'::regclass 
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%frequency%'
    LOOP
        EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT IF EXISTS %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 4: Add the new constraint with custom frequencies
ALTER TABLE bookings
ADD CONSTRAINT bookings_frequency_check 
CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly'));

-- Step 5: Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'bookings'::regclass 
AND contype = 'c'
AND conname = 'bookings_frequency_check';

