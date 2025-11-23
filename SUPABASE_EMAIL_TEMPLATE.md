# Customize Supabase Email Confirmation for Shalean

This guide will help you customize the Supabase "Confirm your signup" email template with Shalean branding.

## Quick Overview

You'll customize:
1. ✅ **Sender Email**: Change from `noreply@mail.app.supabase.io` to your domain (e.g., `noreply@shalean.co.za`)
2. ✅ **Subject Line**: Update to "Confirm your Shalean account"
3. ✅ **Email Template**: Replace with Shalean-branded HTML template
4. ✅ **Verification Link Domain**: Customize to use `auth.shalean.co.za` instead of `utfvbtcszzafuoyytlpf.supabase.co` (optional, requires custom domain setup)

**Location:** Supabase Dashboard → `Authentication` → `Email Templates` → `Confirm signup`

## Step-by-Step Instructions

### 1. Navigate to Supabase Dashboard

1. Go to: [https://app.supabase.com/project/utfvbtcszzafuoyytlpf](https://app.supabase.com/project/utfvbtcszzafuoyytlpf)
2. Or navigate manually:
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project: **shalean-booking-system**

### 2. Access Email Templates

1. In the left sidebar, click **Authentication**
2. Click the **Email Templates** tab
3. Select **Confirm signup** from the template list

### 3. Change Sender Email Address

To change the sender from "Auth<noreply@mail.app.supabase.io>" to your own email:

**Option A: Using Custom SMTP (Recommended for Custom Domain)**

1. In Supabase Dashboard, go to **Authentication** → **Email Templates**
2. Scroll down to find **SMTP Settings** section
3. Enable **Custom SMTP** (if you have your own SMTP server)
4. Fill in the SMTP configuration fields (see examples below)
5. Click **Save**

### SMTP Configuration Examples

#### Gmail / Google Workspace

If you're using Gmail or Google Workspace (e.g., `noreply@shalean.co.za` on Google Workspace):

```
Host: smtp.gmail.com
Port: 587
User: noreply@shalean.co.za (or your Gmail address)
Password: [Your Gmail password or App Password]
Sender Email: noreply@shalean.co.za
Sender Name: Shalean Cleaning Services
```

**Important for Gmail:**
- Enable 2-Step Verification on your Google account
- Create an **App Password** (not your regular password):
  1. Go to Google Account → Security → 2-Step Verification → App passwords
  2. Generate a new app password for "Mail"
  3. Use this app password in Supabase (not your regular password)

#### Microsoft 365 / Outlook

If you're using Microsoft 365 or Outlook:

```
Host: smtp.office365.com
Port: 587
User: noreply@shalean.co.za (your Microsoft 365 email)
Password: [Your Microsoft 365 password]
Sender Email: noreply@shalean.co.za
Sender Name: Shalean Cleaning Services
```

#### SendGrid (Email Service Provider)

If you're using SendGrid for better deliverability:

```
Host: smtp.sendgrid.net
Port: 587
User: apikey
Password: [Your SendGrid API Key - starts with SG.]
Sender Email: noreply@shalean.co.za
Sender Name: Shalean Cleaning Services
```

**Setup SendGrid:**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Verify your domain (`shalean.co.za`)
3. Create an API key
4. Use `apikey` as the username and your API key as the password

#### Mailgun (Email Service Provider)

If you're using Mailgun:

```
Host: smtp.mailgun.org
Port: 587
User: [Your Mailgun SMTP username]
Password: [Your Mailgun SMTP password]
Sender Email: noreply@shalean.co.za
Sender Name: Shalean Cleaning Services
```

#### Generic SMTP Server

For other email providers or custom SMTP servers:

```
Host: your.smtp.host.com (replace with your actual SMTP server)
Port: 587 (or 465 for SSL)
User: your-email@shalean.co.za
Password: your-email-password
Sender Email: noreply@shalean.co.za
Sender Name: Shalean Cleaning Services
```

**Port Options:**
- **Port 587**: STARTTLS (most common, recommended)
- **Port 465**: SSL/TLS (legacy, still supported)
- **Port 25**: Usually blocked by ISPs, not recommended

**Security:**
- Always use encryption (STARTTLS or SSL)
- Never use port 25 unless absolutely necessary
- Consider using an App Password instead of your main password

**Option B: Using Default SMTP with Custom Sender (Simpler)**

1. In **Authentication** → **Email Templates**
2. Look for **Email Sender** or **From Address** field (if available)
3. Enter your desired sender email (e.g., `noreply@shalean.co.za`)
4. Enter **Sender Name**: `Shalean Cleaning Services`
5. Click **Save**

**Important Notes:**
- **Domain Verification**: For production, Supabase may require you to verify your domain
- **Email Deliverability**: Using a custom domain email improves deliverability vs. `supabase.io`
- **Email Providers**: Common providers include:
  - Google Workspace / Gmail (SMTP)
  - Microsoft 365 / Outlook (SMTP)
  - Custom SMTP server
  - SendGrid, Mailgun, etc.

**If you don't see SMTP settings:**
- Some Supabase plans require SMTP configuration in **Settings** → **Auth** → **Email**
- You may need to contact Supabase support for custom sender configuration
- Alternative: Use a verified email domain in Supabase settings

### 4. Update Subject Line

In the **Subject** field, replace the default with:
```
Confirm your Shalean account
```

### 5. Replace HTML Template

1. Find the **Body** section (HTML editor)
2. Select all existing content
3. Delete it
4. Copy and paste the HTML template below (see "Complete HTML Template" section)
5. Click **Save** at the bottom of the page

### 6. Customize Verification Link Domain (Optional)

To change the verification link from `utfvbtcszzafuoyytlpf.supabase.co` to use your Shalean domain:

**Current Link Format:**
```
https://utfvbtcszzafuoyytlpf.supabase.co/auth/v1/verify?token=...&redirect_to=https://shalean.co.za/dashboard
```

**Desired Link Format:**
```
https://auth.shalean.co.za/auth/v1/verify?token=...&redirect_to=https://shalean.co.za/dashboard
```

#### Option A: Supabase Custom Domain (Requires Pro Plan)

1. **Verify Your Plan:**
   - Go to Supabase Dashboard → **Settings** → **Billing**
   - Custom domains require **Pro plan** or higher

2. **Set Up Custom Domain:**
   - Choose a subdomain: `auth.shalean.co.za`
   - Configure DNS: Add CNAME record:
     ```
     auth.shalean.co.za → utfvbtcszzafuoyytlpf.supabase.co
     ```
   - In Supabase Dashboard: **Settings** → **Custom Domains** → Add `auth.shalean.co.za`
   - Wait for DNS propagation (15 minutes to 48 hours)

3. **Update Your App:**
   - Update environment variable:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://auth.shalean.co.za
     ```
   - Restart your application

#### Option B: API Route Redirect Handler (Free, Works on Any Plan)

If you don't have Pro plan, create a server-side API route that processes the verification:

**Step 1: Create API Route** at `app/api/auth/verify/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const type = searchParams.get('type') || 'signup';
  
  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }
  
  // Extract redirect URL or default to dashboard
  const redirectTo = searchParams.get('redirect_to') || '/dashboard';
  
  // Build Supabase verification URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(new URL(redirectTo, request.url).toString())}`;
  
  // Redirect to Supabase verification endpoint
  return NextResponse.redirect(verifyUrl);
}
```

**Step 2: Update Email Template** in Supabase Dashboard:
   - In the HTML template, find the confirmation link:
     ```html
     <a href="{{ .ConfirmationURL }}">Confirm Your Email Address</a>
     ```
   - Replace with:
     ```html
     <a href="https://shalean.co.za/api/auth/verify?token={{ .Token }}&type=signup&redirect_to=https://shalean.co.za/dashboard">Confirm Your Email Address</a>
     ```
   
   **Important:** You need to use `{{ .Token }}` instead of `{{ .ConfirmationURL }}`. The template variables are:
   - `{{ .Token }}` - The verification token
   - `{{ .Email }}` - User's email (optional)
   - `{{ .ConfirmationURL }}` - Full Supabase URL (don't use this if you want custom domain)

**Step 3: Update Link Text in Template**
Also update the plain text link below the button:
```html
<p style="margin: 0 0 30px 0; font-size: 14px; color: #0C53ED; word-break: break-all;">
  https://shalean.co.za/api/auth/verify?token={{ .Token }}&type=signup&redirect_to=https://shalean.co.za/dashboard
