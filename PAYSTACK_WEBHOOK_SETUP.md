# Paystack Webhook Setup Guide

## Overview

The Paystack webhook endpoint automatically updates booking status when payments are processed. This ensures that bookings are marked as "completed" when payment succeeds, and "cancelled" when payment fails.

## Webhook Endpoint

**URL**: `https://yourdomain.com/api/payment/webhook`

**Method**: `POST`

**Events Handled**:
- `charge.success` - Payment successful, updates booking to `completed`
- `charge.failed` - Payment failed, updates booking to `cancelled`
- `refund.processed` - Refund processed, updates booking to `cancelled`

## Setup Instructions

### Step 1: Configure Webhook in Paystack Dashboard

1. Log in to your [Paystack Dashboard](https://dashboard.paystack.com/)
2. Go to **Settings** → **API Keys & Webhooks**
3. Click **Add Webhook**
4. Enter your webhook URL:
   ```
   https://yourdomain.com/api/payment/webhook
   ```
   For local development/testing:
   ```
   https://your-ngrok-url.ngrok.io/api/payment/webhook
   ```
5. Select the events you want to receive:
   - ✅ `charge.success`
   - ✅ `charge.failed`
   - ✅ `refund.processed`
6. Click **Save**

### Step 2: Verify Webhook is Active

Paystack will send a test GET request to verify the endpoint. The endpoint responds with:
```json
{
  "ok": true,
  "message": "Paystack webhook endpoint is active"
}
```

### Step 3: Test Webhook (Optional)

You can test the webhook using Paystack's webhook testing tool in the dashboard, or by using their API to trigger test events.

## How It Works

1. **Customer pays**: Customer completes payment via Paystack
2. **Paystack processes**: Paystack processes the payment
3. **Webhook sent**: Paystack sends webhook event to your endpoint
4. **Signature verified**: Endpoint verifies the webhook signature for security
5. **Booking updated**: Booking status is updated based on payment result:
   - `charge.success` → Booking status = `completed`
   - `charge.failed` → Booking status = `cancelled`
   - `refund.processed` → Booking status = `cancelled`

## Security

The webhook endpoint:
- ✅ Verifies Paystack signature using HMAC SHA512
- ✅ Only processes events from verified Paystack requests
- ✅ Uses `PAYSTACK_SECRET_KEY` from environment variables
- ✅ Returns 401 if signature is invalid

## Environment Variables Required

Make sure you have `PAYSTACK_SECRET_KEY` set in your environment:
```env
PAYSTACK_SECRET_KEY=sk_test_... # or sk_live_... for production
```

## Troubleshooting

### Webhook Not Receiving Events

1. **Check Paystack Dashboard**: Verify webhook URL is correct and active
2. **Check Server Logs**: Look for webhook requests in your server logs
3. **Verify Signature**: Ensure `PAYSTACK_SECRET_KEY` matches your Paystack account
4. **Check Network**: Ensure your server is accessible from Paystack's servers

### Bookings Not Updating

1. **Check Payment Reference**: Ensure booking has `payment_reference` set
2. **Check Webhook Logs**: Look for errors in webhook processing
3. **Verify Event Type**: Ensure you're subscribed to the correct events
4. **Check Database**: Verify booking exists with matching `payment_reference`

### Signature Verification Failing

1. **Verify Secret Key**: Ensure `PAYSTACK_SECRET_KEY` is correct
2. **Check Headers**: Ensure `x-paystack-signature` header is being sent
3. **Raw Body**: Webhook must read raw body (not parsed JSON) for signature verification

## Testing Locally

For local development, use a tool like [ngrok](https://ngrok.com/) to expose your local server:

1. Start your Next.js dev server: `npm run dev`
2. Start ngrok: `ngrok http 3000`
3. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
4. Add webhook in Paystack: `https://abc123.ngrok.io/api/payment/webhook`
5. Test payments and verify webhooks are received

## Production Deployment

1. Deploy your application to production
2. Update webhook URL in Paystack dashboard to production URL
3. Ensure `PAYSTACK_SECRET_KEY` is set to production secret key
4. Test with a real payment to verify webhook works

## Benefits

✅ **Automatic Status Updates**: Bookings automatically update when payment succeeds
✅ **Real-time Sync**: No need to manually verify payments
✅ **Accurate Payment Tracking**: Payments page shows correct status
✅ **Failed Payment Handling**: Failed payments automatically marked as cancelled
✅ **Refund Support**: Refunds automatically update booking status


