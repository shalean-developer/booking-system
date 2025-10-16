# 📧 Booking Flow & Email Setup Guide

This guide will help you complete the setup of the booking flow with email notifications for both customers and admin.

## ✅ What's Been Fixed

### 1. **Complete Booking Flow** (Step 1 → Confirmation)
The booking flow now works seamlessly from start to finish:
- **Step 1**: Service Selection (`/booking/service/select`)
- **Step 2**: Home Details (bedrooms, bathrooms, extras)
- **Step 3**: Schedule (date and time selection)
- **Step 4**: Contact & Address information
- **Step 5**: Review & Confirm
- **Final**: Confirmation Page

### 2. **Email System Enhanced**
Two email types are now sent on booking submission:

#### Customer Confirmation Email
- Professional branded email with Shalean branding
- Complete booking details (service, date, time, address)
- Pricing breakdown
- Booking ID for reference
- Contact information

#### Admin Notification Email
- **NEW!** Urgent notification to admin when a booking is submitted
- Customer contact information prominently displayed
- Complete booking details
- Action items checklist
- Clearly marked as requiring attention

### 3. **Email Configuration Improvements**
- Sender email now uses environment variable (`SENDER_EMAIL`)
- Admin email configurable via `ADMIN_EMAIL` environment variable
- Fallback to safe defaults if not configured
- Better error handling and logging

## 🔧 Setup Instructions

### Step 1: Create Environment File

Create a file named `.env.local` in the root of your project:

```bash
# Resend API Configuration
# Get your API key from https://resend.com
RESEND_API_KEY=your_resend_api_key_here

# Admin Email Configuration
# This email will receive notifications when new bookings are submitted
ADMIN_EMAIL=admin@shalean.com

# Sender Email Configuration
# This should be your verified domain email
# For testing, you can use: onboarding@resend.dev
SENDER_EMAIL=noreply@shalean.com
```

⚠️ **Important**: The `.env.local` file is automatically ignored by git for security.

### Step 2: Get Your Resend API Key

1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account (includes 3,000 emails/month free, then $0.40 per 1,000 emails)
3. Navigate to **API Keys** in your dashboard
4. Create a new API key:
   - Name it: "Shalean Cleaning App"
   - Copy the generated key
5. Paste it into your `.env.local` file as `RESEND_API_KEY`

### Step 3: Configure Email Addresses

Update your `.env.local` file:

```env
# Replace with your actual admin email where you want to receive booking notifications
ADMIN_EMAIL=your-admin-email@yourdomain.com

# For testing, you can use Resend's test address
SENDER_EMAIL=onboarding@resend.dev

# For production, use your verified domain
# SENDER_EMAIL=noreply@shalean.com
```

### Step 4: Verify Domain (Production Only)

For production, verify your own domain in Resend:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `shalean.com`)
4. Follow DNS verification instructions
5. Update `SENDER_EMAIL` in `.env.local` to use your domain

## 🧪 Testing the Booking Flow

### Test Checklist

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Booking**
   - Open `http://localhost:3000`
   - Click "Book Now" or navigate to `/booking`

3. **Test Step 1 - Service Selection**
   - Choose any service (Standard, Deep, Move In/Out, or Airbnb)
   - Click "Next: Home Details"
   - ✅ Should navigate to details page

4. **Test Step 2 - Home Details**
   - Select number of bedrooms
   - Select number of bathrooms
   - Check/uncheck additional services (extras)
   - Add special instructions (optional)
   - Click "Next: Schedule"
   - ✅ Should navigate to schedule page

5. **Test Step 3 - Schedule**
   - Pick a date (must be today or future)
   - Select a time slot
   - Click "Next: Contact Info"
   - ✅ Should navigate to contact page

6. **Test Step 4 - Contact & Address**
   - Enter first name
   - Enter last name
   - Enter email address (use your real email to receive test email)
   - Enter phone number
   - Enter street address
   - Enter suburb
   - Enter city
   - Click "Next: Review"
   - ✅ Should navigate to review page

7. **Test Step 5 - Review & Confirm**
   - Review all details
   - Check that pricing is correct
   - Click "Confirm Booking"
   - ✅ Should see loading spinner
   - ✅ Should navigate to confirmation page
   - ✅ Should receive email confirmation

