# Fix: "Database error saving new user"

## Error Explanation

The error `AuthApiError: Database error saving new user` occurs when trying to sign up because **Email authentication is not enabled** in your Supabase project settings.

## ✅ Solution: Enable Email Auth in Supabase

### Step 1: Go to Supabase Dashboard

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: **shalean-booking-system**
3. Or navigate to: [https://app.supabase.com/project/utfvbtcszzafuoyytlpf](https://app.supabase.com/project/utfvbtcszzafuoyytlpf)

### Step 2: Enable Email Provider

1. Click **Authentication** in the left sidebar
2. Click **Providers** tab
3. Find **Email** in the list
4. Click **Enable**
5. Configure settings:

**Recommended Settings:**
```
✓ Enable Email provider
✓ Confirm email: YES (recommended for production)
  OR
  Disable for development/testing (faster testing)
✓ Secure email change: YES
✓ Email OTP: Optional (one-time password option)
```

### Step 3: Configure Site URL (Important!)

1. Still in **Authentication** section
2. Click **URL Configuration** tab
3. Set these values:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs (Add these):**
```
http://localhost:3000/**
http://localhost:3002/**
http://localhost:3003/**
```

(Multiple ports for dev server flexibility)

**For Production (add later):**
```
https://yourdomain.com/**
```

### Step 4: Configure Email Templates (Optional)

1. Click **Email Templates** tab
2. Customize these templates:
   - **Confirm signup** - Email verification
   - **Invite user** - Team invitations
   - **Magic Link** - Passwordless login
   - **Change Email Address** - Email change confirmation
   - **Reset Password** - Password reset

**Or use defaults** (works fine!)

### Step 5: Save and Test

1. Click **Save** on any changed settings
2. Wait 10-30 seconds for settings to propagate
3. Try signing up again

---

## Quick Test

After enabling Email auth:

### Test Signup:
1. Go to: `http://localhost:3000/signup`
2. Fill form:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: password123
   - Confirm: password123
3. Click "Create Account"
4. **Should see:** "Account created! Check your email..."
5. **Should NOT see:** "Database error saving new user"

### Check Supabase Users:
1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Should see your new user listed
3. Email status shows "unconfirmed" (if email confirmation enabled)

---

## Alternative: Disable Email Confirmation (For Testing)

If you want faster testing without email verification:

### Supabase Dashboard Steps:
1. **Authentication** → **Providers**
2. Click on **Email** provider
3. **Disable** "Confirm email"
4. **Save**

Now users can login immediately after signup (no email verification needed).

**Note:** Re-enable for production!

---

## Troubleshooting

### Still Getting Error?

**Check 1: Email Provider Enabled**
```
Authentication → Providers → Email → Should be toggle ON
```

**Check 2: Site URL Set**
```
Authentication → URL Configuration → Site URL should not be empty
```

**Check 3: Check Logs**
```
Go to: Supabase Dashboard → Logs → Auth
Look for signup attempts and errors
```

**Check 4: Database Access**
```
Go to: Database → Tables → auth.users
Verify table exists and has proper permissions
```

### Common Issues:

**Issue:** "Invalid redirect URL"
**Fix:** Add your localhost URL to Redirect URLs

**Issue:** "Email rate limit exceeded"
**Fix:** Wait a few minutes or disable email confirmation for testing

**Issue:** "User already registered"
**Fix:** User with that email already exists - use different email or login

---

## After Fixing

Once Email auth is enabled:

✅ **Sign Up will work:**
- User account created in `auth.users`
- Email verification sent (if enabled)
- User can verify and login

✅ **Login will work:**
- Users can sign in with credentials
- Session created
- Header shows logged-in state

✅ **Customer Profile Linking works:**
- On first booking after signup
- Profile created with `auth_user_id` linked
- Instant autofill on future bookings

✅ **Guest Checkout still works:**
- No login required
- Email-based profiles
- Can claim by signing up later

---

## Summary

**Problem:** Email authentication not enabled in Supabase
**Solution:** Enable Email provider in Supabase Dashboard
**Time:** ~2 minutes to configure
**Result:** Signup/Login works perfectly

After enabling, the complete auth system will be fully functional! 🎉

