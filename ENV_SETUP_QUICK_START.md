# Quick Start - Environment Setup

## 1. Create `.env.local` file

Create a new file named `.env.local` in the project root (same directory as `package.json`).

## 2. Add Paystack Keys

```env
# Paystack Payment Keys
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
```

### Where to get these keys:

1. Go to [https://dashboard.paystack.com/#/settings/developers](https://dashboard.paystack.com/#/settings/developers)
2. Copy your **Test Public Key** → Replace `pk_test_xxxxxxxxxxxxx`
3. Copy your **Test Secret Key** → Replace `sk_test_xxxxxxxxxxxxx`

## 3. Add Email Service Keys (Optional)

If you want confirmation emails to work:

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxx
SENDER_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=admin@shalean.co.za
```

Get Resend API key from: [https://resend.com/api-keys](https://resend.com/api-keys)

## 4. Restart Development Server

After adding environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## 5. Test Payment

Use these test cards:

**Success**:
- Card: `4084084084084081`
- CVV: `408`
- Expiry: `12/25` (any future date)
- PIN: `0000`

**Failure**:
- Card: `5060666666666666666`
- CVV: `123`

## Complete `.env.local` Example

```env
# Paystack Payment Integration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_abc123def456ghi789
PAYSTACK_SECRET_KEY=sk_test_xyz987wvu654tsr321

# Supabase Database Integration (for Cleaner Selection)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Email Service (Optional)
RESEND_API_KEY=re_123456789
SENDER_EMAIL=onboarding@resend.dev
ADMIN_EMAIL=admin@shalean.co.za
```

## Troubleshooting

**"Payment service not configured"**
- Check `.env.local` exists in project root
- Verify `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set
- Restart dev server

**"Payment verification failed"**
- Check `PAYSTACK_SECRET_KEY` is set correctly
- Verify key matches Paystack dashboard
- Check for typos in key

## Ready to Test! 🚀

1. Navigate to booking flow: `http://localhost:3000/booking/service/select`
2. Complete all steps
3. At Review step, click "Confirm & Pay"
4. Paystack popup should appear
5. Use test card to complete payment

---

For detailed documentation, see `PAYSTACK_SETUP.md`

