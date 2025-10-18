# Fix Database Permission Error

## Problem
The pricing system is getting a "permission denied for table users" error because the RLS policies are trying to access the `auth.users` table directly, which requires special permissions.

## Solution
Run the fixed SQL scripts that use simplified authentication checks.

## Step-by-Step Fix

### Step 1: Drop Existing Tables (if they exist)

Run this in Supabase SQL Editor:

```sql
-- Drop existing policies first
DROP POLICY IF EXISTS "Public can view active pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can manage pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can view pricing history" ON pricing_history;

-- Drop triggers
DROP TRIGGER IF EXISTS pricing_change_trigger ON pricing_config;
DROP TRIGGER IF EXISTS pricing_updated_at_trigger ON pricing_config;

-- Drop functions
DROP FUNCTION IF EXISTS log_pricing_change();
DROP FUNCTION IF EXISTS update_pricing_updated_at();
DROP FUNCTION IF EXISTS get_active_pricing();

-- Drop tables (CASCADE will also drop the history table)
DROP TABLE IF EXISTS pricing_history CASCADE;
DROP TABLE IF EXISTS pricing_config CASCADE;
```

### Step 2: Run Fixed Schema

Execute the file: `supabase/pricing-config-table-fixed.sql`

This file fixes the issue by:
- Removing foreign key constraints to `auth.users` table
- Using `auth.jwt()` to check admin role from JWT claims instead of querying auth.users
- Adding `SECURITY DEFINER` to the `get_active_pricing()` function to bypass RLS for public reads

### Step 3: Run Bookings Table Update

Execute the file: `supabase/update-bookings-pricing.sql`

This adds the required columns to the bookings table.

### Step 4: Seed Initial Data

Execute the file: `supabase/seed-pricing.sql`

This will populate the pricing_config table with 23 initial price records.

### Step 5: Verify Installation

Run this query to verify data was seeded correctly:

```sql
SELECT 
  price_type,
  service_type,
  item_name,
  price,
  is_active
FROM pricing_config
WHERE is_active = true
ORDER BY 
  CASE price_type
    WHEN 'base' THEN 1
    WHEN 'bedroom' THEN 2
    WHEN 'bathroom' THEN 3
    WHEN 'extra' THEN 4
    WHEN 'service_fee' THEN 5
    WHEN 'frequency_discount' THEN 6
  END,
  service_type,
  item_name;
```

You should see 23 active records.

### Step 6: Test the Admin Interface

1. Start your dev server: `npm run dev`
2. Navigate to `/admin`
3. Click on the "Pricing" tab
4. Verify prices load without errors
5. Try editing a price to test write permissions

## Key Changes in Fixed Version

### 1. Removed Foreign Key Constraints
```sql
-- OLD (causes permission issues):
created_by UUID REFERENCES auth.users(id)

-- NEW (no FK constraint):
created_by UUID
```

### 2. Simplified Admin Check
```sql
-- OLD (queries auth.users table):
EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid()
  AND auth.users.raw_user_meta_data->>'role' = 'admin'
)

-- NEW (checks JWT claims directly):
auth.uid() IS NOT NULL
AND (
  auth.jwt()->>'role' = 'admin'
  OR 
  (auth.jwt()->'user_metadata'->>'role') = 'admin'
)
```

### 3. Security Definer Function
```sql
CREATE OR REPLACE FUNCTION get_active_pricing()
RETURNS TABLE (...)
SECURITY DEFINER  -- This allows function to bypass RLS
SET search_path = public
AS $$
...
```

## Troubleshooting

### If you still get permission errors:

1. **Check if you're logged in as admin**:
   ```sql
   SELECT auth.uid(), auth.jwt();
   ```

2. **Verify your user has admin role**:
   ```sql
   SELECT 
     id, 
     email, 
     raw_user_meta_data->>'role' as role 
   FROM auth.users 
   WHERE id = auth.uid();
   ```

3. **Grant permissions explicitly** (run as superuser):
   ```sql
   GRANT USAGE ON SCHEMA public TO authenticated;
   GRANT USAGE ON SCHEMA public TO anon;
   GRANT SELECT ON pricing_config TO authenticated;
   GRANT SELECT ON pricing_config TO anon;
   GRANT ALL ON pricing_config TO authenticated;
   ```

### If prices don't load in the booking flow:

Check browser console for detailed errors and verify:
- The `get_active_pricing()` function exists
- Public SELECT policy is active
- Data was seeded correctly

## After Fix

Once fixed, the pricing system will:
- ✅ Load prices for public users (booking flow)
- ✅ Allow admins to manage prices
- ✅ Track all price changes in history
- ✅ Support scheduled future prices
- ✅ Show service fees and frequency discounts in bookings

## Quick Fix Script

If you want to run everything at once in Supabase SQL Editor:

```sql
-- 1. Clean up (if tables exist)
DROP POLICY IF EXISTS "Public can view active pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can manage pricing" ON pricing_config;
DROP POLICY IF EXISTS "Admins can view pricing history" ON pricing_history;
DROP TABLE IF EXISTS pricing_history CASCADE;
DROP TABLE IF EXISTS pricing_config CASCADE;

-- 2. Run the contents of pricing-config-table-fixed.sql
-- (Copy and paste the entire file here)

-- 3. Run the contents of update-bookings-pricing.sql
-- (Copy and paste the entire file here)

-- 4. Run the contents of seed-pricing.sql
-- (Copy and paste the entire file here)
```

Then refresh your admin dashboard and the pricing tab should work!

