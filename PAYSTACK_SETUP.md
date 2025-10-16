# Paystack Payment Integration Setup

## Overview

The booking flow now includes integrated payment processing via Paystack. Customers are required to complete payment before their booking is confirmed.

## Environment Variables Required

Add the following environment variables to your `.env.local` file:

```env
# Paystack API Keys
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

### Getting Your Paystack API Keys

1. **Sign up for Paystack**
   - Visit [https://paystack.com](https://paystack.com)
   - Create an account or log in

2. **Access Developer Settings**
   - Go to Settings → API Keys & Webhooks
   - Or visit directly: [https://dashboard.paystack.com/#/settings/developers](https://dashboard.paystack.com/#/settings/developers)

3. **Get Test Keys (Development)**
   - Copy your **Test Public Key** (starts with `pk_test_`)
   - Copy your **Test Secret Key** (starts with `sk_test_`)
   - Add both to your `.env.local` file

4. **Get Live Keys (Production)**
   - Before going live, complete your Paystack account verification
   - Switch to "Live" mode in the dashboard
   - Copy your **Live Public Key** (starts with `pk_live_`)
   - Copy your **Live Secret Key** (starts with `sk_live_`)
   - Update your production environment variables

## Testing the Integration

### Test Card Numbers

Paystack provides test cards for different scenarios:

#### Successful Payment
- **Card Number**: `4084084084084081`
- **CVV**: `408`
- **Expiry**: Any future date
- **PIN**: `0000`
- **OTP**: `123456`

#### Failed Payment (Insufficient Funds)
- **Card Number**: `5060666666666666666`
- **CVV**: `123`
- **Expiry**: Any future date
- **PIN**: `0000`

#### More Test Cards
Visit [Paystack Test Cards Documentation](https://paystack.com/docs/payments/test-payments) for more test scenarios.

## How Payment Works

### Payment Flow

1. **Step 5 - Review & Confirm**
   - User reviews booking details
   - Clicks "Confirm & Pay" button
   - Total amount is calculated from service and extras

2. **Paystack Popup Opens**
   - Inline payment modal appears
   - User enters card details securely
   - Payment processed by Paystack

3. **Payment Verification**
   - Backend verifies payment with Paystack API
   - Ensures payment was successful
   - Double-checks amount and reference

4. **Booking Confirmation**
   - Booking is created with payment reference
   - Confirmation email sent to customer and admin
   - User redirected to success page

### Security Features

- **Client-side**: Public key only, safe for browser
- **Server-side**: Secret key for verification, never exposed
- **Double verification**: Payment verified before booking creation
- **Unique references**: Each transaction has unique identifier
- **Secure processing**: All payments handled by Paystack's PCI-DSS compliant system

## Currency

The system is configured for **ZAR (South African Rand)**.

Paystack processes amounts in **kobo** (smallest unit):
- R1.00 = 100 kobo
- The system automatically converts: `amount * 100`

## Email Templates

The confirmation emails now include:
- Payment confirmation message
- Payment reference number
- Transaction details
- Receipt information

## Error Handling

The system handles various error scenarios:

### Payment Popup Closed
- User message: "Payment was cancelled. Please try again."
- User can retry payment

### Payment Failed
- Displays error from Paystack
- User can retry with different card

### Network Error
- User message: "Failed to verify payment"
- Support contact information provided

### Verification Failed
- Payment not confirmed
- User instructed to contact support with reference

## Troubleshooting

### "Payment service not configured" Error

**Problem**: Paystack public key not found

**Solution**: 
1. Check `.env.local` exists in project root
2. Verify `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set
3. Restart development server (`npm run dev`)

### Payment Verification Fails

**Problem**: Backend can't verify payment

**Solution**:
1. Check `PAYSTACK_SECRET_KEY` is set in `.env.local`
2. Verify key matches your Paystack dashboard
3. Check server logs for detailed error

### Test Mode vs Live Mode

**Important**: 
- Test keys only work with test cards
- Live keys only work with real cards
- Never use test keys in production
- Never use live keys in development

## Going Live Checklist

Before launching to production:

- [ ] Complete Paystack account verification
- [ ] Update environment variables with live keys
- [ ] Test with real card (small amount)
- [ ] Verify emails are sent correctly
- [ ] Check payment appears in Paystack dashboard
- [ ] Test refund process (if needed)
- [ ] Set up webhook for payment notifications (optional)
- [ ] Configure payment receipt design in Paystack
- [ ] Review settlement schedule with Paystack

## Webhook Setup (Optional)

For additional security and automation, you can set up webhooks:

1. Create webhook endpoint: `/api/payment/webhook`
2. Add URL in Paystack Dashboard → Settings → Webhooks
3. Handle events: `charge.success`, `charge.failed`
4. Verify webhook signature for security

**Note**: Current implementation doesn't require webhooks, but they can provide additional reliability.

## Support

- **Paystack Documentation**: [https://paystack.com/docs](https://paystack.com/docs)
- **Paystack Support**: support@paystack.com
- **Test Cards**: [https://paystack.com/docs/payments/test-payments](https://paystack.com/docs/payments/test-payments)

## Files Modified

### Frontend
- `components/step-review.tsx` - Payment integration and UI
- `types/booking.ts` - Added payment reference types

### Backend
- `app/api/payment/verify/route.ts` - Payment verification endpoint
- `app/api/bookings/route.ts` - Updated to require payment

### UI/UX
- `app/booking/confirmation/page.tsx` - Updated success messaging

---

**Status**: ✅ Integration Complete  
**Last Updated**: October 16, 2025  
**Payment Provider**: Paystack  
**Currency**: ZAR (South African Rand)