</p>
```

**How It Works:**
1. User clicks link: `https://shalean.co.za/api/auth/verify?token=...`
2. Your API route receives the request
3. API route redirects to Supabase: `https://utfvbtcszzafuoyytlpf.supabase.co/auth/v1/verify?token=...`
4. Supabase processes verification
5. User is redirected back to `https://shalean.co.za/dashboard`

**Note:** The verification still happens through Supabase, but users see your domain in the email link. The final redirect after verification will be to your domain.

### 7. Verify Changes

1. After saving, wait 10-30 seconds for changes to propagate
2. Test by signing up with a test email address
3. Check that the email matches Shalean branding
4. Verify that the confirmation link works correctly

---

## Complete HTML Template

Copy this entire template into the Supabase **Body** field:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background-color: #0C53ED; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Confirm Your Account</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Shalean Cleaning Services</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="background-color: #f9f9f9; padding: 40px 30px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
          Hello,
        </p>
        
        <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
          Thank you for signing up for Shalean Cleaning Services! We're excited to have you as part of our community.
        </p>
        
        <p style="margin: 0 0 30px 0; font-size: 16px; color: #333;">
          To complete your registration and start booking cleaning services, please confirm your email address by clicking the button below:
        </p>
        
        <!-- Confirmation Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 0 0 30px 0;">
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #0C53ED; color: white; padding: 15px 40px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold;">
                Confirm Your Email Address
              </a>
            </td>
          </tr>
        </table>
        
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">
          If the button doesn't work, you can copy and paste this link into your browser:
        </p>
        
        <p style="margin: 0 0 30px 0; font-size: 14px; color: #0C53ED; word-break: break-all;">
          {{ .ConfirmationURL }}
        </p>
        
        <p style="margin: 0 0 20px 0; font-size: 14px; color: #666;">
          This link will expire in 24 hours. If you didn't create an account with us, you can safely ignore this email.
        </p>
        
        <p style="margin: 0; font-size: 16px; color: #333;">
          Welcome to Shalean Cleaning Services!
        </p>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="padding: 30px 20px; text-align: center; color: #666; font-size: 14px;">
        <p style="margin: 0 0 10px 0;">
          <strong>Shalean Cleaning Services</strong>
        </p>
        <p style="margin: 0 0 10px 0;">
          Professional cleaning services across South Africa
        </p>
        <p style="margin: 0 0 10px 0;">
          Email: info@shalean.com | Phone: +27 87 153 5250
        </p>
        <p style="margin: 20px 0 0 0; font-size: 12px; color: #999;">
          You're receiving this email because you signed up for an account with Shalean Cleaning Services.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## Template Variables Reference

