# Booking Reminders Setup Guide

## Overview

The booking reminders system sends email and SMS notifications to customers before their appointments (24 hours and 2 hours before).

## Database Setup

1. **Run the migration:**
   ```bash
   # Apply the migration to your Supabase database
   supabase migration up create-booking-reminders
   ```

   Or apply it manually via Supabase Dashboard SQL Editor.

## Frontend Integration

The reminder settings component is already integrated. Users can manage their preferences in the dashboard settings page.

To add it to your settings page:

```tsx
import { ReminderSettings } from '@/components/dashboard/reminder-settings';

// In your settings page:
<ReminderSettings />
```

## Backend Setup (Cron Job)

### Option 1: Supabase Edge Functions (Recommended)

1. **Create an Edge Function:**

```typescript
// supabase/functions/send-reminders/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { ReminderService } from '../../lib/reminders/reminder-service.ts';

serve(async (req) => {
  const service = new ReminderService({
    supabaseUrl: Deno.env.get('SUPABASE_URL')!,
    supabaseServiceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    emailService: {
      apiKey: Deno.env.get('RESEND_API_KEY')!,
      fromEmail: 'noreply@yourdomain.com',
      fromName: 'Your Cleaning Service',
    },
    smsService: {
      provider: 'twilio',
      apiKey: Deno.env.get('TWILIO_ACCOUNT_SID')!,
      fromNumber: Deno.env.get('TWILIO_PHONE_NUMBER')!,
    },
  });

  try {
    const results = await service.checkAndSendReminders();
    return new Response(JSON.stringify({ success: true, results }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

2. **Set up cron job in Supabase:**
   - Go to Database → Cron Jobs
   - Create a new cron job that calls the Edge Function every hour
   - Schedule: `0 * * * *` (every hour)

### Option 2: Vercel Cron Jobs

1. **Create API route:**

```typescript
// app/api/cron/reminders/route.ts
import { ReminderService } from '@/lib/reminders/reminder-service';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const service = new ReminderService({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    emailService: {
      apiKey: process.env.RESEND_API_KEY!,
      fromEmail: 'noreply@yourdomain.com',
      fromName: 'Your Cleaning Service',
    },
    smsService: {
      provider: 'twilio',
      apiKey: process.env.TWILIO_ACCOUNT_SID!,
      fromNumber: process.env.TWILIO_PHONE_NUMBER!,
    },
  });

  const results = await service.checkAndSendReminders();
  return Response.json({ success: true, results });
}
```

2. **Add to vercel.json:**

```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Option 3: External Cron Service

Use a service like:
- **Cron-job.org** (free)
- **EasyCron** (free tier)
- **GitHub Actions** (free for public repos)

Set up a webhook that calls your API endpoint every hour.

## Email Service Setup

### Using Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Verify your domain
4. Add to environment variables:
   ```
   RESEND_API_KEY=re_xxxxx
   ```

### Using SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Update `reminder-service.ts` to use SendGrid API
4. Add to environment variables:
   ```
   SENDGRID_API_KEY=SG.xxxxx
   ```

## SMS Service Setup

### Using Twilio

1. Sign up at [twilio.com](https://twilio.com)
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Add to environment variables:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxx
   TWILIO_AUTH_TOKEN=xxxxx
   TWILIO_PHONE_NUMBER=+1234567890
   ```

### Using AWS SNS

1. Set up AWS SNS
2. Create credentials
3. Update `reminder-service.ts` to use AWS SDK
4. Add to environment variables:
   ```
   AWS_ACCESS_KEY_ID=xxxxx
   AWS_SECRET_ACCESS_KEY=xxxxx
   AWS_REGION=us-east-1
   ```

## Testing

1. **Test email reminders:**
   - Set a booking for 25 hours in the future
   - Enable email reminders in your preferences
   - Run the reminder service manually
   - Check your email

2. **Test SMS reminders:**
   - Set a booking for 25 hours in the future
   - Enable SMS reminders and add phone number
   - Run the reminder service manually
   - Check your phone

## Monitoring

Check the `sent_reminders` table to monitor:
- Which reminders were sent
- Delivery status
- Any errors

Query example:
```sql
SELECT 
  sr.*,
  b.booking_date,
  b.service_type,
  c.email
FROM sent_reminders sr
JOIN bookings b ON b.id = sr.booking_id
JOIN customers c ON c.id = sr.customer_id
ORDER BY sr.sent_at DESC
LIMIT 100;
```

## Troubleshooting

1. **Reminders not sending:**
   - Check cron job is running
   - Verify environment variables
   - Check email/SMS service credentials
   - Review `sent_reminders` table for errors

2. **Duplicate reminders:**
   - The system prevents duplicates via unique constraint
   - If duplicates occur, check the `sent_reminders` table

3. **Wrong timing:**
   - Verify timezone settings in database
   - Check booking dates/times are correct

## Security Notes

- Use service role key only in backend/cron jobs
- Never expose service role key to frontend
- Use environment variables for all secrets
- Verify cron job requests with a secret token
