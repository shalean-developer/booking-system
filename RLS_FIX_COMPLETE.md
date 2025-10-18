# RLS Policy Fix - COMPLETE ✅

## Problem
After enabling RLS on the `pricing_config` table, you were getting this error:
```
new row violates row-level security policy for table "pricing_config"
```

## Root Cause
The issue was that the `lib/pricing-db.ts` file was using the **client-side Supabase instance** which doesn't have the authenticated user's JWT token. The RLS policies require `auth.uid()` and `auth.jwt()` to verify admin access, but these are only available when using the **server-side authenticated Supabase client**.

## The Fix
I've updated the code to pass the authenticated Supabase client from the API route to the database functions:

### Changes Made:

1. **`lib/pricing-db.ts`** - Updated all write functions to accept an optional `client` parameter:
   - `savePricing(pricing, userId, client?)` 
   - `scheduleFuturePrice(pricing, effectiveDate, userId, client?)`
   - `deactivatePricing(pricingId, client?)`

2. **`app/api/admin/pricing/route.ts`** - Updated all route handlers to pass the authenticated client:
   - Added `import { createClient }` from `@/lib/supabase-server`
   - Removed the old import of the unauthenticated `supabase` client
   - Each route now creates an authenticated client with `const supabase = await createClient()`
   - Passes this authenticated client to the pricing database functions

## How It Works Now

```typescript
// Before (WRONG - no auth context)
import { supabase } from '@/lib/supabase';
await supabase.from('pricing_config').insert(data); // ❌ RLS blocks this

// After (CORRECT - has auth context)
const supabase = await createClient(); // Gets authenticated user's session
await supabase.from('pricing_config').insert(data); // ✅ RLS allows this for admins
```

## What to Test

1. **Save Pricing (Immediate)**:
   - Go to Admin Dashboard → Pricing Section
   - Edit a service price (e.g., Standard Cleaning)
   - Click "Save Now"
   - ✅ Should save successfully without RLS error

2. **Schedule Future Pricing**:
   - Edit a service price
   - Set a future date in the schedule field
   - Click "Schedule"
   - ✅ Should schedule successfully

3. **Verify RLS is Still Active**:
   - Open browser console and try to manually insert without auth:
   ```javascript
   // This should fail (RLS blocking public access)
   const { data, error } = await supabase
     .from('pricing_config')
     .insert({ price_type: 'base', price: 100 });
   console.log(error); // Should show RLS policy error
   ```

## Files Modified
- ✅ `lib/pricing-db.ts` - Added `client` parameter to write functions
- ✅ `app/api/admin/pricing/route.ts` - Use authenticated client for all operations

## SQL Policies (Already Applied)
The RLS policies in `supabase/APPLY_RLS_FIX_NOW.sql` are correct:
- ✅ Public can SELECT active pricing (for booking flow)
- ✅ Admins can SELECT all pricing
- ✅ Admins can INSERT new pricing
- ✅ Admins can UPDATE pricing
- ✅ Admins can DELETE pricing

## Why This Fix Works
The authenticated Supabase client created with `createClient()` from `@/lib/supabase-server` includes the user's JWT token in the request. When the RLS policy checks `auth.jwt()->'user_metadata'->>'role'`, it can now see that the user has the 'admin' role and allows the operation.

## No Breaking Changes
The functions are backward compatible - they still work without the `client` parameter (falling back to the default client). However, for admin operations, they now receive the authenticated client and work properly with RLS enabled.

---

**Status**: ✅ FIXED - You can now save pricing changes in the admin dashboard with RLS enabled!