Supabase provides these variables you can use in the template:

- `{{ .ConfirmationURL }}` - The full confirmation link URL (already used in template)
- `{{ .Email }}` - The user's email address (optional, can be added)
- `{{ .Token }}` - The confirmation token (rarely needed)
- `{{ .TokenHash }}fficient` - Hashed token (rarely needed)

The template above uses `{{ .ConfirmationURL }}` for the confirmation button and link.

---

## Customization Options

### Change Colors

To modify the brand color, replace all instances of `#0C53ED` with your desired color:
- Header background: `background-color: #0C53ED;`
- Button background: `background-color: #0C53ED;`
- Link color: `color: #0C53ED;`

### Add Logo

To add a logo image in the header, add this before the `<h1>` tag:
```html
<img src="https://your-domain.com/logo.png" alt="Shalean Cleaning" style="max-width: 150px; margin-bottom: 15px;">
```

### Modify Text

You can customize any text in the template:
- Header title and subtitle
- Greeting and body paragraphs
- Button text
- Footer information

---

## Testing

After saving the template:

1. **Create a test account:**
   - Go to your signup page
   - Use a real email address you can access
   - Complete the signup form

2. **Check your email:**
   - Look for the confirmation email
   - Verify it matches Shalean branding
   - Test the confirmation button/link

3. **Test on different email clients:**
   - Gmail
   - Outlook
   - Apple Mail
   - Mobile email apps

---

## Alternative: Code-Based Customization (Advanced)

If you need more control or want to reuse your existing Resend email infrastructure, you can:

1. **Disable Supabase email sending** in the dashboard
2. **Create a custom email handler** in your Next.js app
3. **Use webhooks** to trigger custom emails on signup

This approach requires:
- Implementing a Supabase webhook endpoint
- Creating a custom email template function in `lib/email.ts`
- Configuring webhook URLs in Supabase Dashboard

**Note:** For most use cases, the dashboard customization (above) is recommended as it's simpler and Supabase handles delivery automatically.

---

## Troubleshooting

### Email not sending
- Check that email provider is enabled: `Authentication` → `Providers` → `Email`
- Verify email confirmation is enabled in provider settings
- Check Supabase logs: `Logs` → `Auth`

### Template not updating
- Wait 10-30 seconds after saving
- Clear browser cache
- Try signing up with a new test account

### Styling issues
- Use inline styles (as in template above) for best email client compatibility
- Test in multiple email clients
- Avoid complex CSS (use tables for layout)

### Link not working
- Verify `{{ .ConfirmationURL }}` is correctly placed
- Check that redirect URLs are configured in `Authentication` → `URL Configuration`

---

## Summary

After completing these steps:
- ✅ Email will have Shalean branding and colors (#0C53ED)
- ✅ Professional styling matching booking confirmation emails
- ✅ Clear call-to-action button
- ✅ Mobile-responsive design
- ✅ Brand-consistent messaging

Your users will now receive a professional, branded confirmation email when they sign up!
