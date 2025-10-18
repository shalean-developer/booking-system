# Admin Dashboard Debug Quick Start

## What Was Added

Comprehensive debugging to identify why authentication hangs on the admin dashboard.

## How to Use

### Step 1: Restart Your Dev Server

The code has been updated, so restart:

```powershell
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 2: Open Browser DevTools

1. Navigate to `http://localhost:3000/admin`
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Keep it open while the page loads

### Step 3: Watch the Diagnostics

You'll see detailed output like:

```
🔍 Starting admin access check...
📝 Step 1: Checking Supabase configuration...
✅ Environment variables configured
📝 Step 2: Creating Supabase client...
✅ Supabase client created
📝 Step 3a: Checking browser storage...
Supabase storage keys found: X
Storage[sb-xxx-auth-token]: exists (X chars)
All localStorage keys: [...]
📝 Step 3b: Trying getSession() first...
getSession-duration: X ms
Session exists: true/false
Session user: your-email or none
📝 Step 3c: Calling getUser() with 3s timeout...
getUser-duration: X ms
✅ getUser() completed successfully
```

### Step 4: Identify the Issue

Based on where it fails:

#### ❌ Fails at Step 3a (Storage Access)
**Error**: "Browser Storage Access Failed"
**Solution**: Browser security is blocking storage
- Try incognito/private mode
- Check browser settings
- Disable extensions

#### ❌ Fails at Step 3b (getSession Timeout)
**Error**: "Session Storage Timeout"
**Solution**: Corrupted storage data
- **Click the orange "Clear Storage & Retry" button**
- This will clear localStorage and reload

#### ❌ Fails at Step 3c (getUser Timeout)
**Error**: "Authentication Timeout"
**Solution**: Auth call hanging
- **Click the orange "Clear Storage & Retry" button**
- Check Network tab in DevTools for failed requests
- Verify you can access `/dashboard` (customer dashboard)

### Step 5: Use the Fix Button

If you see an error screen with an **orange "Clear Storage & Retry"** button:

1. Click it
2. Watch the console log:
   ```
   🧹 Clearing browser storage and retrying...
   Storage before clear: { localStorage: [...], sessionStorage: [...] }
   ✅ Storage cleared
   Storage after clear: { localStorage: [], sessionStorage: [] }
   ```
3. Page will reload automatically
4. Try logging in again if needed

## Common Scenarios

### Scenario 1: "Supabase storage keys found: 0"
**Meaning**: No session data exists
**Action**: Navigate to `/login` and login first

### Scenario 2: getSession() times out after 2s
**Meaning**: Corrupted session data in localStorage
**Action**: Click "Clear Storage & Retry" button

### Scenario 3: getSession() works, getUser() times out
**Meaning**: Network or auth service issue
**Action**: 
1. Check Network tab in DevTools
2. Look for requests to Supabase
3. Verify your internet connection

### Scenario 4: Storage shows keys but both calls hang
**Meaning**: Severely corrupted storage or browser issue
**Action**:
1. Click "Clear Storage & Retry"
2. If still fails, try incognito mode
3. If still fails, try different browser

## What to Share for Help

If the issue persists, share:

1. **Full console output** (copy from DevTools console)
2. **Which step failed** (3a, 3b, or 3c)
3. **Storage state** (shown in console when timeout occurs)
4. **Network tab** screenshot showing Supabase requests (or lack thereof)

Example:
```
Failed at: Step 3b
Console shows:
  📝 Step 3b: Trying getSession() first...
  ⏰ getSession() timeout - Storage access hanging
  Storage at timeout: { localStorage: [sb-xxx-auth-token, ...] }
```

## Quick Fixes Checklist

- [ ] Restart dev server
- [ ] Hard refresh page (Ctrl+Shift+R)
- [ ] Click "Clear Storage & Retry" button
- [ ] Try incognito/private mode
- [ ] Check browser console for errors
- [ ] Verify you can login to `/login`
- [ ] Test `/dashboard` works
- [ ] Check Network tab for Supabase requests

## Key Diagnostic Logs

The diagnostics will show:

✅ **Storage Keys Count** - How many Supabase keys exist
✅ **Storage Key Sizes** - Size of each stored value
✅ **Timing Data** - How long each auth call takes
✅ **Storage State at Timeout** - What's in storage when it hangs
✅ **Session Info** - Whether a session exists and for which user

## Still Stuck?

If diagnostics show everything passes but the page still doesn't work:

1. Check the **Step 4: Checking customer profile** logs
2. Verify the `role` column exists in your database
3. Confirm your user has `role = 'admin'` in the customers table
4. Run the SQL migration if needed (see error message on screen)

