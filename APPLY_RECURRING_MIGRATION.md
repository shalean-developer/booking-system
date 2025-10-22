# Apply Recurring Bookings Migration

## Important: Database Migration Required

For recurring bookings to be displayed in the cleaner dashboard, the database migration MUST be applied.

## Migration File Location
```
supabase/migrations/create-recurring-schedules.sql
```

## What This Migration Creates

1. **`recurring_schedules` table** - Stores recurring booking schedules
2. **Foreign key column** - Adds `recurring_schedule_id` to `bookings` table
3. **Indexes** - Performance optimization indexes
4. **RLS Policies** - Row-level security policies
5. **Triggers** - Auto-update timestamps

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Click **"New Query"**
4. Open the file `supabase/migrations/create-recurring-schedules.sql`
5. Copy ALL the contents
6. Paste into the SQL Editor
7. Click **"Run"** or press `Ctrl+Enter`
8. Wait for "Success" message

### Option 2: Supabase CLI (If Available)

```bash
# If you have Supabase CLI and Docker installed
npx supabase db push
```

### Option 3: Direct Database Access

If you have direct PostgreSQL access:
```bash
psql <your-connection-string> -f supabase/migrations/create-recurring-schedules.sql
```

## Verification

After applying the migration, verify it worked:

### Check Tables Exist
```sql
-- Check recurring_schedules table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'recurring_schedules'
);
```

### Check Column Added
```sql
-- Check bookings has recurring_schedule_id column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name = 'recurring_schedule_id';
```

### Check Indexes
```sql
-- List indexes on recurring_schedules
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'recurring_schedules';
```

## Expected Results

After successful migration:
- ✅ `recurring_schedules` table exists
- ✅ `bookings.recurring_schedule_id` column exists
- ✅ Foreign key constraint in place
- ✅ RLS policies active
- ✅ Indexes created

## Troubleshooting

### Error: Table Already Exists
```
If you see "table already exists" error:
- Migration was already applied
- You're good to go!
- Skip this step
```

### Error: Permission Denied
```
If you see permission errors:
- Ensure you're logged in as database owner
- Check you have CREATE TABLE privileges
- Try using Supabase Dashboard (Option 1)
```

### Error: Foreign Key Violation
```
If foreign key errors occur:
- Ensure the customers table exists
- Ensure the cleaners table exists
- Check existing bookings data integrity
```

## Test After Migration

1. **Admin Dashboard**:
   - Go to Admin Dashboard
   - Navigate to "Recurring" tab
   - Should see empty table (no errors)

2. **Create Test Recurring Schedule**:
   - Click "Create Booking"
   - Select "Recurring Schedule"
   - Fill in details and submit
   - Should create successfully

3. **Cleaner Dashboard**:
   - Generate bookings from recurring schedule
   - Assign cleaner to bookings
   - Log in as cleaner
   - Bookings should show with recurring badge

## Status Check

Run this query to see all recurring schedules:
```sql
SELECT 
  rs.id,
  rs.frequency,
  rs.is_active,
  c.first_name || ' ' || c.last_name as customer_name,
  COUNT(b.id) as bookings_generated
FROM recurring_schedules rs
JOIN customers c ON c.id = rs.customer_id
LEFT JOIN bookings b ON b.recurring_schedule_id = rs.id
GROUP BY rs.id, c.first_name, c.last_name;
```

## Need Help?

If migration fails:
1. Check Supabase logs
2. Verify database connection
3. Ensure you have admin privileges
4. Try using SQL Editor in Supabase Dashboard
5. Contact Supabase support if issues persist

## Next Steps After Migration

1. ✅ Migration applied
2. ✅ Create test recurring schedule (Admin Dashboard)
3. ✅ Generate bookings from schedule
4. ✅ Assign cleaner to generated bookings
5. ✅ View recurring bookings in cleaner dashboard
6. ✅ Verify badges and details display correctly

---

**Remember**: The migration only needs to be applied once!

