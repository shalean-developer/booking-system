# 🚨 FINAL UUID Fix - Service Role Key Required

## Current Issue
Even after TypeScript fixes, the UUID type error persists:
```
code: '42804'
message: 'column "cleaner_id" is of type uuid but expression is of type text'
```

## Root Cause
The Supabase client is using the **anon key** which has strict type checking. Even with `as any` assertions, the database still receives the string as text instead of UUID.

## Solution: Add Service Role Key

The **service role key** bypasses RLS and handles UUID casting automatically.

### Step 1: Get Your Service Role Key

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Find the **`service_role`** key (under "Project API keys")
3. Copy it (keep it secret!)

### Step 2: Add to `.env.local`

Add this line to your `.env.local` file:

```env
# Get this from Supabase Dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-actual-service-role-key
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Why This Works

1. **Service Role Key**: Bypasses RLS and handles UUID casting automatically
2. **No Type Errors**: Service role has full database access
3. **Same Security**: Authentication still enforced at API route level
4. **Automatic UUID Handling**: Supabase service role handles string→UUID conversion

## Alternative: Create Database Function (If Service Role Key Doesn't Work)

If adding the service role key doesn't work, we can create a database function:

```sql
-- Run this in Supabase SQL Editor
CREATE OR REPLACE FUNCTION claim_booking(
  booking_id TEXT,
  cleaner_id TEXT,
  claimed_at TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE bookings 
  SET 
    cleaner_id = cleaner_id::UUID,
    cleaner_claimed_at = claimed_at
  WHERE id = booking_id
    AND bookings.cleaner_id IS NULL
    AND status = 'pending'
  RETURNING to_json(bookings.*) INTO result;
  
  RETURN result;
END;
$$;
```

## Expected Result

After adding the service role key and restarting:

1. **Try claiming a booking**
2. **Server logs should show**:
   ```
   ✅ Booking claimed: [booking-id] by [cleaner-name]
   ```
3. **Browser should show**: "✅ Booking claimed successfully!"

## Files Already Fixed

✅ `lib/cleaner-auth.ts` - Uses service role key if available  
✅ `app/api/cleaner/bookings/[id]/claim/route.ts` - Proper error handling  
✅ TypeScript compilation errors resolved

**The missing piece is just the service role key in `.env.local`!**
