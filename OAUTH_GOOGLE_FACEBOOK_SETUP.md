# OAuth Setup Guide: Google & Facebook Sign-In

This guide explains how to configure Google and Facebook OAuth providers in Supabase so users can sign in with their social media accounts.

## ✅ Code Implementation (Already Complete)

The OAuth functionality has been implemented in `components/auth-modal.tsx`. Users can click "Continue with Google" or "Continue with Facebook" buttons, which will:
- Redirect to the provider's login page
- Handle authentication
- Redirect back to `/dashboard` after successful login

**However, you need to configure the OAuth providers in Supabase Dashboard before it will work.**

---

## Step-by-Step Setup Instructions

### Part 1: Configure Google OAuth

#### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in App information:
     - App name: `Shalean Cleaning Services`
     - User support email: `info@shalean.co.za`
     - Developer contact: `info@shalean.co.za`
   - Click **Save and Continue**
   - Skip scopes (click **Save and Continue**)
   - Add test users if needed (for testing)
   - Click **Save and Continue** → **Back to Dashboard**

6. Back in **Credentials**, click **+ CREATE CREDENTIALS** → **OAuth client ID**
7. Select **Web application**
8. Configure OAuth client:
   - **Name**: `Shalean Web Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://shalean.co.za` (for production)
   - **Authorized redirect URIs**:
     - `https://utfvbtcszzafuoyytlpf.supabase.co/auth/v1/callback`
     - `https://shalean.co.za/auth/v1/callback` (if using custom domain)
   - Click **CREATE**

9. **IMPORTANT**: Copy the following values:
   - **Client ID** (looks like: `123456789-abcdefgh.apps.googleusercontent.com`)
   - **Client Secret** (click "Show" and copy it)

#### Step 2: Configure Google in Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com/project/utfvbtcszzafuoyytlpf)
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list and click it
4. Toggle **Enable Google provider** to ON
5. Fill in:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
6. Click **Save**

**Google OAuth is now configured! ✅**

---

### Part 2: Configure Facebook OAuth

#### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Select **Consumer** app type
4. Fill in:
   - **App Name**: `Shalean Cleaning Services`
   - **App Contact Email**: `info@shalean.co.za`
   - Click **Create App**

5. In the app dashboard, go to **Settings** → **Basic**
6. Click **+ Add Platform** → **Website**
7. Fill in:
   - **Site URL**: 
     - Development: `http://localhost:3000`
     - Production: `https://shalean.co.za`
8. Save changes

9. Go to **Facebook Login** → **Settings**
10. Add **Valid OAuth Redirect URIs**:
    - `https://utfvbtcszzafuoyytlpf.supabase.co/auth/v1/callback`
    - `https://shalean.co.za/auth/v1/callback` (if using custom domain)
11. Click **Save Changes**

12. **IMPORTANT**: Copy the following values from **Settings** → **Basic**:
    - **App ID** (looks like: `1234567890123456`)
    - **App Secret** (click "Show" and copy it)

#### Step 2: Configure Facebook in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find **Facebook** in the list and click it
3. Toggle **Enable Facebook provider** to ON
4. Fill in:
   - **Client ID (for OAuth)**: Paste your Facebook App ID
   - **Client Secret (for OAuth)**: Paste your Facebook App Secret
5. Click **Save**

**Facebook OAuth is now configured! ✅**

---

## Step 3: Configure Redirect URLs (Important!)

You need to ensure Supabase knows where to redirect users after OAuth sign-in.

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Verify **Site URL**:
   - Development: `http://localhost:3000`
   - Production: `https://shalean.co.za`
3. Add **Redirect URLs** (add each on a new line):
   ```
   http://localhost:3000/**
   https://shalean.co.za/**
   http://localhost:3000/dashboard
   https://shalean.co.za/dashboard
   ```
4. Click **Save**

---

## Testing OAuth Sign-In

### Development Testing

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click the **Sign In** button (top right)
4. Click **Continue with Google** or **Continue with Facebook**
5. You should be redirected to Google/Facebook login
6. After logging in, you'll be redirected back to `/dashboard`

