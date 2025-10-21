# Troubleshooting: Cleaner Claim Job Button

## Current Error
```
Failed to claim booking. It may have been claimed by another cleaner.
```

## Step-by-Step Debugging

### Step 1: Check if SQL Fix Was Applied

1. Open Supabase Dashboard → SQL Editor
2. Run the diagnostic script: `CHECK_CLEANER_FIX_STATUS.sql`
3. Look for the "Policy Status" results

**Expected**: All should show ✅ PASS  
**If you see ❌ MISSING**: The SQL fix hasn't been applied yet!

### Step 2: Apply the SQL Fix (If Not Applied)

1. In Supabase SQL Editor, create a new query
2. Copy entire contents of `CLEANER_CLAIM_JOB_QUICK_FIX.sql`
3. Click **Run**
4. You should see: "Success completed" with 4 policies listed

### Step 3: Check Server Logs

With the enhanced logging I just added, the server will now show detailed error messages:

1. Open your terminal where `npm run dev` is running
2. Try to claim a booking
3. Look for these log messages:

```
📞 Claim booking API called
✅ Cleaner authenticated: [Name] [ID]
🎯 Booking ID: [booking-id]
🔌 Supabase client created
📋 Booking found: { id, status, cleaner_id, customer_name }
🔄 Attempting to claim booking...
```

**If you see**:
- `❌ Database error claiming booking:` - **This is the key!** Look at the error details
- `code: '42501'` or message contains `policy` - **RLS policy blocking** - Run SQL fix
- `code: 'PGRST116'` - **No rows returned** - Booking was claimed by someone else (race condition)

### Step 4: Verify Environment

Check if you have the service role key (optional but recommended):

```bash
# Check .env.local file
cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY
```

**If missing**:
1. Go to Supabase Dashboard → Settings → API
2. Copy the "service_role" key (keep it secret!)
3. Add to `.env.local`:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```
4. Restart: `npm run dev`

### Step 5: Test Claim Operation

1. Login as a cleaner: `http://localhost:3000/cleaner/login`
2. Go to "Available Jobs" tab
3. Click "Claim Job"
4. Watch both:
   - Browser console (F12)
   - Server terminal logs

## Common Issues & Solutions

### Issue 1: "Database permission error"
**Cause**: RLS policies not updated  
**Solution**: Run `CLEANER_CLAIM_JOB_QUICK_FIX.sql`

### Issue 2: "Booking not found"
**Cause**: No available bookings in database  
**Solution**: Create a test booking via the booking flow

### Issue 3: "Booking already claimed"
**Cause**: The booking was claimed while you were looking at it  
**Solution**: Refresh the page to see updated list

### Issue 4: "Unauthorized"
**Cause**: Cleaner session expired or invalid  
**Solution**: Logout and login again

### Issue 5: Still failing after SQL fix
**Possible causes**:
1. SQL fix didn't apply properly
2. Cached connection in Supabase
3. Wrong database environment

**Solutions**:
1. Re-run the diagnostic: `CHECK_CLEANER_FIX_STATUS.sql`
2. Restart your dev server
3. Check Supabase logs in Dashboard → Logs → Postgres Logs
4. Try creating a new booking to test with

## Debug Checklist

- [ ] SQL fix applied (verified with diagnostic script)
- [ ] Server restarted after applying fix
- [ ] Cleaner is logged in (check cookies in DevTools)
- [ ] Available bookings exist (check database)
- [ ] No RLS policy errors in server logs
- [ ] Service role key added (optional)
- [ ] Browser console shows no network errors

## Advanced: Manual Database Test

Test the update directly in Supabase SQL Editor:

```sql
-- 1. Find an available booking
SELECT id, status, cleaner_id 
FROM bookings 
WHERE cleaner_id IS NULL AND status = 'pending' 
LIMIT 1;

-- 2. Try to claim it (replace the IDs)
UPDATE bookings 
SET 
  cleaner_id = 'your-cleaner-uuid-here',
  cleaner_claimed_at = NOW()
WHERE 
  id = 'booking-id-from-step-1' 
  AND cleaner_id IS NULL 
  AND status = 'pending'
RETURNING *;

-- If this fails, the RLS policies are still blocking it
-- If this works, the issue is elsewhere
```

## Need More Help?

Check the detailed logs after trying to claim:

1. Server terminal - Look for the ❌ error with full details
2. Browser console - Check Network tab for API response
3. Supabase Dashboard → Logs - Check Postgres logs for RLS violations

The enhanced logging will show exactly where the failure occurs!

