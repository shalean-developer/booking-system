# Admin RLS Fix - Quick Summary

## The Problem
You're getting these errors in the admin dashboard:
- ❌ "Failed to update cleaner"
- ❌ "Failed to update booking"

## The Cause
Your database tables have Row Level Security (RLS) enabled, but there are NO policies allowing admins to manage the data. The RLS policies only allow:
- Public users to view/create some data
- Cleaners to manage their own data
- But **admins are blocked!**

## The Fix (Choose One)

### 🚀 Option A: Quick Fix (Cleaners & Bookings Only)
**File:** `supabase/quick-fix-admin-cleaners.sql`

Run this in Supabase SQL Editor if you only need to fix cleaners and bookings right now.

### ⭐ Option B: Comprehensive Fix (ALL Tables) - RECOMMENDED
**File:** `supabase/comprehensive-admin-policies.sql`

Run this in Supabase SQL Editor to fix ALL admin dashboard tables at once:
- cleaners, bookings, customers, applications
- blog tables, pricing tables, quotes, ratings, etc.

**This prevents future RLS errors across your entire admin dashboard!**

## How to Apply

1. Open your Supabase dashboard
2. Go to **SQL Editor**
3. Copy the contents of **Option B** (comprehensive fix)
4. Paste and click **Run**
5. Done! 🎉

## What It Does
- Creates an `is_admin()` function to check if the user is an admin
- Adds 4 policies per table (SELECT, INSERT, UPDATE, DELETE)
- Policies only allow users with `role = 'admin'` in the customers table

## After Running
Test by:
1. Login as admin
2. Try updating a cleaner → Should work ✅
3. Try updating a booking status → Should work ✅
4. Check console for: `✅ Cleaner updated:` or `✅ Booking updated:`

## Files
- 📄 `ADMIN_DASHBOARD_RLS_FIX.md` - Full documentation
- 🔧 `supabase/comprehensive-admin-policies.sql` - **Run this one!**
- 🔧 `supabase/quick-fix-admin-cleaners.sql` - Partial fix
- 📦 `supabase/migrations/add-admin-cleaners-policies.sql` - Migration file

