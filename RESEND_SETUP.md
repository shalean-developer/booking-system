# Resend Email Integration Setup Guide

This guide will help you complete the setup of Resend for sending booking confirmation emails in your Shalean Cleaning Services application.

## What's Already Done ✅

1. **Resend Package Installed**: Added `resend` dependency to your project
2. **Environment File Created**: `.env.local` file with `RESEND_API_KEY` placeholder
3. **Email Utility Created**: `lib/email.ts` with email templates and sending functions
4. **API Route Updated**: `app/api/bookings/route.ts` now sends confirmation emails

## What You Need to Do 🔧

### Step 1: Get Your Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (10,000 emails/month free)
3. Navigate to **API Keys** in your dashboard
4. Create a new API key with a descriptive name (e.g., "Shalean Cleaning App")

### Step 2: Configure Your Environment

1. Open `.env.local` file in your project root
2. Replace `your_resend_api_key_here` with your actual Resend API key:

```env
RESEND_API_KEY=re_123456789_abcdefghijklmnopqrstuvwxyz123456
ADMIN_EMAIL=admin@yourcompany.com
```

⚠️ **Important**: Never commit this file to version control! It's already in `.gitignore`

### Step 3: Update the Sender Email (Optional but Recommended)

1. Open `lib/email.ts`
2. Find this line:
```typescript
from: 'Shalean Cleaning <onboarding@resend.dev>', // Replace with your verified domain
```

3. Replace with your verified domain email:
```typescript
from: 'Shalean Cleaning <noreply@yourdomain.com>',
```

### Step 4: Verify Your Domain (Recommended for Production)

For production use, you should verify your own domain instead of using `resend.dev`:

1. In your Resend dashboard, go to **Domains**
2. Add your domain (e.g., `shaleancleaning.com`)
3. Follow the DNS verification steps
4. Update the `from` field in `lib/email.ts` to use your verified domain

## How It Works 📧

### Booking Confirmations

When a customer submits a booking:

1. The booking data is received by `app/api/bookings/route.ts`
2. A unique booking ID is generated (`BK-` + timestamp)
3. An email template is generated using `generateBookingConfirmationEmail()`
4. The email is sent via Resend using `sendEmail()`
5. The customer receives a beautifully formatted confirmation email

### Quote Confirmations (NEW!)

When a customer confirms a quote request:

1. The quote data is received by `app/api/quote-confirmation/route.ts`
2. A unique quote ID is generated (`QT-` + timestamp)
3. **Two emails are sent**:
   - Confirmation email to the customer with quote details
   - Notification email to admin with customer contact information
4. Both emails are sent via Resend using `sendEmail()`
5. The customer gets a quote confirmation and admin gets notified for follow-up

## Email Template Features

The confirmation email includes:
- ✅ Professional header with Shalean branding
- ✅ Booking ID for reference
- ✅ Complete service details (type, date, time, address)
- ✅ Home details (bedrooms, bathrooms, extras)
- ✅ Accurate pricing calculation
- ✅ Contact information
- ✅ Responsive design that works on all devices

## Testing 🧪

1. Start your development server: `npm run dev`
2. Go through the booking flow on your website
3. Submit a test booking with your email address
4. Check your inbox for the confirmation email
5. Check the console logs for any errors

## Troubleshooting 🔍

### Common Issues:

**"Failed to send email" error:**
- Check that `RESEND_API_KEY` is correctly set in `.env.local`
- Verify your API key is valid in the Resend dashboard
- Check the console logs for specific error messages

**Emails not being received:**
- Check spam/junk folders
- Verify the `from` email address is valid
- Test with a different email address

**TypeScript errors:**
- Run `npm run build` to check for any compilation issues
- Ensure all imports are correct

### Debug Mode:

Add this to your `.env.local` for detailed logging:
```env
RESEND_API_KEY=your_key_here
DEBUG=true
```

## Next Steps 🚀

After confirming emails work:

1. **Customize Email Template**: Edit the HTML in `generateBookingConfirmationEmail()` to match your brand
2. **Add More Email Types**: Welcome emails, reminder emails, etc.
3. **Set Up Domain**: Verify your domain for professional `from` addresses
4. **Monitor Usage**: Check your Resend dashboard for delivery stats

## Security Notes 🔒

- Never share your API key publicly
- Use environment variables for all sensitive data
- The `.env.local` file is automatically ignored by git
- Consider using different API keys for development and production

---

Need help? Check the [Resend Documentation](https://resend.com/docs) or review the code in `lib/email.ts` and `app/api/bookings/route.ts`.
