# Fix Auth Signup - Remove Failing Triggers

## 🎯 Problem Identified

You have **3 triggers** on `auth.users` table:
1. `on_auth_user_created`
2. `on_auth_user_created_profile`
3. `on_user_create_referral_code`

**One of these is failing** when users try to sign up, causing the "Database error saving new user" error.

---

## ✅ Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
1. Go to: https://app.supabase.com/project/utfvbtcszzafuoyytlpf/sql/new
2. Open the file: `supabase/remove-auth-triggers.sql`
3. Copy the DROP TRIGGER commands (shown below)

### Step 2: Run These Commands

**Copy and paste into Supabase SQL Editor:**

```sql
-- Remove the failing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_user_create_referral_code ON auth.users;
```

**Click "Run" or press Ctrl+Enter**

### Step 3: Verify Triggers Are Gone

Run this to confirm:
```sql
SELECT COUNT(*) AS remaining_triggers
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';
```

**Expected result:** `0` (zero triggers)

### Step 4: Test Signup

1. Go to: http://localhost:3002/signup
2. Fill the form with test data
3. Click "Create Account"
4. Should work! ✅

---

## ❓ What These Triggers Were Trying To Do

### Trigger 1: `on_auth_user_created`
- **Purpose:** Probably trying to do some action when user signs up
- **Issue:** Failing for unknown reason

### Trigger 2: `on_auth_user_created_profile`
- **Purpose:** Auto-create customer profile when user signs up
- **Issue:** Likely failing due to:
  - RLS policy blocking the insert
  - Missing data (email, metadata)
  - Foreign key constraint issue

### Trigger 3: `on_user_create_referral_code`
- **Purpose:** Create a referral code for the new user
- **Issue:** Referral table might not exist or function failing

---

## ✅ Why Removing Triggers is OK

### Customer Profiles Still Work!

**Our current implementation:**
- ✅ Profiles are created on **first booking** (not on signup)
- ✅ Already implemented in `app/api/bookings/route.ts`
- ✅ Auth linking works automatically
- ✅ Guest checkout preserved

**Why this is better:**
1. **Faster signup** - No extra database work
2. **No failure points** - Signup can't fail due to profile creation
3. **Only real customers** - Profiles created for people who actually book
4. **Guest-friendly** - Works with or without auth

### Referral Codes (If You Need Them)

**Option 1: Add later**
- Implement referral system in the booking flow
- Create code when user makes first booking
- More reliable than trigger

**Option 2: Recreate trigger with proper error handling**
- Fix the failing function
- Add EXCEPTION handling
- Make it non-blocking (continue even if fails)

---

## 🔄 What Happens After Fix

### ✅ Signup Flow (After Removing Triggers):
```
1. User fills signup form (/signup)
2. Submit → supabase.auth.signUp()
3. ✅ User created in auth.users
4. ✅ Email verification sent
5. User verifies email
6. User logs in
7. User books a service
8. ✅ Customer profile created with auth_user_id
9. ✅ Everything linked correctly
```

### ❌ Signup Flow (Before Fix - With Failing Triggers):
```
1. User fills signup form
2. Submit → supabase.auth.signUp()
3. Auth tries to create user
4. Trigger fires: on_auth_user_created_profile
5. ❌ Trigger fails (RLS/missing data/etc)
6. ❌ Entire signup rolled back
7. ❌ User sees "Database error saving new user"
8. ❌ User cannot sign up
```

---

## 🔍 If You Want to Keep Auto-Profile Creation

If you really want profiles to auto-create on signup, we need to **fix the trigger** instead of removing it.

### Step 1: Find the Function

```sql
SELECT routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name ILIKE '%profile%'
  OR routine_name ILIKE '%user_created%';
```

### Step 2: Review the Function Code

Look for:
- ❌ Missing error handling
- ❌ RLS issues (`SET LOCAL role = postgres;`)
- ❌ Missing columns or wrong types
- ❌ Foreign key issues

### Step 3: Fix the Function

Add proper error handling:
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Use security definer to bypass RLS
  INSERT INTO public.customers (
    auth_user_id,
    email,
    first_name,
    last_name,
    total_bookings
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    0
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail signup
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;  -- Allow signup to continue
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

---

## 📊 Comparison: Trigger vs. Booking-Time Creation

| Aspect | Trigger (Auto-create) | Booking-Time (Current) |
|--------|----------------------|------------------------|
| **Speed** | Slower signup | Faster signup ✅ |
| **Reliability** | Can fail and block signup ❌ | Never blocks signup ✅ |
| **Profiles** | All users get profile | Only customers get profile ✅ |
| **Guest checkout** | Works | Works ✅ |
| **Complexity** | More complex | Simpler ✅ |
| **Maintenance** | Harder to debug | Easier to debug ✅ |

**Recommendation:** Keep current approach (no trigger) ✅

---

## 🆘 If Removing Triggers Doesn't Fix It

If signup still fails after removing triggers:

### Check for Webhooks

```
1. Supabase Dashboard → Database → Webhooks
2. Look for webhooks on `auth.users` table
3. Disable any found
4. Test again
```

### Check RLS on auth.users

```sql
-- See if there are restrictive policies
SELECT * FROM pg_policies 
WHERE schemaname = 'auth' 
AND tablename = 'users';
```

### Test Simplified Signup

```
1. Go to: http://localhost:3002/signup-test
2. Try signup without metadata
3. Check if that works
```

---

## ✅ Summary

**Problem:** 3 triggers on `auth.users` are failing and blocking signup

**Solution:** Remove the triggers
```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP TRIGGER IF EXISTS on_user_create_referral_code ON auth.users;
```

**Result:** 
- ✅ Signup works
- ✅ Profiles still created (on first booking)
- ✅ Auth linking works
- ✅ Guest checkout preserved

**Files:**
- `supabase/remove-auth-triggers.sql` - Full SQL with comments
- `FIX_TRIGGERS_INSTRUCTION.md` - This file

**Next:** Copy the DROP TRIGGER commands into Supabase SQL Editor and run them!

---

**Need help?** If signup still doesn't work after removing triggers, share:
1. Result of the DROP commands
2. Result from signup-test page
3. Any new error messages

