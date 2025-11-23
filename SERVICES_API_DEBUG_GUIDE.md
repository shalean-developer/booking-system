# Services API 500 Error - Debug Guide

## Quick Diagnostic

I've created a diagnostic endpoint to check what's wrong. **Visit this URL** while your dev server is running:

```
http://localhost:3000/api/services/debug
```

This will show you:
- ✅ Environment variables status
- ✅ Database connection status
- ✅ Services table status
- ✅ Pricing config table status
- ❌ Specific error messages

## Common Causes & Fixes

### 1. Missing Environment Variables

**Symptoms:** Error message mentions "Missing Supabase environment variables"

**Fix:**
1. Create/check `.env.local` file in your project root
2. Add these variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
3. **Restart your dev server** after adding/changing environment variables

**Where to get credentials:**
- Go to https://supabase.com
- Sign in → Select your project
- Settings → API
- Copy "Project URL" and "anon/public key"

---

### 2. Services Table Doesn't Exist

**Symptoms:** Error message contains "relation does not exist" or "services table does not exist"

**Fix:**
1. Check your Supabase dashboard → Table Editor
2. Verify `services` table exists
3. If missing, run the database migration from `supabase/` directory

**Check for migration files:**
- Look in `supabase/services-table.sql` or similar
- Run the SQL in your Supabase SQL Editor

---

### 3. No Data in Services Table

**Symptoms:** Error says "No active services found" or "Services table is empty"

**Fix:**
1. Go to Supabase dashboard → Table Editor → `services` table
2. Check if table has any rows
3. Verify at least one row has `is_active = true`
4. If empty, you need to seed the database with service data

**Required fields for services table:**
- `service_type` (e.g., "regular-cleaning")
- `display_name` (e.g., "Standard Cleaning")
- `is_active` (must be `true`)
- `display_order` (for sorting)

---

### 4. Row Level Security (RLS) Blocking Access

**Symptoms:** Error mentions "permission denied" or "RLS policy"

**Fix:**
1. Go to Supabase dashboard → Authentication → Policies
2. Select the `services` table
3. Check if there's a policy allowing public read access
4. If missing, create one:

```sql
CREATE POLICY "Allow public read access" 
ON services 
FOR SELECT 
TO anon 
USING (is_active = true);
```

---

### 5. Pricing Config Table Issues

**Symptoms:** Services exist but error says "No pricing data found"

**Fix:**
1. Check `pricing_config` table exists
2. Verify it has rows with:
   - `service_type` matching your services
   - `price_type = 'base'`
   - `is_active = true`
3. Ensure `service_type` values match exactly

---

### 6. Database Connection Issue

**Symptoms:** Error says "Unable to connect to database" or timeout

**Fix:**
1. Check your internet connection
2. Verify Supabase project is not paused (check dashboard)
3. Try accessing your Supabase dashboard directly
4. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct

---

## Step-by-Step Debugging

### Step 1: Check Server Console
Look at the terminal where `npm run dev` is running. You should see detailed error logs like:
- `❌ Missing Supabase environment variables`
- `❌ Failed to fetch services metadata: [error]`
- `❌ Error fetching popular services: [error]`

### Step 2: Visit Diagnostic Endpoint
Go to: `http://localhost:3000/api/services/debug`

This will show you a JSON response with:
```json
{
  "status": "ERROR" | "OK",
  "checks": {
    "envVars": {...},
    "dbConnection": {...},
    "servicesTable": {...},
    "pricingTable": {...}
  },
  "errors": ["error1", "error2"],
  "summary": "Description of issues"
}
```

### Step 3: Fix Based on Diagnostic Results
Use the diagnostic output to identify and fix the specific issue.

### Step 4: Restart Dev Server
After fixing environment variables or database issues, **always restart your dev server**:
```powershell
# Stop server (Ctrl+C)
npm run dev
```

### Step 5: Test Again
- Clear browser cache or use incognito mode
- Visit `http://localhost:3000`
- Check if services load correctly

---

## Quick Checklist

- [ ] Environment variables set in `.env.local`
- [ ] Dev server restarted after changing `.env.local`
- [ ] `services` table exists in Supabase
- [ ] `services` table has data with `is_active = true`
- [ ] `pricing_config` table exists
- [ ] `pricing_config` has matching `service_type` values
- [ ] RLS policy allows public read access
- [ ] Supabase project is not paused
- [ ] Internet connection is working

---

## Still Having Issues?

1. **Check the diagnostic endpoint** first: `http://localhost:3000/api/services/debug`
2. **Check server console logs** for detailed error messages
3. **Verify all environment variables** are set correctly
4. **Test Supabase connection** by accessing the dashboard
5. **Check database tables** exist and have data

The diagnostic endpoint will tell you exactly what's wrong!

