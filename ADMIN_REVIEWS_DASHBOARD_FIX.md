# Admin Reviews Dashboard Fix

## Problem
The admin dashboard was showing "No reviews yet" and "No ratings yet" even when reviews and ratings exist in the database. This was caused by missing Row Level Security (RLS) policies that allow admins to view all reviews and ratings.

## Root Cause
1. **Missing Admin Policy for `cleaner_reviews`**: The admin policy was dropped in `fix-reviews-rls-permission.sql` to fix customer dashboard issues, but this broke admin access.

2. **No Admin Policy for `customer_ratings`**: The `customer_ratings` table never had an admin policy, so admins couldn't view cleaner ratings of customers.

3. **RLS Policy Mismatch**: The original admin policies used `auth.users.raw_user_meta_data` which caused permission errors, while the `isAdmin()` function checks the `customers` table.

## Solution
Created `supabase/fix-admin-reviews-access.sql` that:

1. **Uses Consistent Admin Check**: Uses the same `is_admin()` function as other admin policies
2. **Fixes `cleaner_reviews` Access**: Restores admin policy for viewing all customer reviews
3. **Adds `customer_ratings` Access**: Creates admin policy for viewing all cleaner ratings
4. **Maintains Security**: Only allows admins to view, not modify reviews/ratings

## Files Modified
- `supabase/fix-admin-reviews-access.sql` - New SQL fix file

## How to Apply the Fix

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Fix Script**
   - Copy the contents of `supabase/fix-admin-reviews-access.sql`
   - Paste into SQL Editor
   - Click **Run**

3. **Verify the Fix**
   - Go to admin dashboard
   - Navigate to **Reviews** tab
   - You should now see all reviews and ratings

## Technical Details

### Admin Policies Created
```sql
-- For cleaner_reviews table
CREATE POLICY "Admins can view all reviews" ON cleaner_reviews
  FOR SELECT
  USING (is_admin());

-- For customer_ratings table  
CREATE POLICY "Admins can view all customer ratings" ON customer_ratings
  FOR SELECT
  USING (is_admin());
```

### Admin Check Function
The `is_admin()` function checks if the authenticated user has `role = 'admin'` in the `customers` table, which matches how the `isAdmin()` API function works.

### Security Considerations
- ✅ Admins can view all reviews and ratings
- ✅ Customers can still only view their own reviews
- ✅ Cleaners can still only view their own ratings
- ✅ No modification permissions granted (reviews are permanent)
- ✅ Uses same security model as other admin features

## Testing
After applying the fix:
1. Admin dashboard should show all customer reviews
2. Admin dashboard should show all cleaner ratings
3. Customer dashboard should still work normally
4. Cleaner dashboard should still work normally

## Related Files
- `components/admin/reviews-section.tsx` - Admin reviews display component
- `app/api/admin/reviews/route.ts` - Admin reviews API endpoint
- `lib/supabase-server.ts` - Contains `isAdmin()` function
- `supabase/fix-reviews-rls-permission.sql` - Previous fix that broke admin access
