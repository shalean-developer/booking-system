# Booking Flow Testing Guide

Quick guide for testing the fixed booking flow with required database saves and email sending.

---

## Prerequisites

Ensure `.env.local` has all required variables:

```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESEND_API_KEY=re_xxxxxxxxxxxxx
SENDER_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=admin@shalean.co.za
```

---

## Test Scenarios

### ✅ Test 1: Happy Path (All Succeeds)

**Setup:** All environment variables configured correctly

**Steps:**
1. Navigate to `/booking/service/select`
2. Complete all booking steps (service → details → schedule → contact → cleaner → review)
3. Click "Confirm & Pay R[amount]"
4. Use test card: `4084084084084081`, CVV: `408`, Expiry: any future date, PIN: `0000`
5. Complete payment

**Expected Result:**
- ✅ Payment successful
- ✅ Booking saved to Supabase `bookings` table
- ✅ Customer receives confirmation email
- ✅ Admin receives notification email
- ✅ Redirected to `/booking/confirmation`
- ✅ Booking state cleared from localStorage

**Check Logs For:**
```
✅ Step 1: Environment validation passed
✅ Step 2: Booking data parsed
✅ Step 3: Payment re-verified
✅ Step 4: Generated booking ID
✅ Step 5: Booking saved to database
✅ Step 6: Emails sent
✅ Step 7: Booking completed successfully
```

---

### ❌ Test 2: Missing Environment Variable

**Setup:** Remove or comment out `RESEND_API_KEY` from `.env.local`

**Steps:**
1. Restart development server (`npm run dev`)
2. Navigate to `/booking/service/select`
3. Complete all booking steps
4. Click "Confirm & Pay R[amount]"
5. Use test card to complete payment

**Expected Result:**
- ❌ After payment, booking submission fails
- ❌ Error message: "Server configuration error: Required services not configured"
- ❌ Shows technical details: "Missing required environment variable: RESEND_API_KEY"
- ✅ Payment reference displayed for support
- ❌ NO booking in database
- ❌ NO emails sent

**Check Logs For:**
```
❌ Environment validation failed: ['RESEND_API_KEY']
```

---

### ❌ Test 3: Invalid Database Credentials

**Setup:** Change `NEXT_PUBLIC_SUPABASE_URL` to invalid URL

**Steps:**
1. Restart development server
2. Complete booking flow
3. Pay with test card

**Expected Result:**
- ❌ After payment, booking submission fails
- ❌ Error message: "Database error: [Supabase error message]"
- ✅ Payment reference displayed
- ❌ NO booking in database
- ❌ NO emails sent

**Check Logs For:**
```
✅ Step 5: Saving booking to database...
❌ Failed to save booking to database
```

---

### ❌ Test 4: Invalid Email API Key (Rollback Test)

**Setup:** Change `RESEND_API_KEY` to invalid key (e.g., `re_invalid`)

**Steps:**
1. Restart development server
2. Complete booking flow
3. Pay with test card

**Expected Result:**
- ❌ After payment, booking is saved then rolled back
- ❌ Error message: "Email delivery failed: [Resend error message]"
- ✅ Payment reference displayed
- ❌ Booking NOT in database (rolled back)
- ❌ NO emails sent

**Check Logs For:**
```
✅ Step 5: Booking saved to database successfully
❌ Step 6: Email sending failed
⚠️ Rolling back: Deleting booking from database...
✅ Booking successfully rolled back
```

**Verify Rollback:**
Check Supabase `bookings` table - should NOT contain booking with that payment reference.

---

### ❌ Test 5: Payment Declined

**Setup:** All environment variables correct

**Steps:**
1. Complete booking flow
2. Use declined test card: `5060666666666666666`, CVV: `123`, Expiry: any future date

**Expected Result:**
- ❌ Payment fails in Paystack popup
- ✅ User returns to review page
- ❌ NO booking created
- ❌ NO emails sent
- ✅ Can retry payment

---

## Verification Checklist

After each test, verify:

