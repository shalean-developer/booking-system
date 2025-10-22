# Quick Fix: Bookings Frequency Constraint Error

## Error
```
ERROR: 23514: check constraint "bookings_frequency_check" of relation "bookings" is violated by some row
```

## Problem
The `bookings` table has existing rows with frequency values that don't match the constraint, or the constraint exists with a different name.

## Solution: Run This in Supabase SQL Editor

### Option 1: Simple Fix (Try This First)

```sql
-- Step 1: Find and drop all frequency constraints
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

-- Step 2: Add new constraint with custom frequencies
ALTER TABLE bookings
ADD CONSTRAINT bookings_frequency_check 
CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly'));
```

### Option 2: If Option 1 Fails - Check Data First

```sql
-- Check what frequency values exist
SELECT DISTINCT frequency, COUNT(*) as count
FROM bookings 
WHERE frequency IS NOT NULL
GROUP BY frequency
ORDER BY frequency;
```

**If you see any invalid frequencies (not in the list above):**

```sql
-- Delete bookings with invalid frequencies (if they're test data)
DELETE FROM bookings 
WHERE frequency NOT IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly')
AND frequency IS NOT NULL;

-- Or update them to a valid value
UPDATE bookings 
SET frequency = 'weekly' 
WHERE frequency NOT IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly')
AND frequency IS NOT NULL;
```

**Then run Option 1 again.**

### Option 3: Complete Reset (If all else fails)

```sql
-- 1. Drop ALL constraints on bookings frequency
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'bookings'::regclass 
        AND contype = 'c'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT %I', r.conname);
            RAISE NOTICE 'Dropped: %', r.conname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not drop %: %', r.conname, SQLERRM;
        END;
    END LOOP;
END $$;

-- 2. Add back the frequency constraint
ALTER TABLE bookings
ADD CONSTRAINT bookings_frequency_check 
CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly'));
```

## Verification

After running the fix, verify it worked:

```sql
-- Check the constraint exists
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'bookings'::regclass 
AND conname = 'bookings_frequency_check';

-- Should return:
-- bookings_frequency_check | CHECK ((frequency = ANY (ARRAY['weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly'])))
```

## Then Run the Full Migration

After fixing the constraint, run the complete updated migration:

**File**: `supabase/migrations/add-custom-recurring-frequency.sql`

The migration has been updated to handle this issue automatically in the future.

## Root Cause

The issue occurred because:
1. The `bookings` table had an old frequency constraint
2. Previous test attempts may have created bookings with invalid frequencies
3. The constraint name might be different than expected

## Prevention

The updated migration now:
- Searches for ALL frequency-related constraints
- Drops them dynamically by name
- Adds the new constraint with custom frequencies included

This ensures a clean migration regardless of the current state.

---

**Quick Action**: Copy Option 1 SQL above → Paste in Supabase SQL Editor → Run → Done! ✅

