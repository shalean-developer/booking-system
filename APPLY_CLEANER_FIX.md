# 🔧 Apply Cleaner Claim Job Fix - Quick Guide

## The Problem
Cleaners couldn't claim jobs - the "Claim Job" button wasn't working.

## The Solution (2 Minutes)

### Step 1: Run SQL Fix in Supabase
1. Go to your Supabase Dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `CLEANER_CLAIM_JOB_QUICK_FIX.sql`
5. Click **Run**
6. You should see "Success completed" with a table showing 4 policies

### Step 2: Restart Your Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Test It!
1. Go to `http://localhost:3000/cleaner/login`
2. Login as a cleaner
3. Click **Available Jobs** tab
4. Click **Claim Job** on any booking
5. Success! ✅ You should see "Booking claimed successfully!"

## What Changed?

### Code Changes:
- ✅ `lib/cleaner-auth.ts` - Added optional service role key support
- ✅ `supabase/migrations/fix-cleaner-claim-bookings.sql` - New RLS policies
- ✅ `CLEANER_CLAIM_JOB_QUICK_FIX.sql` - Quick fix script (use this!)

### Database Changes:
- Updated 4 RLS policies on the `bookings` table
- Policies now allow cleaners to claim available bookings
- Security maintained through API route authentication

## Optional: Add Service Role Key (Better Security)

If you want even better security, add this to `.env.local`:

```env
# Get from Supabase Dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Then restart: `npm run dev`

**Note**: This is optional - the fix works without it!

## Troubleshooting

**Can't see available jobs?**
- Check if bookings exist in database with `cleaner_id = NULL` and `status = 'pending'`
- Make sure cleaner is logged in (check cookies in DevTools)

**"Unauthorized" error?**
- Clear cookies and login again
- Verify cleaner account exists and is active

**Still having issues?**
- Check browser console for errors
- Check Supabase logs in Dashboard > Logs
- Read full docs: `CLEANER_CLAIM_JOB_FIX.md`

## Done! 🎉

Your cleaners can now claim jobs successfully!

