# Fix "Could not find the 'notes' column" Error

## Problem
When updating a booking, you get the error:
```
Failed to update booking: Could not find the 'notes' column of 'bookings' in the schema cache
```

## Solution

### Step 1: Run the Database Migration

The `notes` column needs to be added to the `bookings` table. Run this SQL in your Supabase SQL Editor:

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your project
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the Migration**
   - Open the file: `supabase/migrations/add-notes-column-to-bookings.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter`

   The SQL command is:
   ```sql
   ALTER TABLE bookings
     ADD COLUMN IF NOT EXISTS notes TEXT;
   ```

3. **Verify the Column Was Added**
   Run this query to confirm:
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'bookings' AND column_name = 'notes';
   ```
   
   You should see a row with `column_name = 'notes'` and `data_type = 'text'`.

### Step 2: Wait for Schema Cache to Refresh

Supabase caches the database schema. After adding the column:
- **Wait 1-2 minutes** for the cache to refresh automatically
- Or **restart your Next.js development server** if running locally:
  ```bash
  # Stop the server (Ctrl+C)
  # Then restart
  npm run dev
  ```

### Step 3: Test the Fix

1. Try updating a booking again
2. The error should be resolved

## Code Changes Made

I've also updated the code (`app/api/admin/bookings/[id]/route.ts`) to handle this error more gracefully:
- If the `notes` column doesn't exist in the schema cache, it will retry the update without the notes field
- This provides a fallback while the schema cache refreshes

## If the Error Persists

If you still get the error after running the migration:

1. **Check if the column exists:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'bookings' AND column_name = 'notes';
   ```

2. **If the column doesn't exist, run the migration again:**
   ```sql
   ALTER TABLE bookings ADD COLUMN notes TEXT;
   ```

3. **Clear Supabase cache** (if you have access):
   - Go to Supabase Dashboard → Settings → API
   - The schema cache should refresh automatically within a few minutes

4. **Restart your application** to ensure it picks up the new schema

## Notes

- The `notes` column is optional (nullable), so existing bookings won't be affected
- The column stores TEXT, so it can hold notes of any length
- This column is separate from the `booking_notes` table, which is used for admin notes with timestamps

