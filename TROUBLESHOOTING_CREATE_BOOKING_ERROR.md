# Troubleshooting: "Failed to create booking" Error

## Issue
When trying to create a booking (one-time or recurring) from the admin dashboard, you receive the error: **"Failed to create booking"**

## Root Cause
The database migration has not been applied yet. The `recurring_schedules` table and the `recurring_schedule_id` column in the `bookings` table don't exist in your database.

## Solution: Apply the Database Migration

### Step-by-Step Instructions

#### Option 1: Supabase Dashboard SQL Editor (Recommended)

1. **Go to your Supabase Dashboard**
   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste the Migration**
   - Open the file: `APPLY_THIS_MIGRATION.sql`
   - Copy ALL the contents
   - Paste into the SQL Editor

4. **Run the Migration**
   - Click "Run" or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - Wait for execution to complete

5. **Verify Success**
   - Scroll down to the "Verification Queries" section
   - The results should show:
     - `table_exists`: `true`
     - `column_exists`: `true`
     - Multiple indexes listed

#### Option 2: Direct Database Connection

If you have direct access to your PostgreSQL database:

```bash
psql -h your-db-host -U postgres -d your-database -f APPLY_THIS_MIGRATION.sql
```

#### Option 3: Supabase CLI (If Docker is Running)

```bash
npx supabase db push
```

Note: This requires Docker to be running and Supabase CLI to be properly configured.

## What the Migration Does

The migration creates:

1. **`recurring_schedules` table** - Stores recurring booking schedules
   - Customer information
   - Frequency settings (weekly, bi-weekly, monthly)
   - Service details
   - Date/time preferences
   - Active/inactive status
   - Generation tracking

2. **Indexes** - For optimal performance:
   - Customer ID lookup
   - Active schedules filtering
   - Frequency filtering
   - Last generation tracking

3. **`recurring_schedule_id` column** in `bookings` table
   - Links regular bookings to their recurring schedule
   - Allows tracking which bookings were auto-generated

4. **Triggers** - Automatically update timestamps

## Verification

After applying the migration, test by:

1. **Go to Admin Dashboard → Bookings**
2. **Click "Create Booking"**
3. **Fill in the form**:
   - Select a customer
   - Choose service type
   - Fill in details
   - Select date/time (for one-time)
4. **Click "Create Booking"**

If successful, you'll see a success message and the booking will appear in the bookings list.

## Enhanced Error Messages

The system now provides detailed error messages. If you encounter an error after applying the migration, the error message will include:
- **Error type**: What went wrong
- **Details**: Specific database error message

Common errors after migration:
- **"Customer not found"**: Select a valid customer from the list
- **"Invalid date"**: Ensure date is in the future
- **"Missing required fields"**: Fill in all required fields (marked with *)

## Still Having Issues?

If you're still experiencing errors after applying the migration:

1. **Check the browser console** (F12 → Console tab) for detailed error messages
2. **Verify the migration** ran successfully by running the verification queries
3. **Check Supabase logs** in your dashboard under "Logs"
4. **Ensure you have admin access** - Only admin users can create bookings

## Additional Resources

- Database migration file: `supabase/migrations/create-recurring-schedules.sql`
- Quick apply file: `APPLY_THIS_MIGRATION.sql`
- Implementation guide: `RECURRING_BOOKINGS_IMPLEMENTATION_COMPLETE.md`

## Support

The recurring bookings system is now fully implemented and ready to use once the migration is applied. The system includes:
- ✅ One-time booking creation
- ✅ Recurring schedule setup (weekly, bi-weekly, monthly)
- ✅ Automatic booking generation
- ✅ Schedule management (edit, pause, resume, delete)
- ✅ Conflict detection
- ✅ Full admin dashboard integration

Happy booking! 🎉
