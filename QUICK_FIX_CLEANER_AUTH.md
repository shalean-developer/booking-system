# Quick Fix: Cleaner Authentication Fields

## Problem
You're getting "Failed to create cleaner" or "Cleaner API error: {}" when trying to add cleaners in the admin dashboard.

## Root Cause
The `cleaners-auth.sql` migration hasn't been run, so the `auth_provider`, `password_hash`, and other auth fields don't exist in your database.

## Quick Fix (2 minutes)

### Step 1: Verify the Issue
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste this verification query:

```sql
-- Check if auth fields exist
SELECT 
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cleaners' AND column_name = 'auth_provider'
  ) THEN '✓ auth_provider exists' ELSE '✗ auth_provider MISSING - RUN MIGRATION!' END as status;
```

3. If you see "MISSING", proceed to Step 2

### Step 2: Run the Migration
1. Still in **SQL Editor**, create a new query
2. Copy the entire contents of `supabase/migrations/cleaners-auth.sql` file
3. Paste it into SQL Editor
4. Click **Run** or press `Ctrl+Enter`

The migration will:
- ✅ Add `auth_provider` column
- ✅ Add `password_hash` column
- ✅ Add `otp_code` and related columns
- ✅ Add `is_available` column
- ✅ Add phone unique constraint
- ✅ Create necessary indexes
- ✅ Set up RLS policies

### Step 3: Verify Success
Run this query to confirm:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cleaners' 
  AND column_name IN ('auth_provider', 'password_hash', 'otp_code', 'is_available')
ORDER BY column_name;
```

You should see all 4 columns listed.

### Step 4: Try Creating Cleaner Again
1. Go back to **Admin Dashboard** → **Cleaners**
2. Click **Add Cleaner**
3. Fill in the form and click **Create**
4. It should work now! ✅

## Still Having Issues?

### Check Browser Console
Open browser DevTools (F12) → Console tab. Look for these logs:
- `Sending cleaner data:` - Shows what's being sent
- `Response status:` - Shows HTTP status
- `HTTP Error:` - Shows specific error

### Common Issues After Migration

**Issue: "duplicate key value violates unique constraint"**
- A cleaner with that phone number already exists
- Use a different phone number or edit the existing cleaner

**Issue: "HTTP 403" or "Unauthorized"**
- You're not logged in as an admin
- Check that your user has `role = 'admin'` in the customers table

**Issue: "Invalid phone number format"**
- Use format: `0123456789` or `+27123456789`
- The system will auto-normalize it

### Check Admin Access
Run this in SQL Editor to verify you're an admin:

```sql
-- Replace with your actual email
SELECT 
  email, 
  role,
  CASE WHEN role = 'admin' THEN '✓ Admin access' ELSE '✗ Not an admin' END as status
FROM customers 
WHERE email = 'your-email@example.com';
```

## Need More Help?

See full documentation in `ADMIN_CLEANER_PASSWORD_SETUP.md`

