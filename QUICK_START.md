# 🚀 Quick Start Guide - Booking Flow & Email Setup

## ⚡ 3-Minute Setup

### 1. Create Environment File

Create `.env.local` in your project root:

```bash
# Copy this entire block into .env.local
RESEND_API_KEY=your_resend_api_key_here
ADMIN_EMAIL=admin@shalean.co.za
SENDER_EMAIL=onboarding@resend.dev
```

### 2. Get Resend API Key

1. Visit: https://resend.com/signup
2. Sign up (free - 3,000 emails/month)
3. Go to **API Keys** → Create new key
4. Copy key and paste into `.env.local` as `RESEND_API_KEY`

### 3. Update Admin Email

In `.env.local`, change:
```bash
ADMIN_EMAIL=your-email@example.com
```

### 4. Start Development Server

```bash
npm install
npm run dev
```

### 5. Test Booking Flow

1. Open: http://localhost:3000/booking
2. Complete all 5 steps
3. Check your email inbox!

---

## 📧 What Happens When You Submit a Booking

### Customer Receives:
✉️ **Booking Confirmation Email**
- Booking ID & details
- Date, time, address
- Pricing summary
- What happens next

### Admin Receives:
🔔 **Admin Notification Email**
- Customer contact info
- Complete booking details
- Action items checklist
- Urgent action reminder

---

## 🎯 Booking Flow Structure

```
Step 1: Service Selection (/booking/service/select)
   ↓
Step 2: Home Details ([slug]/details)
   ↓
Step 3: Schedule ([slug]/schedule)
   ↓
Step 4: Contact & Address ([slug]/contact)
   ↓
Step 5: Review & Confirm ([slug]/review)
   ↓
Confirmation Page (/booking/confirmation)
```

---

## ✅ Quick Verification Checklist

- [ ] `.env.local` file created
- [ ] `RESEND_API_KEY` set with valid key
- [ ] `ADMIN_EMAIL` updated with your email
- [ ] Dev server running (`npm run dev`)
- [ ] Booking flow works (all 5 steps)
- [ ] Customer email received
- [ ] Admin email received

---

## 🔧 Troubleshooting

**Issue**: Emails not sending
- Check `.env.local` exists in project root
- Verify API key is correct
- Restart dev server
- Check spam folder

**Issue**: Navigation broken
- Clear browser: `localStorage.clear()`
- Refresh page
- Start from `/booking`

**Issue**: Missing emails
- Verify email addresses are correct
- Check Resend dashboard for errors
- Look in spam/junk folder

---

## 📚 Full Documentation

For detailed setup, customization, and production deployment:
- See: `BOOKING_EMAIL_SETUP.md`

For Resend-specific details:
- See: `RESEND_SETUP.md`

---

## 🎨 File Structure

```
Key Files Modified/Created:
├── lib/email.ts                    # Email templates & sending
├── app/api/bookings/route.ts       # Booking API (sends emails)
├── components/step-*.tsx           # Step components
├── app/booking/service/[slug]/*    # Dynamic booking pages
└── BOOKING_EMAIL_SETUP.md          # Full documentation
```

---

## 💡 Tips

1. **Testing**: Use your real email to test
2. **Production**: Verify domain in Resend before going live
3. **Monitoring**: Check Resend dashboard for email stats
4. **Customization**: Edit templates in `lib/email.ts`

---

**Need Help?** Check `BOOKING_EMAIL_SETUP.md` for detailed troubleshooting and configuration options.

**Ready to Go Live?** Follow production checklist in `BOOKING_EMAIL_SETUP.md`.