8. **Check Emails**
   - **Customer**: Check the email address you entered
     - Look for "Booking Confirmation" email
     - Verify all details are correct
   - **Admin**: Check your admin email
     - Look for "🔔 New Booking" email
     - Verify customer contact info is displayed
     - Check action items are listed

## 📧 Email Details

### Customer Confirmation Email
**Subject**: `Booking Confirmation - BK-[timestamp] | Shalean Cleaning`

**Includes**:
- Welcome message
- Booking ID
- Service type and date/time
- Full service address
- Home details (bedrooms, bathrooms)
- Additional services (if any)
- Special instructions (if any)
- Total price
- What happens next
- Contact information

### Admin Notification Email
**Subject**: `🔔 New Booking: BK-[timestamp] - [Customer Name]`

**Includes**:
- Urgent action required banner
- Customer contact information (highlighted)
- Complete booking details
- Service address
- Pricing summary
- Action items checklist:
  1. Contact customer within 24 hours
  2. Confirm appointment and availability
  3. Send payment link/details
  4. Schedule team assignment

## 🔍 Troubleshooting

### Issue: "RESEND_API_KEY is not configured" Error

**Solution**: 
- Make sure `.env.local` file exists in project root
- Verify `RESEND_API_KEY` is set correctly
- Restart your development server (`npm run dev`)

### Issue: Emails Not Being Received

**Possible Causes & Solutions**:

1. **Check Spam/Junk Folder**
   - Resend emails may initially land in spam
   - Mark as "Not Spam" to train your email provider

2. **Verify API Key**
   - Log into Resend dashboard
   - Check API key is active
   - Try creating a new API key

3. **Check Console Logs**
   - Look for error messages in terminal
   - Check browser console for API errors
   - Verify email addresses are valid

4. **Sender Email Domain**
   - For testing: Use `onboarding@resend.dev`
   - For production: Verify your domain first

### Issue: Form Validation Errors

**Solution**:
- All fields marked with * are required
- Email must be valid format
- Phone must be at least 10 digits
- Names must be at least 2 characters

### Issue: Navigation Not Working

**Solution**:
- Clear browser localStorage: `localStorage.clear()`
- Refresh the page
- Start booking flow from beginning

## 🎨 Customization

### Modify Email Templates

Edit `lib/email.ts` to customize:

1. **Customer Email Template**
   - Function: `generateBookingConfirmationEmail()`
   - Line: ~55

2. **Admin Email Template**
   - Function: `generateAdminBookingNotificationEmail()`
   - Line: ~154

### Change Email Styling

Both email templates use inline CSS. Modify the `<style>` tags in the HTML templates:

```typescript
const html = `
  <style>
    .header { background-color: #0C53ED; ... }
    .content { background-color: #f9f9f9; ... }
    // ... customize colors, fonts, etc.
  </style>
`;
```

### Add More Email Types

Create new email generator functions in `lib/email.ts`:

```typescript
export function generateReminderEmail(booking: BookingState): EmailData {
  // Implementation here
}

export function generateCancellationEmail(booking: BookingState): EmailData {
  // Implementation here
}
```

## 📊 Monitoring

### Check Email Delivery

1. Log into [Resend Dashboard](https://resend.com/emails)
2. View **Emails** tab
3. See delivery status, opens, clicks

### Resend Free Tier Limits

- **3,000 emails/month** free
- Then **$0.40 per 1,000 emails**
- 100 emails/day testing limit

## 🚀 Production Deployment

Before going live:

1. ✅ Verify your domain in Resend
2. ✅ Update `SENDER_EMAIL` to use verified domain
3. ✅ Set `ADMIN_EMAIL` to your business email
4. ✅ Test complete flow on staging environment
5. ✅ Set up proper error monitoring
6. ✅ Consider adding email retry queue for failures
7. ✅ Update contact phone numbers in email templates

## 📝 Next Steps

After email setup is complete:

1. **Database Integration**: Save bookings to database
2. **Payment Integration**: Add Paystack payment flow
3. **Calendar Integration**: Sync with Google Calendar
4. **SMS Notifications**: Add SMS confirmations via Twilio
5. **Email Analytics**: Track open rates and engagement
6. **Automated Reminders**: Send reminders 24h before booking

## 🆘 Support

### Documentation
- [Resend Documentation](https://resend.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

### Test Email Functionality
Run a test booking with your own email to verify everything works!

---

**Last Updated**: ${new Date().toISOString().split('T')[0]}

*This system is now ready for production use. Make sure to test thoroughly before going live!*

