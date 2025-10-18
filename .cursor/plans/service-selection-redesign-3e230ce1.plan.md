<!-- 3e230ce1-13b6-4fd6-95ab-cc5aa6558b3e cbcfe9f6-401a-45a6-906d-2ccfdbb1a417 -->
# Supabase Auth Integration with Customer Profiles

## Overview

Add optional Supabase Auth integration that links customer profiles to authenticated users when available, while maintaining full guest checkout functionality for users who prefer not to log in.

## Database Changes

### 1. Update `customers` table

**File:** `supabase/add-auth-to-customers.sql`

```sql
-- Add auth_user_id column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- Create index for auth user lookups
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id ON customers(auth_user_id);

-- Make email unique constraint optional when auth_user_id exists
-- (authenticated users can have multiple emails, use auth_user_id as primary)
-- Note: Keep email unique for non-auth users (guest checkout)

COMMENT ON COLUMN customers.auth_user_id IS 'Links customer profile to Supabase Auth user if authenticated (NULL for guest checkout)';
```

## Helper Functions

### 2. Create Auth Helper

**File:** `lib/auth.ts` (NEW)

**Purpose:** Check if user is authenticated and get user ID

**Functions:**

- `getAuthUser()` - Get current authenticated user
- `isAuthenticated()` - Check if user is logged in
- Client-side and server-side compatible

## API Updates

### 3. Update Customer API

**File:** `app/api/customers/route.ts`

**Changes:**

**GET endpoint:**

- Check for authenticated user
- If authenticated, query by `auth_user_id` first
- If not found, fallback to email query
- Return profile with auth status

**POST endpoint:**

- Check for authenticated user
- If authenticated, link profile to auth_user_id
- If not authenticated, create guest profile (auth_user_id = NULL)
- Handle duplicate prevention

**Logic:**

```typescript
// Check auth first
const authUser = await getAuthUser(request);

if (authUser) {
  // Check by auth_user_id
  const profile = await getProfileByAuthId(authUser.id);
  if (profile) return profile;
}

// Fallback to email check (guest or new auth user)
const profile = await getProfileByEmail(email);
```

### 4. Update Bookings API

**File:** `app/api/bookings/route.ts`

**Changes in Step 4a:**

```typescript
// Check if user is authenticated
const authUser = await getAuthUser(request);

// Look for customer profile
if (authUser) {
  // Try auth_user_id first
  const customer = await getProfileByAuthId(authUser.id);
  if (customer) {
    customerId = customer.id;
  }
}

// Fallback to email check (existing logic)
if (!customerId) {
  const customer = await getProfileByEmail(body.email);
  // ... existing logic
}

// When creating profile
const newProfile = {
  ...customerData,
  auth_user_id: authUser?.id || null  // Link if authenticated
};
```

## Frontend Updates

### 5. Update Contact Step

**File:** `components/step-contact.tsx`

**Minimal changes:**

- Profile check works same way
- Autofill works same way
- Auth happens transparently in backend
- No UI changes needed (guest checkout still works)

**Optional enhancement:**

- Show "Logged in as {user.email}" badge if authenticated
- Show "Guest checkout" indicator if not authenticated

## User Flows

### Authenticated User Flow

**Scenario 1: First-time authenticated user**

1. User logs in (separate login page/flow)
2. Navigates to booking
3. Enters email in Contact form
4. System checks: auth_user_id has no profile yet
5. Shows autofill prompt if email matches existing guest profile
6. Or creates new profile linked to auth_user_id
7. Profile automatically linked to auth account

**Scenario 2: Returning authenticated user**

1. User logs in
2. Navigates to booking
3. Contact step loads
4. System detects auth, queries by auth_user_id
5. Auto-autofills immediately (no email entry needed)
6. User can edit and proceed

### Guest Checkout Flow (Unchanged)

1. User doesn't log in (guest)
2. Navigates to booking
3. Enters email in Contact form
4. System checks by email only
5. Autofill if email found (guest profile)
6. Or creates new guest profile (auth_user_id = NULL)
7. Works exactly as before

## Auth Detection Strategy

### Option A: Cookie-based (Recommended)

- Supabase Auth uses cookies
- Server can read auth state
- No client-side auth needed
- Works in API routes

### Option B: Session-based

- Client gets session
- Passes to API via header
- More complex but flexible

### Implementation (Option A)

```typescript
// lib/auth.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getAuthUser() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
```

## Benefits

### For Authenticated Users

✅ **Automatic profile linking** - No manual linking needed

✅ **Instant autofill** - Profile loads without email entry

✅ **Secure** - Tied to auth account

✅ **Order history** - Easy to query by auth_user_id

✅ **Account management** - Can view/edit profile

### For Guest Users

✅ **No login required** - Frictionless checkout

✅ **Email-based** - Profile still works

✅ **Can convert** - Guest profile can be claimed by auth user

✅ **No barriers** - Complete booking without account

### For Business

✅ **Optional auth** - No forced registration

✅ **Higher conversion** - Guest checkout available

✅ **Auth benefits** - When users do auth

✅ **Profile consolidation** - Auth users link to guest profiles

✅ **Better analytics** - Track auth vs guest bookings

## Migration Strategy

### Guest Profile → Auth Profile

When authenticated user has same email as guest profile:

1. Check for guest profile by email
2. Link guest profile to auth_user_id
3. User gets all their booking history
4. Seamless migration
```sql
-- Link guest profile to auth user
UPDATE customers
SET auth_user_id = 'auth-user-uuid'
WHERE email = 'user@example.com'
  AND auth_user_id IS NULL;
```


## No Breaking Changes

✅ **Guest checkout preserved** - Works exactly as before

✅ **Auth optional** - No forced login

✅ **Backwards compatible** - auth_user_id is nullable

✅ **API unchanged** - Just enhanced with auth

✅ **Frontend unchanged** - Transparent auth detection

## Files to Create

1. `supabase/add-auth-to-customers.sql` - Add auth_user_id column
2. `lib/auth.ts` - Auth helper functions

## Files to Modify

1. `app/api/customers/route.ts` - Add auth user detection and linking
2. `app/api/bookings/route.ts` - Add auth user detection
3. `components/step-contact.tsx` - Optional: Show auth status badge

## Optional: Login UI

If you want users to authenticate:

- Create `/app/login/page.tsx` with Supabase Auth UI
- Add login/logout buttons to header
- Add session management
- Optional for this implementation (can add later)

## Priority

**Phase 1 (This implementation):**

- Add database column
- Add auth detection in APIs
- Automatic linking when auth present
- Guest checkout still works

**Phase 2 (Future):**

- Add login UI
- User account dashboard
- Order history page
- Profile management page

### To-dos

- [ ] Create add-auth-to-customers.sql to add auth_user_id column
- [ ] Create lib/auth.ts with auth detection functions
- [ ] Update app/api/customers/route.ts to detect and link auth users
- [ ] Update app/api/bookings/route.ts to check auth before profile creation
- [ ] Optional: Add auth status badge to Contact step