### Production Testing

1. Deploy your application to production
2. Update OAuth redirect URIs in Google/Facebook to include production URLs
3. Test the sign-in flow on your live site

---

## Troubleshooting

### "Redirect URI mismatch" Error

**Problem**: OAuth provider says the redirect URI doesn't match.

**Solution**:
- Verify the redirect URI in Google/Facebook matches exactly:
  - Supabase project: `https://utfvbtcszzafuoyytlpf.supabase.co/auth/v1/callback`
- Check for typos, missing `https://`, or trailing slashes
- For custom domains, ensure you've configured the custom domain in Supabase

### OAuth Not Working After Setup

**Checklist**:
1. ✅ Provider is enabled in Supabase Dashboard
2. ✅ Client ID and Secret are correctly entered (no extra spaces)
3. ✅ Redirect URIs are added to both Supabase and OAuth provider
4. ✅ Site URL is configured in Supabase
5. ✅ OAuth consent screen is published (Google) or app is live (Facebook)

### User Redirected to Wrong Page

**Solution**:
- The OAuth flow redirects to `/dashboard` by default
- You can customize this in `components/auth-modal.tsx` by changing:
  ```typescript
  const redirectTo = `${window.location.origin}/dashboard`;
  ```

### Facebook App in "Development Mode"

**Problem**: Facebook apps start in development mode and only allow test users.

**Solution for Production**:
1. Go to Facebook App Dashboard
2. Navigate to **App Review** → **Permissions and Features**
3. Request permissions you need (e.g., `email`, `public_profile`)
4. Submit for review (or switch app to "Live" mode if permissions are approved)

---

## Security Considerations

### Environment Variables

OAuth credentials are stored securely in Supabase Dashboard. You don't need to add them to your `.env.local` file.

### Production Checklist

Before going live:
- [ ] Switch Facebook app from Development to Live mode
- [ ] Publish Google OAuth consent screen
- [ ] Update all redirect URIs to production URLs
- [ ] Remove development/localhost URLs from production OAuth apps
- [ ] Test OAuth flow on production domain
- [ ] Verify redirect URLs in Supabase match your production domain

---

## How It Works

1. **User clicks "Continue with Google/Facebook"**
   - The `handleOAuthSignIn` function is called
   - Supabase `signInWithOAuth()` is invoked

2. **User is redirected to provider**
   - Google or Facebook login page opens
   - User authenticates with their account

3. **Provider redirects back to Supabase**
   - OAuth provider sends user back to Supabase callback URL
   - Supabase exchanges the OAuth code for an access token

4. **Supabase creates/updates user session**
   - If new user: Creates auth user in Supabase
   - If existing user: Updates session
   - Session is stored securely

5. **User redirected to dashboard**
   - Supabase redirects to the `redirectTo` URL (`/dashboard`)
   - User is now signed in and can access protected pages

---

## Code Reference

### Location: `components/auth-modal.tsx`

```typescript
const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
  const redirectTo = `${window.location.origin}/dashboard`;
  
  await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });
};
```

This function handles the OAuth sign-in flow. Supabase manages the entire OAuth process, including token exchange and session management.

---

## Next Steps

After configuring OAuth:

1. **Test both providers** (Google and Facebook)
2. **Link customer profiles** - Consider updating the customer linking API to work with OAuth users
3. **Customize OAuth scopes** (optional) - Request additional permissions if needed
4. **Add more providers** (optional) - GitHub, Twitter, etc.

---

## Support

If you encounter issues:

1. Check Supabase logs: **Logs** → **Auth** in Supabase Dashboard
2. Check browser console for errors
3. Verify OAuth provider settings match Supabase configuration
4. Ensure redirect URIs are exactly correct (case-sensitive, no trailing slashes)

---

**Status**: ✅ Code Implementation Complete  
**Next Step**: Configure OAuth providers in Supabase Dashboard using this guide

