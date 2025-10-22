# Apply Custom Recurring Frequency Migration

## Quick Start

### Step 1: Apply Database Migration

**File**: `supabase/migrations/add-custom-recurring-frequency.sql`

#### Option A: Supabase Dashboard (Recommended)

1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in left sidebar
4. Click **"New Query"**
5. Open `supabase/migrations/add-custom-recurring-frequency.sql`
6. Copy all contents
7. Paste into SQL Editor
8. Click **"Run"** (or press Ctrl+Enter)
9. Wait for "Success" message

#### Option B: Supabase CLI

```bash
# If you have Supabase CLI installed
npx supabase db push
```

#### Option C: Direct PostgreSQL Access

```bash
psql <your-connection-string> -f supabase/migrations/add-custom-recurring-frequency.sql
```

### Step 2: Verify Migration

Run this query in SQL Editor:

```sql
-- Check column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recurring_schedules' 
AND column_name = 'days_of_week';

-- Expected result: days_of_week | ARRAY
```

```sql
-- Check constraints were created
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'recurring_schedules'
AND constraint_name LIKE '%custom%';

-- Expected: Two CHECK constraints
```

### Step 3: Test the Feature

1. **Create Custom Weekly Schedule**:
   - Admin Dashboard → Bookings → Create Booking
   - Select "Recurring Schedule"
   - Frequency: "Custom Weekly"
   - Check days: Monday, Wednesday, Friday
   - Fill in other details
   - Submit

2. **Verify Schedule Created**:
   ```sql
   SELECT id, frequency, days_of_week, day_of_week 
   FROM recurring_schedules 
   WHERE frequency IN ('custom-weekly', 'custom-bi-weekly')
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

3. **Generate Bookings**:
   - Go to Recurring Schedules tab
   - Find your custom schedule
   - Click "Generate Bookings"
   - Select current/next month
   - Generate

4. **Verify Bookings**:
   ```sql
   SELECT booking_date, booking_time, customer_name
   FROM bookings
   WHERE recurring_schedule_id = '<your-schedule-id>'
   ORDER BY booking_date;
   
   -- Should see bookings for Mon, Wed, Fri
   ```

5. **Check Cleaner Dashboard**:
   - Assign cleaner to generated bookings
   - Login as that cleaner
   - View bookings
   - Should see "Custom Weekly" badge
   - Open details → Should show "Repeats on: Monday, Wednesday, Friday"

## Migration Details

### What the Migration Does

1. **Adds Column**: `days_of_week INTEGER[]` to store multiple days
2. **Updates Constraint**: Allows 'custom-weekly' and 'custom-bi-weekly' frequencies
3. **Adds Validation**: Ensures `days_of_week` used correctly with custom frequencies
4. **Creates Index**: For performance on custom frequency queries
5. **Adds Comment**: Documents the column purpose

### Migration SQL

```sql
-- Add days_of_week array column
ALTER TABLE recurring_schedules 
ADD COLUMN IF NOT EXISTS days_of_week INTEGER[];

-- Update frequency constraint
ALTER TABLE recurring_schedules 
DROP CONSTRAINT IF EXISTS recurring_schedules_frequency_check;

ALTER TABLE recurring_schedules
ADD CONSTRAINT recurring_schedules_frequency_check 
CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly'));

-- Ensure days_of_week is used appropriately
ALTER TABLE recurring_schedules
ADD CONSTRAINT recurring_schedules_custom_days_check 
CHECK (
  (frequency IN ('custom-weekly', 'custom-bi-weekly') AND days_of_week IS NOT NULL AND array_length(days_of_week, 1) > 0)
  OR
  (frequency NOT IN ('custom-weekly', 'custom-bi-weekly') AND days_of_week IS NULL)
);

-- Add index for custom frequencies
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_custom_frequency 
ON recurring_schedules(frequency) 
WHERE frequency IN ('custom-weekly', 'custom-bi-weekly');

