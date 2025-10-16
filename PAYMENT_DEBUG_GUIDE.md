# Payment Flow Debugging Guide

## Overview

Comprehensive logging has been added to help identify where the payment flow is breaking. This guide explains what to look for in the console.

## How to Debug

### 1. Open Browser Console

**Chrome/Edge/Brave:**
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
- Click the "Console" tab

**Firefox:**
- Press `F12` or `Ctrl+Shift+K` (Windows/Linux) or `Cmd+Option+K` (Mac)
- Click the "Console" tab

### 2. Open Server Logs

In your terminal where `npm run dev` is running, you'll see server-side logs.

## Expected Flow

### When Payment Button is Clicked

**Browser Console:**
```
=== CONFIRM & PAY BUTTON CLICKED ===
Public key configured: true
Amount to charge: 35000 kobo (R350)
Customer email: customer@example.com
Payment reference: BK-1729099234567-abc123def
Opening Paystack payment popup...
```

**What to check:**
- ✅ Public key should be `true`
- ✅ Amount should be correct (amount × 100 for kobo)
- ✅ Email should match customer email
- ✅ Payment reference should be generated

**If you see:**
- `Public key configured: false` → Add `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` to `.env.local` and restart server

### When Payment Succeeds

**Browser Console:**
```
=== PAYMENT SUCCESS HANDLER CALLED ===
Payment reference received: { reference: "BK-1729099234567-abc123def", ... }
Step 1: Starting payment verification...
Reference to verify: BK-1729099234567-abc123def
```

### During Payment Verification

**Browser Console:**
```
Step 2: Verification response received
Response status: 200
Response ok: true
Step 3: Verification result parsed: { ok: true, data: {...}, message: "..." }
```

**Server Console:**
```
=== PAYMENT VERIFICATION API CALLED ===
Request body: { reference: "BK-1729099234567-abc123def" }
Verifying payment reference: BK-1729099234567-abc123def
Paystack secret key found, length: 48
Calling Paystack API: https://api.paystack.co/transaction/verify/BK-...
Paystack API response status: 200
Paystack API response ok: true
✅ Payment verified successfully: BK-1729099234567-abc123def
Amount: 350 ZAR
Customer: customer@example.com
Returning success response: { ok: true, ... }
```

**What to check:**
- ✅ Response status should be `200`
- ✅ `ok` should be `true`
- ✅ Amount and customer email should be correct

**If you see:**
- `Response status: 500` → Server error, check server logs
- `Response status: 400` → Bad request, check if secret key is correct
- `ok: false` → Payment verification failed, check Paystack dashboard

### During Booking Submission

**Browser Console:**
```
Step 4: Payment verified successfully, submitting booking...
Booking payload: { service: "Standard", firstName: "John", ... }
Step 5: Booking response received
Booking response status: 200
Booking response ok: true
Step 6: Booking result parsed: { ok: true, bookingId: "...", emailSent: true }
Step 7: Booking successful! Redirecting...
Booking ID: BK-1729099234567-abc123def
Email sent: true
Navigating to /booking/confirmation
```

**Server Console:**
```
=== BOOKING API CALLED ===
Timestamp: 2025-10-16T10:30:00.000Z
=== BOOKING SUBMISSION ===
Service: Standard
Customer: John Doe
Email: customer@example.com
Payment Reference: BK-1729099234567-abc123def
✅ Payment reference found: BK-1729099234567-abc123def
Re-verifying payment with Paystack...
✅ Payment re-verified successfully: BK-1729099234567-abc123def
📝 Booking ID: BK-1729099234567-abc123def
=== EMAIL SENDING ATTEMPT ===
RESEND_API_KEY configured: true
📧 Generating customer email...
✅ Customer email generated successfully
📤 Sending customer email...
✅ Customer confirmation email sent successfully
📧 Generating admin email...
✅ Admin email generated successfully
📤 Sending admin email...
✅ Admin notification email sent successfully
Email sending completed. Success: true
=== BOOKING API RESPONSE ===
{
  "ok": true,
  "bookingId": "BK-1729099234567-abc123def",
  "message": "Booking received successfully. Confirmation email sent!",
  "emailSent": true,
  "emailError": null
}
===========================
```

