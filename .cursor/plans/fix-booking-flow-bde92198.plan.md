<!-- bde92198-a84e-4991-9e13-bbaa5dc0db3c 1514192f-51b9-41da-b7ae-69d22a63bc31 -->
# Fix Booking Flow - Required DB & Email

## Current Problems

The booking flow has critical issues:

1. **Database save failures don't fail the booking** - continues silently
2. **Email send failures don't fail the booking** - continues silently  
3. **Missing environment variable validation** - fails at runtime instead of startup
4. **No proper error handling** - user gets success message even when booking wasn't saved

## Required Flow

After payment verification:

1. ✅ Verify payment with Paystack
2. ✅ **Save booking to database** (MUST succeed or fail entire booking)
3. ✅ **Send customer confirmation email** (MUST succeed or rollback)
4. ✅ **Send admin notification email** (MUST succeed or rollback)
5. ✅ Redirect to confirmation page

## Changes Required

### 1. Update Booking API (`app/api/bookings/route.ts`)

**Remove optional/graceful failure logic:**

- Remove "database save optional" logic (lines 84-130)
- Remove "email optional" logic (lines 134-196)
- Make both operations REQUIRED

**Add proper validation:**

```typescript
// Validate required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  return NextResponse.json(
    { ok: false, error: 'Database not configured' },
    { status: 500 }
  );
}

if (!process.env.RESEND_API_KEY) {
  return NextResponse.json(
    { ok: false, error: 'Email service not configured' },
    { status: 500 }
  );
}
```

**Make database save required:**

```typescript
// Save to database (REQUIRED)
const { data: bookingData, error: bookingError } = await supabase
  .from('bookings')
  .insert({...})
  .select();

if (bookingError) {
  console.error('Failed to save booking:', bookingError);
  throw new Error(`Database error: ${bookingError.message}`);
}
```

**Make emails required with rollback:**

```typescript
try {
  // Send customer email (REQUIRED)
  await sendEmail(customerEmailData);
  
  // Send admin email (REQUIRED)
  await sendEmail(adminEmailData);
} catch (emailError) {
  // Rollback: Delete the booking from database
  await supabase.from('bookings').delete().eq('id', bookingId);
  
  throw new Error(`Email failed: ${emailError.message}`);
}
```

### 2. Add Environment Variable Validation

Create `lib/env-validation.ts`:

```typescript
export function validateBookingEnv() {
  const required = {
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  return { valid: missing.length === 0, missing };
}
```

### 3. Improve Error Messages

Update frontend (`components/step-review.tsx`):

- Add better error display for configuration issues
- Show specific error messages from backend
- Add retry mechanism for transient failures

### 4. Add Logging & Monitoring

Enhance logging in booking API:

- Log each critical step with timestamps
- Log full error details for debugging
- Add success confirmation logs

## Files to Modify

1. `app/api/bookings/route.ts` - Make DB/email required, add rollback
2. `lib/env-validation.ts` - NEW file for environment validation
3. `components/step-review.tsx` - Better error handling
4. `app/api/payment/verify/route.ts` - Add env validation

## Testing Checklist

- [ ] Payment succeeds → booking saved → emails sent → redirect works
- [ ] Payment fails → no booking saved → user sees error
- [ ] Payment succeeds but DB fails → user sees error, no email sent
- [ ] Payment succeeds, DB works but email fails → booking deleted, user sees error
- [ ] Missing environment variables → clear error message before payment

### To-dos

- [ ] Create lib/env-validation.ts with environment variable validation helper
- [ ] Update app/api/bookings/route.ts to make database save and email sending required operations with proper error handling and rollback
- [ ] Add environment validation to app/api/payment/verify/route.ts
- [ ] Improve error handling and messages in components/step-review.tsx
- [ ] Test complete booking flow with various failure scenarios