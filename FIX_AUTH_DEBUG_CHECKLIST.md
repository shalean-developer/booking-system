# Fix Auth "Database error saving new user" - Debug Checklist

## Error Summary
- **Error:** `AuthApiError: Database error saving new user`
- **Status:** 500 Internal Server Error
- **Code:** `x_sb_error_code: "unexpected_failure"`
- **Impact:** Users cannot sign up

## Quick Diagnostic Steps

### ✅ Step 1: Run SQL Diagnostics (5 min)

1. **Open Supabase SQL Editor:**
   - Go to: https://app.supabase.com/project/utfvbtcszzafuoyytlpf/sql/new

2. **Copy queries from:**
   - File: `supabase/debug-auth-triggers.sql`
   - Run each query one by one
   - Note the results

3. **Look for:**
   - ❌ Triggers on `auth.users` (Query 1)
   - ❌ Functions referencing auth (Query 2)
   - ❌ Restrictive RLS policies (Query 4)
   - ❌ Missing `auth_user_id` column (Query 5)
   - ❌ Duplicate email (Query 9)

---

### ✅ Step 2: Check Supabase Dashboard (5 min)

#### A. Check Database Webhooks
**Path:** Database → Webhooks

**What to look for:**
- [ ] Webhooks listening to `auth.users` table
- [ ] Webhooks on INSERT events
- [ ] Status: "failing" or "error"

**If found:**
- Note the webhook URL
- Check webhook logs
- **Temporary fix:** Disable webhook
- **Permanent fix:** Fix webhook endpoint

---

#### B. Check Authentication Hooks
**Path:** Authentication → Hooks

**What to look for:**
- [ ] Custom SQL Functions
- [ ] Hooks on "Sign up" event
- [ ] MFA or password validation hooks

**If found:**
- Click on the hook to view details
- Check the function code
- Look for errors in function logs
- **Temporary fix:** Disable hook
- **Permanent fix:** Debug function

---

#### C. Check Database Functions
**Path:** Database → Functions

**What to look for:**
- [ ] Functions with "trigger" in the name
- [ ] Functions created recently
- [ ] Functions referencing `auth.users`

**How to check:**
- Click each function
- Look for `TRIGGER` type
- Check if attached to `auth.users`

**If found:**
- Review function SQL code
- Look for errors (missing columns, wrong types)
- **Temporary fix:** Drop trigger
- **Permanent fix:** Fix function logic

---

#### D. Check Auth Logs (Detailed)
**Path:** Logs → Auth Logs

**Filter settings:**
- Event: `user_signedup` or blank
- Status: `500` or `error`
- Time: Last 1 hour

**Look for:**
- [ ] Detailed error message beyond "Database error"
- [ ] Stack trace showing failing operation
- [ ] Function name or trigger name

**What to note:**
- Copy the full error message
- Note the timestamp
- Check if it mentions:
  - "trigger"
  - "function"
  - "policy"
  - "constraint"

---

### ✅ Step 3: Check RLS Policies (3 min)

**Path:** Database → Tables → customers → RLS

**Verify policies exist:**
- [ ] "Public can create own customer profile"
- [ ] "Authenticated users can view/update own customer profile"
- [ ] "Public can read customer profiles by email"

**Check policy SQL:**
```sql
-- Should allow anyone to INSERT
FOR INSERT WITH CHECK (auth.uid() IS NULL OR auth.uid() = auth_user_id);

-- This is permissive enough for both guest and auth users
```

**If policies are too restrictive:**
```sql
-- Temporarily make INSERT permissive
DROP POLICY IF EXISTS "Public can create own customer profile" ON customers;
CREATE POLICY "Public can create own customer profile" ON customers
  FOR INSERT WITH CHECK (true);  -- Very permissive for testing
```

---

### ✅ Step 4: Test Simplified Signup (2 min)

**Try minimal signup (no metadata):**

1. Go to: http://localhost:3002/signup-test
2. Fill form with test data
3. Submit

**Result A: Simplified signup WORKS ✅**
- **Cause:** Metadata (first_name, last_name) causing issue
- **Solution:** See "Fix Metadata Issue" below

**Result B: Simplified signup FAILS ❌**
- **Cause:** Deeper database issue (trigger/hook/RLS)
- **Solution:** Must fix database issue first

---

## Common Issues & Solutions

### Issue 1: Auto-Profile Creation Trigger ⚠️

