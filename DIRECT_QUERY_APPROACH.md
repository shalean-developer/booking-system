# Direct Query Approach - UUID Fix

## What I've Done

Reverted the code back to use direct `.update()` query instead of the non-existent `claim_booking_safe()` RPC function.

## Why This Should Work

1. **Service Role Key**: Your `.env.local` has `SUPABASE_SERVICE_ROLE_KEY` which should handle UUID casting automatically
2. **Direct Update**: Using standard Supabase `.update()` method
3. **Type Assertions**: The `as any` assertions should bypass TypeScript strict checking

## Code Changes Made

**File**: `app/api/cleaner/bookings/[id]/claim/route.ts`

Reverted from:
```typescript
const { data: updatedBooking, error: updateError } = await supabase
  .rpc('claim_booking_safe', {
    booking_id_param: bookingId,
    cleaner_id_param: session.id,
    claimed_at_param: new Date().toISOString()
  })
  .single();
```

Back to:
```typescript
const { data: updatedBooking, error: updateError } = await supabase
  .from('bookings')
  .update({
    cleaner_id: session.id,
    cleaner_claimed_at: new Date().toISOString(),
  })
  .eq('id', bookingId)
  .is('cleaner_id', null)
  .select()
  .single();
```

## Test This Now

1. **Try claiming a booking again**
2. **Check the server terminal** for any error messages

## If This Still Fails

If you still get the UUID type error, then we'll need to implement **Solution A** (create the database function) as it's the only reliable way to handle UUID casting.

## Expected Result

The server logs should show:
```
📞 Claim booking API called
✅ Cleaner authenticated: [Name] [ID]
🎯 Booking ID: [id]
🔌 Supabase client created
📋 Booking found: {...}
🔄 Attempting to claim booking...
✅ Booking claimed: [booking-id] by [cleaner-name]
```

**Try claiming a booking now and let me know what happens!**
