# Complete Auth Signup Troubleshooting Guide

## 🔍 Problem Summary

**Error:** `AuthApiError: Database error saving new user`
**Status:** 500 Internal Server Error  
**Impact:** Users cannot create accounts

## 🚀 Quick Start (5 Minutes)

### Option 1: Run Simplified Test First
```
1. Go to: http://localhost:3002/signup-test
2. Enter test email + password
3. Click "Test Simplified Signup"
4. Check result:
   ✅ Works → Metadata issue (see Solution A)
   ❌ Fails → Database issue (see Solution B)
```

### Option 2: Run SQL Diagnostics
```
1. Open: Supabase → SQL Editor
2. Copy queries from: supabase/debug-auth-triggers.sql
3. Run each query
4. Note any triggers, functions, or RLS issues
5. Follow solutions below
```

---

## 📁 Files Created

### 1. `supabase/debug-auth-triggers.sql`
**Purpose:** SQL queries to diagnose database issues

**Contains:**
- Query 1: Check triggers on `auth.users`
- Query 2: Find functions referencing auth
- Query 3: Check webhooks
- Query 4: Verify RLS policies
- Query 5: Confirm table structure
- Query 6: Test permissions
- Query 7-10: Additional diagnostics

**How to use:**
```
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy/paste each query
4. Run and note results
```

---

### 2. `FIX_AUTH_DEBUG_CHECKLIST.md`
**Purpose:** Step-by-step debugging checklist

**Contains:**
- Dashboard checks (Webhooks, Hooks, Functions)
- Common issues and solutions
- Temporary workarounds
- Fix instructions

**How to use:**
```
Follow Steps 1-4 in order:
1. Run SQL Diagnostics
2. Check Supabase Dashboard
3. Test Simplified Signup
4. Apply appropriate solution
```

---

### 3. `app/signup-test/page.tsx`
**Purpose:** Test signup without metadata

**URL:** http://localhost:3002/signup-test

**Contains:**
- Simplified signup form (email + password only)
- NO first_name/last_name metadata
- Detailed logging
- Diagnosis based on result

**How to use:**
```
1. Navigate to /signup-test
2. Use unique test email
3. Submit form
4. Check result and logs
5. Follow recommended next steps
```

---

## 🎯 Most Likely Causes (Ranked)

### 1. Database Trigger Failing (80% likely)
**Symptoms:**
- SQL Query 1 shows trigger on `auth.users`
- Trigger tries to auto-create customer profile
- Fails due to missing data or RLS

**Check:**
```sql
SELECT trigger_name FROM information_schema.triggers
WHERE event_object_table = 'users';
```

**Solution:**
```sql
-- Temporarily disable trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
```

---

### 2. RLS Policy Too Restrictive (10% likely)
**Symptoms:**
- SQL Query 4 shows strict policies on `customers`
- Policy requires `auth.uid()` during signup
- Auth context not available yet

**Check:**
```sql
SELECT policyname, with_check 
FROM pg_policies 
WHERE tablename = 'customers';
```

**Solution:**
```sql
-- Make INSERT policy permissive
CREATE POLICY "Allow signup context" ON customers
  FOR INSERT WITH CHECK (true);
```

---

### 3. Database Webhook Timeout (5% likely)
**Symptoms:**
- Dashboard shows webhook on `auth.users`
- Webhook URL slow or failing
- Auth logs show timeout

**Check:**
- Database → Webhooks → Look for `auth.users`

**Solution:**
- Disable webhook temporarily
- Fix webhook endpoint
- Re-enable after fix

---

### 4. Metadata Causing Issue (3% likely)
**Symptoms:**
- Simplified signup (/signup-test) works
- Normal signup (/signup) fails
- Error only with first_name/last_name

**Check:**
- Test at /signup-test

**Solution:**
See "Solution A: Fix Metadata Issue" below

---

### 5. Email Already Exists (2% likely)
**Symptoms:**
- Same email used multiple times
- Previous test failed mid-creation

**Check:**
```sql
SELECT email FROM auth.users 
WHERE email = 'your-test@email.com';
```

**Solution:**
- Use different email
- Or delete test user

---

## ✅ Solution A: Fix Metadata Issue

**If simplified signup works but normal signup fails:**

### Option A1: Remove Metadata Temporarily

Edit `app/signup/page.tsx`:

```typescript
// BEFORE (line 65):
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: data.email,
  password: data.password,
  options: {
    data: {
      first_name: data.firstName,  // ← REMOVE THIS
      last_name: data.lastName,    // ← REMOVE THIS
    },
  },
});

// AFTER:
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: data.email,
  password: data.password,
  // NO options - signup with minimal data
});
```

### Option A2: Store Names in Customer Profile

```typescript
// After successful signup
if (authData.user) {
  // Store names in customer profile instead
  await supabase.from('customers').insert({
    auth_user_id: authData.user.id,
    email: data.email,
    first_name: data.firstName,
    last_name: data.lastName,
    total_bookings: 0,
  });
}
```

---

## ✅ Solution B: Fix Database Issue

**If even simplified signup fails:**

### Step 1: Find the Trigger

Run in SQL Editor:
```sql
SELECT 
  trigger_name,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth' 
  AND event_object_table = 'users';
```

**If found:**
```sql
-- Copy trigger name, then:
DROP TRIGGER trigger_name_here ON auth.users;
```

### Step 2: Find the Function

Run in SQL Editor:
```sql
SELECT routine_name 
FROM information_schema.routines
WHERE routine_definition ILIKE '%auth.users%';
```