**Symptoms:**
- Query 1 shows trigger on `auth.users`
- Trigger tries to create customer profile
- Trigger fails due to missing data

**Solution:**
```sql
-- Find trigger name from Query 1, then:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Profiles will be created on first booking instead
```

---

### Issue 2: RLS Policy Too Restrictive 🔒

**Symptoms:**
- Query 4 shows strict RLS policies
- Policy requires auth.uid() but signup hasn't completed yet

**Solution:**
```sql
-- Allow auth system context to create profiles
CREATE POLICY "Auth system can create profiles" ON customers
  FOR INSERT 
  WITH CHECK (true);  -- Permissive for auth context
```

---

### Issue 3: Missing auth_user_id Column ⚠️

**Symptoms:**
- Query 5 doesn't show `auth_user_id` column
- Trigger expects column that doesn't exist

**Solution:**
```bash
# Run the migration
psql -h <DB_HOST> -U postgres < supabase/add-auth-to-customers.sql
```

Or in Supabase SQL Editor:
```sql
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

---

### Issue 4: Database Webhook Timeout ⏱️

**Symptoms:**
- Dashboard shows webhook on `auth.users`
- Webhook URL is slow or failing
- Auth logs show timeout

**Solution:**
```
1. Database → Webhooks → Find auth.users webhook
2. Click "..." → Disable
3. Test signup again
4. Fix webhook endpoint
5. Re-enable when fixed
```

---

### Issue 5: Duplicate Email 📧

**Symptoms:**
- Query 9 shows existing user with same email
- Error message might say "already registered"

**Solution:**
```
Try signup with a different email, or delete test user:
```

```sql
-- ⚠️ ONLY FOR TESTING - Delete test user
DELETE FROM auth.users WHERE email = 'test@example.com';
```

---

### Issue 6: Email Provider Not Enabled ❌

**Symptoms:**
- Query 10 shows `email_enabled = 'false'` or 'unknown'

**Solution:**
```
1. Authentication → Providers
2. Find "Email" provider
3. Toggle ON
4. Save
5. Wait 30 seconds
6. Try again
```

---

## Fix Metadata Issue (If Step 4 Result A)

If simplified signup works but normal signup fails, metadata is the issue.

**Option 1: Remove Metadata (Quick Fix)**

In `app/signup/page.tsx`:
```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: data.email,
  password: data.password,
  // Remove options.data temporarily
});
```

**Option 2: Store Metadata in Customer Profile**

1. Remove metadata from signup
2. After signup, create customer profile manually:
```typescript
if (authData.user) {
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

## Temporary Workarounds

### Workaround 1: Disable Email Confirmation
- Auth → Settings
- Uncheck "Enable email confirmations"
- Users can login immediately
- ⚠️ Re-enable for production

### Workaround 2: Manual User Creation
- Auth → Users → Add User
- Manually create test users
- Bypass signup endpoint

### Workaround 3: Use Different Email Domain
- Some custom validators block certain domains
- Try with Gmail, Outlook, etc.

---

## Debug Process Summary

1. ✅ **Run SQL Diagnostics** → Identify triggers/functions/policies
2. ✅ **Check Dashboard** → Find webhooks/hooks/functions
3. ✅ **Check Auth Logs** → Get detailed error message
4. ✅ **Test Simplified** → Isolate metadata vs database issue
5. ✅ **Apply Solution** → Fix root cause
6. ✅ **Test Again** → Verify signup works

---

## Expected Results After Fix

✅ Signup should work
✅ User created in `auth.users`
✅ Email verification sent (if enabled)
✅ No errors in Auth Logs
✅ Customer profile linked correctly

---

## Need More Help?

If none of these solutions work:

1. **Copy full Auth Log error** (with stack trace)
2. **Share results from Query 1-5**
3. **Screenshot of Database Webhooks page**
4. **Screenshot of Auth Hooks page**

This will help identify the exact issue.

---

## Quick Commands Reference

**Check for triggers:**
```sql
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'users';
```

**Temporarily disable RLS:**
```sql
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
-- Test signup
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
```

**Check auth.users access:**
```sql
SELECT COUNT(*) FROM auth.users;
```

**Test customer insert:**
```sql
INSERT INTO customers (email, first_name, last_name) 
VALUES ('test@test.com', 'Test', 'User');
-- Should work without error
```

---

**Status:** Ready to debug! Follow steps 1-4 in order.

