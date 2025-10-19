# Database Fix: Unique Constraint on Phone Column

## Issue
You encountered this error:
```
ERROR: 42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

## Cause
The `ON CONFLICT (phone)` clause in the test data script requires a unique constraint on the `phone` column, but the original `cleaners` table didn't have one.

## Solution ✅

The migration and test files have been updated to:

1. **Add unique constraint** on the `phone` column
2. **Remove `ON CONFLICT` clauses** and instead delete existing test data first

## How to Apply the Fix

### Step 1: Apply the Updated Migration
Run this in Supabase SQL Editor:

```sql
-- File: supabase/migrations/cleaners-auth.sql
-- This will add the unique constraint (idempotent - safe to run multiple times)
```

Just copy and paste the entire contents of `supabase/migrations/cleaners-auth.sql` into the Supabase SQL Editor and execute it.

### Step 2: Create Test Cleaners
Run this in Supabase SQL Editor:

```sql
-- File: supabase/test-cleaner-setup.sql
-- This will delete any existing test cleaners and create new ones
```

Copy and paste the entire contents of `supabase/test-cleaner-setup.sql` and execute it.

## What Changed

### Migration File (`cleaners-auth.sql`)
**Added:**
```sql
-- Add unique constraint on phone for authentication (if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cleaners_phone_unique'
  ) THEN
    ALTER TABLE cleaners ADD CONSTRAINT cleaners_phone_unique UNIQUE (phone);
  END IF;
END $$;
```

### Test Data File (`test-cleaner-setup.sql`)
**Changed from:**
```sql
INSERT INTO cleaners (...) VALUES (...)
ON CONFLICT (phone) DO NOTHING;
```

**To:**
```sql
-- Clean up any existing test cleaners first
DELETE FROM cleaners WHERE phone IN ('+27123456789', '+27987654321', '+27555123456');

INSERT INTO cleaners (...) VALUES (...);
```

## Verify the Fix

After running both scripts, verify with:

```sql
-- Check that the unique constraint exists
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'cleaners'::regclass 
  AND conname = 'cleaners_phone_unique';

-- Verify test cleaners were created
SELECT 
  id,
  name,
  phone,
  auth_provider,
  is_active,
  is_available
FROM cleaners
WHERE phone IN ('+27123456789', '+27987654321', '+27555123456')
ORDER BY name;
```

You should see:
1. One constraint named `cleaners_phone_unique` of type `u` (unique)
2. Three test cleaners: John Doe, Jane Smith, and Mike Johnson

## Test Login Credentials

After the fix, you can login with:

**Test Cleaner 1: John Doe**
- Phone: `+27123456789` or `0123456789`
- Password: `test123`
- Auth: Both password and OTP

**Test Cleaner 2: Jane Smith**
- Phone: `+27987654321` or `0987654321`
- Password: `test456`
- Auth: Both password and OTP

**Test Cleaner 3: Mike Johnson**
- Phone: `+27555123456` or `0555123456`
- Password: N/A (OTP only)
- Auth: OTP only

## Why This Fix Works

1. **Unique Constraint**: The `phone` column now has a unique constraint, ensuring no duplicate phone numbers
2. **Idempotent**: The migration checks if the constraint exists before adding it, so it's safe to run multiple times
3. **Clean Data**: The test script deletes existing test cleaners before inserting new ones, avoiding conflicts

## If You Still Have Issues

### If constraint addition fails (duplicate phones exist):
```sql
-- Find duplicate phone numbers
SELECT phone, COUNT(*) 
FROM cleaners 
WHERE phone IS NOT NULL
GROUP BY phone 
HAVING COUNT(*) > 1;

-- Remove duplicates manually, then re-run the migration
```

### If test data insertion fails:
```sql
-- Manually delete all test cleaners
DELETE FROM cleaners WHERE phone IN ('+27123456789', '+27987654321', '+27555123456');

-- Then re-run the test-cleaner-setup.sql
```

## Next Steps

1. ✅ Run the updated migration
2. ✅ Create test cleaners
3. ✅ Navigate to `/cleaner/login`
4. ✅ Login with test credentials
5. ✅ Start testing the dashboard!

---

**Status: Fixed ✅**  
The database schema is now correct and ready for use!

