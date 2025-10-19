# Admin Dashboard RLS Fix

## Problem
When trying to update cleaners or bookings as an admin, you get these errors:
```
Failed to update cleaner
Failed to update booking
```

This happens because the `cleaners` and `bookings` tables have Row Level Security (RLS) enabled, but there are no policies that allow admins to manage these records.

## Root Cause

### Cleaners Table
The `cleaners` table has these RLS policies:
- ✅ Public can view active cleaners (SELECT for active only)
- ✅ Cleaners can view own profile (SELECT)
- ✅ Cleaners can update own profile (UPDATE for their own record)
- ❌ **No admin policies exist!**

### Bookings Table
The `bookings` table has these RLS policies:
- ✅ Public can create bookings (INSERT)
- ✅ Public can view bookings (SELECT)
- ✅ Cleaners can view/update assigned bookings
- ❌ **No admin policies exist!**

When an admin tries to update these records, the RLS policies block the database operations.

## Solution

### Option 1: Quick Fix for Cleaners & Bookings (Fast)
If you just need to fix cleaners and bookings:

**File: `supabase/quick-fix-admin-cleaners.sql`**

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire contents of the file
4. Click **Run**

This script adds admin policies for **cleaners** and **bookings** tables only.

### Option 2: Comprehensive Fix for All Tables (Recommended)
If you want to prevent this issue for ALL admin tables:

**File: `supabase/comprehensive-admin-policies.sql`**

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the entire contents of the file
4. Click **Run**

This script adds admin policies for ALL tables:
- ✅ cleaners
- ✅ bookings
- ✅ customers
- ✅ applications
- ✅ blog_posts, blog_categories, blog_tags, blog_post_tags
- ✅ pricing_config, pricing_history
- ✅ quotes
- ✅ customer_ratings
- ✅ newsletter_subscribers

This prevents future "Failed to update" errors across the entire admin dashboard.

### Option 3: Apply Database Migration
Using Supabase CLI:
```bash
supabase db push
```

This runs the migration file: `supabase/migrations/add-admin-cleaners-policies.sql`

### Option 4: Use Service Role Key (Not Recommended)
Modify the API to use the service role key which bypasses RLS. This is less secure but works immediately.

**Not recommended** because it bypasses all security policies.

## Verification
After applying the fix:

1. Make sure you're logged in as an admin
2. Try to update a cleaner in the admin dashboard
   - Check browser console: `✅ Cleaner updated: [cleaner-id]`
3. Try to update a booking status in the admin dashboard
   - Check browser console: `✅ Booking updated: [booking-id]`

### Verify Policies (Optional)
Run this in Supabase SQL Editor to see all policies:
```sql
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('cleaners', 'bookings')
ORDER BY tablename, policyname;
```

You should see 8 new admin policies (4 for cleaners, 4 for bookings).

## Additional Notes
- The `is_admin()` function uses `SECURITY DEFINER` to securely check the admin role
- The function checks the `customers` table for `role = 'admin'`
- All four CRUD operations (SELECT, INSERT, UPDATE, DELETE) are now available to admins for both tables
- These policies work alongside existing policies (they don't replace them)

## Files Created

### SQL Scripts (Choose one)
- ✅ `supabase/quick-fix-admin-cleaners.sql` - Quick fix for cleaners & bookings only
- ✅ `supabase/comprehensive-admin-policies.sql` - **Recommended** - Fixes all tables
- ✅ `supabase/migrations/add-admin-cleaners-policies.sql` - Migration file

### Documentation
- ✅ `ADMIN_DASHBOARD_RLS_FIX.md` - This documentation

## Affected Components
- `components/admin/cleaners-section.tsx` - Cleaner management
- `components/admin/bookings-section.tsx` - Booking management
- `components/admin/blog-section.tsx` - Blog management
- `components/admin/applications-section.tsx` - Job applications management
- `components/admin/customers-section.tsx` - Customer management
- `app/api/admin/cleaners/route.ts` - Cleaners API
- `app/api/admin/bookings/route.ts` - Bookings API
- `app/api/admin/blog/*/route.ts` - Blog APIs
- `app/api/admin/applications/route.ts` - Applications API