**If found:**
```sql
-- Copy function name, then:
DROP FUNCTION function_name_here CASCADE;
```

### Step 3: Check Webhooks

1. Go to: Database → Webhooks
2. Look for webhooks on `auth.users`
3. Click "..." → Disable
4. Test signup again

### Step 4: Fix RLS Policies

Run in SQL Editor:
```sql
-- Temporarily make customers table permissive
DROP POLICY IF EXISTS "Public can create own customer profile" ON customers;

CREATE POLICY "Allow all inserts for testing" ON customers
  FOR INSERT WITH CHECK (true);
```

**Then test signup.**

**After it works:**
```sql
-- Restore proper RLS
DROP POLICY "Allow all inserts for testing" ON customers;

CREATE POLICY "Public can create own customer profile" ON customers
  FOR INSERT WITH CHECK (auth.uid() IS NULL OR auth.uid() = auth_user_id);
```

---

## 🔧 Common Solutions Quick Reference

### Solution: No Triggers Found
```
→ Check webhooks (Database → Webhooks)
→ Check RLS policies
→ Check auth.users table access
```

### Solution: Trigger Found
```
→ Drop trigger temporarily
→ Signup will work
→ Profiles created on first booking instead
```

### Solution: Webhook Found
```
→ Disable webhook
→ Test signup
→ Fix webhook endpoint
→ Re-enable
```

### Solution: RLS Too Strict
```
→ Make INSERT policy permissive
→ Test signup
→ Refine policy after it works
```

### Solution: Missing Column
```
→ Run: supabase/add-auth-to-customers.sql
→ Adds auth_user_id column
→ Test again
```

---

## 🧪 Testing Procedure

### 1. Test Simplified Signup
```
URL: http://localhost:3002/signup-test
Email: test1@example.com
Password: password123
Expected: Success ✅
```

### 2. Test Normal Signup (After Fix)
```
URL: http://localhost:3002/signup
Fill all fields
Expected: Success ✅
```

### 3. Verify User Created
```sql
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
```

### 4. Verify Customer Profile (If Applicable)
```sql
SELECT id, auth_user_id, email, first_name 
FROM customers 
WHERE auth_user_id IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 📊 Decision Tree

```
Start: Signup fails with "Database error"
  ↓
  → Go to /signup-test
     ↓
     ├─ Works? ✅
     │  → Metadata issue
     │  → Remove options.data from signup
     │  → Or store names in profile
     │
     └─ Fails? ❌
        → Database issue
        ↓
        → Run SQL Query 1 (Check triggers)
           ↓
           ├─ Trigger found?
           │  → DROP TRIGGER
           │  → Test again
           │
           └─ No trigger?
              → Check webhooks in Dashboard
                 ↓
                 ├─ Webhook found?
                 │  → Disable webhook
                 │  → Test again
                 │
                 └─ No webhook?
                    → Check RLS policies
                       → Make permissive
                       → Test again
```

---

## 🎯 Expected Outcome

After applying fixes:

✅ **Signup works**
- No "Database error" message
- User created in `auth.users`
- Email verification sent (if enabled)

✅ **Login works**
- Users can sign in with credentials
- Session persists
- Header shows user name

✅ **Customer profile links**
- Profile created on first booking
- `auth_user_id` properly linked
- Autofill works on return

✅ **Guest checkout still works**
- No login required
- Email-based profiles
- Can claim later by signing up

---

## 🆘 Still Not Working?

If none of these solutions work, gather this info:

1. **Result from /signup-test:**
   - Did it work or fail?
   - Copy the detailed log

2. **SQL Query Results:**
   - Query 1: Any triggers found?
   - Query 2: Any functions found?
   - Query 4: What RLS policies exist?

3. **Dashboard Screenshots:**
   - Database → Webhooks page
   - Authentication → Hooks page

4. **Auth Log Details:**
   - Full error message from Logs → Auth
   - Include stack trace if available

5. **Test Details:**
   - Email used for testing
   - Timestamp of failed attempt
   - Browser console errors

---

## 📚 File Reference

### Debug Files Created:
1. `supabase/debug-auth-triggers.sql` - SQL diagnostic queries
2. `FIX_AUTH_DEBUG_CHECKLIST.md` - Step-by-step checklist
3. `app/signup-test/page.tsx` - Simplified test page
4. `AUTH_SIGNUP_TROUBLESHOOTING_COMPLETE.md` - This file

### Existing Auth Files:
- `app/signup/page.tsx` - Normal signup page
- `app/login/page.tsx` - Login page
- `lib/supabase-browser.ts` - Client helper
- `lib/auth.ts` - Server auth helper
- `components/header.tsx` - Auth state display

### Database Files:
- `supabase/customers-table.sql` - Customer table
- `supabase/add-auth-to-customers.sql` - Auth column
- `supabase/update-bookings-for-customers.sql` - Bookings link

---

## ✅ Quick Win Solutions

### Quickest Fix (2 min):
```
1. Go to /signup-test
2. If works → Remove metadata from normal signup
3. Done ✅
```

### Most Common Fix (5 min):
```
1. Run SQL Query 1
2. If trigger found → DROP TRIGGER
3. Test signup
4. Done ✅
```

### Nuclear Option (1 min):
```
1. Database → Tables → customers
2. Click "..." → Disable RLS
3. Test signup (will work)
4. Re-enable RLS
5. Refine policies
```

---

**Status:** Complete debugging toolkit ready!  
**Next:** Follow Quick Start above to identify and fix the issue.

Good luck! 🚀