-- Add comment
COMMENT ON COLUMN recurring_schedules.days_of_week IS 'Array of day numbers (0=Sunday, 1=Monday, etc.) for custom frequencies';
```

## Troubleshooting

### Error: Constraint Violation

**Issue**: Existing schedules violate new constraint

**Solution**: This shouldn't happen as existing schedules have NULL `days_of_week`, but if it does:

```sql
-- Check for problematic records
SELECT id, frequency, days_of_week, day_of_week 
FROM recurring_schedules
WHERE (
  (frequency IN ('custom-weekly', 'custom-bi-weekly') AND (days_of_week IS NULL OR array_length(days_of_week, 1) = 0))
  OR
  (frequency NOT IN ('custom-weekly', 'custom-bi-weekly') AND days_of_week IS NOT NULL)
);

-- Fix if any found (run migration again after fixing)
```

### Error: Column Already Exists

**Issue**: Migration run twice

**Solution**: Safe to ignore, or verify column is correct:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'recurring_schedules' 
AND column_name = 'days_of_week';
```

### Error: Permission Denied

**Issue**: Insufficient database permissions

**Solution**: 
- Use Supabase Dashboard (Option A) which runs as service role
- Or ensure your database user has ALTER TABLE privileges

## Rollback (If Needed)

```sql
-- Remove custom frequency support (not recommended after use)
ALTER TABLE recurring_schedules
DROP CONSTRAINT IF EXISTS recurring_schedules_custom_days_check;

ALTER TABLE recurring_schedules 
DROP CONSTRAINT IF EXISTS recurring_schedules_frequency_check;

ALTER TABLE recurring_schedules
ADD CONSTRAINT recurring_schedules_frequency_check 
CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly'));

ALTER TABLE recurring_schedules
DROP COLUMN IF EXISTS days_of_week;

DROP INDEX IF EXISTS idx_recurring_schedules_custom_frequency;

-- Note: This will delete any custom frequency schedules!
```

## Post-Migration Checks

### 1. Check Existing Schedules Still Work

```sql
-- Verify old schedules unaffected
SELECT id, frequency, day_of_week, day_of_month, days_of_week
FROM recurring_schedules
WHERE frequency IN ('weekly', 'bi-weekly', 'monthly')
LIMIT 10;

-- All should have days_of_week = NULL
```

### 2. Test Creating Each Frequency Type

- Weekly (existing) ✓
- Bi-weekly (existing) ✓
- Monthly (existing) ✓
- Custom Weekly (new) ✓
- Custom Bi-weekly (new) ✓

### 3. Test Booking Generation

Generate bookings for each type and verify dates are correct.

### 4. Test Edit Functionality

Edit a custom schedule and verify days_of_week saves correctly.

## Data Validation Queries

```sql
-- Count schedules by frequency type
SELECT frequency, COUNT(*) as count
FROM recurring_schedules
GROUP BY frequency
ORDER BY frequency;

-- Show custom schedules with their days
SELECT 
  id,
  frequency,
  days_of_week,
  preferred_time,
  CASE 
    WHEN days_of_week IS NOT NULL THEN 
      array_to_string(ARRAY(
        SELECT CASE day
          WHEN 0 THEN 'Sun'
          WHEN 1 THEN 'Mon'
          WHEN 2 THEN 'Tue'
          WHEN 3 THEN 'Wed'
          WHEN 4 THEN 'Thu'
          WHEN 5 THEN 'Fri'
          WHEN 6 THEN 'Sat'
        END
        FROM unnest(days_of_week) as day
      ), ', ')
    ELSE 'N/A'
  END as days_display
FROM recurring_schedules
WHERE frequency IN ('custom-weekly', 'custom-bi-weekly')
ORDER BY created_at DESC;
```

## Success Indicators

✅ Migration runs without errors
✅ Column `days_of_week` exists in database
✅ Constraints created successfully
✅ Can create custom weekly schedule
✅ Can create custom bi-weekly schedule
✅ Bookings generate correctly for custom schedules
✅ Custom schedules display correctly in admin dashboard
✅ Cleaners see custom frequency badges
✅ Existing schedules continue to work

## Next Steps After Migration

1. Train admin users on custom frequency feature
2. Create first test custom schedule
3. Monitor booking generation
4. Collect user feedback
5. Document any business-specific use cases

---

**Status**: Migration is additive and safe. No data loss. Backward compatible.

**Time Required**: ~2 minutes

**Risk Level**: Low (no existing data affected)