**What to check:**
- ✅ Payment reference should be present
- ✅ Re-verification should succeed
- ✅ Emails should be generated and sent
- ✅ Final response should have `ok: true`

## Common Issues & Solutions

### Issue 1: Payment Popup Doesn't Open

**Symptoms:**
```
Public key configured: false
```

**Solution:**
1. Check `.env.local` has `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...`
2. Restart dev server: Stop (`Ctrl+C`) and run `npm run dev`
3. Hard refresh browser: `Ctrl+Shift+R` or `Cmd+Shift+R`

### Issue 2: Payment Verification Fails

**Browser Console:**
```
Response status: 500
Response ok: false
```

**Server Console:**
```
PAYSTACK_SECRET_KEY not configured in environment
```

**Solution:**
1. Add `PAYSTACK_SECRET_KEY=sk_test_...` to `.env.local`
2. Restart dev server
3. Try payment again

### Issue 3: Booking Submission Fails

**Server Console:**
```
❌ Payment reference missing in booking submission
```

**Solution:**
This shouldn't happen if verification succeeds. Check browser console for errors in Step 4.

### Issue 4: Emails Not Sending

**Server Console:**
```
⚠️ RESEND_API_KEY not configured, skipping email sending
```

**Solution:**
1. Get API key from https://resend.com/api-keys
2. Add to `.env.local`:
   ```env
   RESEND_API_KEY=re_...
   SENDER_EMAIL=onboarding@resend.dev
   ADMIN_EMAIL=admin@shalean.com
   ```
3. Restart dev server

**Note:** Booking will still work without emails! Redirect should still happen.

### Issue 5: No Redirect to Confirmation

**Browser Console - Check for:**
```
Step 7: Booking successful! Redirecting...
Navigating to /booking/confirmation
```

**If you see this but still no redirect:**
1. Check if there's a navigation blocker
2. Check browser console for React errors
3. Try manually visiting `/booking/confirmation`

**If you DON'T see Step 7:**
1. Look for error messages before Step 7
2. Check if `bookingResult.ok` is `false`
3. Check server logs for booking API errors

## Testing Steps

1. **Open Both Consoles**
   - Browser console (F12)
   - Server terminal

2. **Complete Booking Flow**
   - Go through all 5 steps
   - Click "Confirm & Pay"

3. **Watch Console Logs**
   - Follow the numbered steps
   - Note where it stops/fails

4. **Check Each Checkpoint:**
   - ✅ Payment button clicked
   - ✅ Payment popup opened
   - ✅ Payment completed
   - ✅ Verification started (browser)
   - ✅ Verification API called (server)
   - ✅ Verification succeeded
   - ✅ Booking submission started (browser)
   - ✅ Booking API called (server)
   - ✅ Payment re-verified (server)
   - ✅ Booking ID generated (server)
   - ✅ Emails attempted (server)
   - ✅ Response returned (server)
   - ✅ Response received (browser)
   - ✅ Redirect initiated (browser)

## Quick Checklist

Before testing, verify:

- [ ] `.env.local` exists in project root
- [ ] `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` set
- [ ] `PAYSTACK_SECRET_KEY` set
- [ ] `RESEND_API_KEY` set (optional, for emails)
- [ ] Dev server restarted after adding keys
- [ ] Browser console open (F12)
- [ ] Server terminal visible

## Test Card

Use Paystack test card:
- Card: `4084084084084081`
- CVV: `408`
- Expiry: `12/25`
- PIN: `0000`
- OTP: `123456`

## Next Steps

1. **Run through the flow once** with both consoles open
2. **Copy the console logs** (right-click → Save as or screenshot)
3. **Identify where it stops** using this guide
4. **Check the specific solution** for that step
5. **If still stuck**, share the console logs for further debugging

## Need Help?

Include in your debug report:
- Screenshot of browser console
- Copy of server console logs
- Which step it stops at
- Your `.env.local` keys (first/last 4 characters only)

---

**Debugging Mode Active**: All files now have comprehensive logging enabled.

