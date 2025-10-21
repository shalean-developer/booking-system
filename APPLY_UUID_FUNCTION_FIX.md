# 🔧 Apply UUID Function Fix

## The Issue
Even with the service role key, Supabase is still rejecting the UUID string. We need to create a database function that explicitly casts the string to UUID.

## Quick Fix (2 minutes)

### Step 1: Run the SQL Function in Supabase

1. **Go to Supabase Dashboard** → **SQL Editor**
2. **Create New Query**
3. **Copy and paste this SQL**:

```sql
-- Fix UUID casting for cleaner_id in bookings table
CREATE OR REPLACE FUNCTION claim_booking_safe(
  booking_id_param TEXT,
  cleaner_id_param TEXT,
  claimed_at_param TIMESTAMPTZ
)
RETURNS TABLE(
  id TEXT,
  status TEXT,
  cleaner_id TEXT,
  customer_name TEXT,
  booking_date TEXT,
  booking_time TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_row RECORD;
BEGIN
  -- Update the booking with explicit UUID casting
  UPDATE bookings 
  SET 
    cleaner_id = cleaner_id_param::UUID,
    cleaner_claimed_at = claimed_at_param
  WHERE 
    id = booking_id_param
    AND cleaner_id IS NULL
    AND status = 'pending'
  RETURNING 
    bookings.id,
    bookings.status,
    bookings.cleaner_id::TEXT,
    bookings.customer_name,
    bookings.booking_date,
    bookings.booking_time
  INTO result_row;
  
  -- Return the updated row
  RETURN QUERY SELECT 
    result_row.id,
    result_row.status,
    result_row.cleaner_id,
    result_row.customer_name,
    result_row.booking_date,
    result_row.booking_time;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION claim_booking_safe(TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION claim_booking_safe(TEXT, TEXT, TIMESTAMPTZ) TO anon;
```

4. **Click RUN**

### Step 2: Test the Fix

1. **Go to your cleaner dashboard**: `http://localhost:3001/cleaner/login`
2. **Login as a cleaner**
3. **Go to Available Jobs tab**
4. **Click "Claim Job"**

## Expected Result

The server logs should now show:
```
📞 Claim booking API called
✅ Cleaner authenticated: [Name] [ID]
🎯 Booking ID: [id]
🔌 Supabase client created
📋 Booking found: {...}
🔄 Attempting to claim booking...
✅ Booking claimed: [booking-id] by [cleaner-name]
```

Instead of the UUID type error!

## What This Does

The `claim_booking_safe` function:
1. **Explicitly casts** `cleaner_id_param::UUID` to handle the type conversion
2. **Uses SECURITY DEFINER** to run with elevated privileges
3. **Returns the updated booking** data
4. **Handles race conditions** by checking `cleaner_id IS NULL` and `status = 'pending'`

This bypasses the Supabase client's type checking and handles UUID casting at the database level.

## Files Modified

✅ `app/api/cleaner/bookings/[id]/claim/route.ts` - Now uses `claim_booking_safe` function
✅ `supabase/migrations/fix-uuid-casting.sql` - Database function definition

**After running the SQL, the Claim Job button should work perfectly!** 🎯