### Database Check (Supabase)
```sql
-- Check for booking
SELECT * FROM bookings 
WHERE payment_reference = '[your-payment-reference]'
ORDER BY created_at DESC;

-- Check booking status
SELECT id, customer_email, status, created_at 
FROM bookings 
WHERE customer_email = '[test-email]'
ORDER BY created_at DESC
LIMIT 5;
```

### Email Check
1. Check customer email inbox
2. Check admin email inbox (or spam folder)
3. Check Resend dashboard for delivery status

### Browser Console Check
1. Open DevTools → Console
2. Look for detailed logs:
   - Payment verification steps
   - Booking submission steps
   - Any error messages

### Server Logs Check
1. Check terminal/console running `npm run dev`
2. Look for step-by-step progress
3. Check for ✅/❌ indicators
4. Review any error stack traces

---

## Manual Rollback Verification

To test rollback manually:

1. **Temporarily break email sending** (change RESEND_API_KEY)
2. **Complete booking and payment**
3. **Check Supabase immediately** - booking should appear briefly
4. **Wait for rollback** (~2-3 seconds)
5. **Check Supabase again** - booking should be deleted
6. **Check server logs** for rollback confirmation

---

## Test Data

### Test Cards (Paystack)

**Success:**
- Card: `4084084084084081`
- CVV: `408`
- Expiry: `12/25` or any future date
- PIN: `0000`

**Decline:**
- Card: `5060666666666666666`
- CVV: `123`
- Expiry: Any future date

**Insufficient Funds:**
- Card: `4084080000000409`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`

### Test Emails

Use temporary email services for testing:
- [TempMail](https://temp-mail.org/)
- [Guerrilla Mail](https://www.guerrillamail.com/)
- [10 Minute Mail](https://10minutemail.com/)

---

## Troubleshooting

### Issue: "Payment service not configured"

**Check:**
1. `.env.local` exists in project root
2. `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set and starts with `pk_`
3. Server was restarted after adding variables

### Issue: "Database error"

**Check:**
1. Supabase URL is correct
2. Supabase anon key is valid
3. Database schema is up to date (run `schema.sql` and `seed.sql`)
4. RLS policies allow public insert on `bookings` table

### Issue: "Email delivery failed"

**Check:**
1. Resend API key is valid
2. Sender email domain is verified in Resend
3. Admin email is a valid email address
4. Resend account is not rate-limited

### Issue: Booking shows in database but no emails

**This should NOT happen** with the new implementation. If it does:
1. Check server logs for rollback errors
2. Manually delete the booking from Supabase
3. Report as critical bug - rollback failed

---

## Expected Console Output (Success)

```
=== PAYMENT SUCCESS HANDLER CALLED ===
Payment reference received: { reference: 'BK-1234567890-abc123' }
Step 1: Starting payment verification...
Step 2: Verification response received
Response status: 200
✅ Step 4: Payment verified successfully, submitting booking...
Step 5: Booking response received
Booking response status: 200
✅ Step 7: Booking successful! Redirecting...
Booking ID: BK-1234567890-abc123
Navigating to /booking/confirmation
```

## Expected Server Output (Success)

```
=== BOOKING API CALLED ===
Timestamp: 2025-10-17T...
Step 1: Validating environment configuration...
✅ Environment validation passed
Step 2: Parsing booking data...
✅ Payment reference found: BK-1234567890-abc123
Step 3: Re-verifying payment with Paystack...
✅ Payment re-verified successfully
Step 4: Generated booking ID: BK-1234567890-abc123
Step 5: Saving booking to database...
✅ Booking saved to database successfully
Step 6: Sending confirmation emails...
✅ Customer confirmation email sent successfully
✅ Admin notification email sent successfully
Step 7: Booking completed successfully
=== BOOKING API SUCCESS ===
```

---

## Automated Testing (Future)

Consider implementing automated tests using:
- Jest + React Testing Library (frontend)
- Supertest (API endpoints)
- Paystack test mode webhooks
- Resend test mode

---

**Last Updated:** October 17, 2025

