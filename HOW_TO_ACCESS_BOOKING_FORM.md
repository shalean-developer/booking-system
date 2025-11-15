# How to Access the Redesigned Booking Form

## 🚀 Quick Start

### Main Entry Point
**URL:** `/booking/service/select`

This is the starting point of the redesigned booking form.

---

## 📍 Complete Booking Flow URLs

### Step 1: Service Selection
**URL:** `http://localhost:3000/booking/service/select`  
**Route:** `/booking/service/select`  
**What to expect:**
- Service selection cards (Standard, Deep, Move In/Out, Airbnb)
- "Continue to details" button (enabled after selecting a service)
- Booking summary sidebar (on desktop)

### Step 2: Home Details
**URL:** `http://localhost:3000/booking/service/{slug}/details`  
**Route:** `/booking/service/standard/details` (example)  
**Dynamic slugs:**
- `standard` → Standard Cleaning
- `deep` → Deep Cleaning
- `move-in-out` → Move In/Out Cleaning
- `airbnb` → Airbnb Cleaning

**What to expect:**
- Bedroom and bathroom selectors
- Extra services grid
- Special instructions textarea
- Real-time price updates

### Step 3: Schedule
**URL:** `http://localhost:3000/booking/service/{slug}/schedule`  
**Route:** `/booking/service/standard/schedule` (example)  
**What to expect:**
- Date picker (horizontal scrolling cards)
- Time slot selection
- Frequency selector (one-time, weekly, bi-weekly, monthly)
- Price preview with discounts

### Step 4: Contact Information
**URL:** `http://localhost:3000/booking/service/{slug}/contact`  
**Route:** `/booking/service/standard/contact` (example)  
**What to expect:**
- Contact form (name, email, phone)
- Address autocomplete
- Customer profile detection and autofill
- Form validation

### Step 5: Cleaner Selection
**URL:** `http://localhost:3000/booking/service/{slug}/select-cleaner`  
**Route:** `/booking/service/standard/select-cleaner` (example)  
**What to expect:**
- For Standard/Airbnb: Cleaner selection cards
- For Deep/Move In/Out: Team selection
- Cleaner filtering and sorting options
- Manual assignment option

### Step 6: Review & Payment
**URL:** `http://localhost:3000/booking/service/{slug}/review`  
**Route:** `/booking/service/standard/review` (example)  
**What to expect:**
- Complete booking summary
- Editable sections (each has "Edit" button)
- Price breakdown
- Payment button with Paystack integration
- Comprehensive validation before payment

### Step 7: Confirmation
**URL:** `http://localhost:3000/booking/confirmation?ref={payment_reference}`  
**Route:** `/booking/confirmation?ref=BK-1234567890-abc123` (example)  
**What to expect:**
- Booking confirmation message
- Booking details display
- Payment confirmation
- Email resend option
- Download receipt option
- Next steps information

---

## 🧪 Testing the Redesigned Form

### Option 1: Start from Beginning
1. Navigate to: `http://localhost:3000/booking/service/select`
2. Select a service type
3. Click "Continue to details"
4. Fill in home details
5. Click "Continue to schedule"
6. Select date and time
7. Click "Continue to contact"
8. Fill in contact information
9. Click "Continue to cleaner"
10. Select cleaner or team
11. Click "Continue to review"
12. Review and click "Confirm & Pay"

### Option 2: Direct URL Access
You can access any step directly using the URLs above, but:
- ⚠️ **Note:** Steps 2-6 require a service to be selected first
- The form will auto-sync service from URL slug
- If no service in state, it will redirect to step 1

### Option 3: From Homepage
1. Go to homepage: `http://localhost:3000`
2. Click "Book a service" button (in hero section or footer)
3. You'll be taken to `/booking/service/select`

---

## 🔍 What's New in the Redesign

### ✅ Fixed Issues
1. **Unified Confirmation Page** - Single confirmation route
2. **Fresh Payment References** - New reference on each payment attempt
3. **Pricing Lock** - Amount locked before payment
4. **Comprehensive Validation** - All fields validated before payment
5. **Error Recovery** - Retry mechanism for failed bookings
6. **Shared Utilities** - No code duplication

### ✅ Enhanced Features
- Better error messages
- Improved loading states
- SessionStorage fallback (10-minute expiry)
- Retry button for failed booking saves
- Proper state management

---

## 🎯 Testing Checklist

### Basic Flow Test
- [ ] Navigate to `/booking/service/select`
- [ ] Select a service
- [ ] Complete all 6 steps
- [ ] Complete payment (test mode)
- [ ] Verify confirmation page loads

### Validation Test
- [ ] Try to proceed without selecting service (should be disabled)
- [ ] Try to proceed with 0 bathrooms (should show error)
- [ ] Try to proceed without date/time (should be disabled)
- [ ] Try to proceed with invalid email (should show error)
- [ ] Try to proceed without cleaner selection (should show error)

### Error Recovery Test
- [ ] Complete payment successfully
- [ ] Test payment cancellation
- [ ] Test retry mechanism (if booking save fails)
- [ ] Test sessionStorage fallback

### Navigation Test
- [ ] Navigate forward through all steps
- [ ] Navigate backward through all steps
- [ ] Use browser back button
- [ ] Refresh page (state should persist)

---

## 🛠️ Development Server

### Start the Server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Access the Form
Once the server is running:
- **Local:** `http://localhost:3000/booking/service/select`
- **Network:** `http://[your-ip]:3000/booking/service/select`

---

## 📱 Mobile Testing

The redesigned form is mobile-responsive. Test on:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktop (1024px+)

### Mobile-Specific Features
- Sticky action buttons
- Touch-optimized inputs
- Responsive layout
- Mobile-friendly date/time pickers

---

## 🔐 Payment Testing

### Test Mode
The form uses Paystack test mode. Use these test cards:

**Successful Payment:**
- Card: `4084084084084081`
- CVV: `408`
- Expiry: Any future date
- PIN: `0000`

**Failed Payment:**
- Card: `5060666666666666666`
- CVV: `123`
- Expiry: Any future date

---

## 🐛 Troubleshooting

### Form Not Loading
- Check if development server is running
- Clear browser cache
- Check browser console for errors

### State Not Persisting
- Check localStorage is enabled
- Check browser console for errors
- Try in incognito/private mode

### Payment Not Working
- Verify `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is set in `.env.local`
- Check browser console for errors
- Verify Paystack test mode is enabled

### Confirmation Page Not Loading
- Check payment reference in URL
- Check sessionStorage for `last_booking_ref`
- Verify booking was saved to database

---

## 📊 Monitoring

### Check Console Logs
The form includes helpful console logs:
- `🔄 updateField called:` - State updates
- `💾 Saving state to localStorage:` - State persistence
- `🟦 [StepReview]` - Payment flow logs
- `✅` - Success indicators
- `❌` - Error indicators

### Check Network Tab
Monitor API calls:
- `/api/bookings` - Booking submission
- `/api/bookings/{id}` - Booking fetch
- `/api/cleaners/available` - Cleaner availability
- `/api/customers` - Customer lookup

---

## 🎨 Visual Changes

### What to Look For
- ✅ Clean, modern design
- ✅ Smooth animations
- ✅ Clear error messages
- ✅ Progress indicators
- ✅ Responsive layout
- ✅ Accessible form elements

---

## 📝 Notes

- **State Persistence:** Form state is saved to localStorage automatically
- **Auto-Save:** State saves every 100ms after changes
- **Navigation:** Can navigate back/forward freely
- **Validation:** Real-time validation on all fields
- **Error Recovery:** Multiple fallback mechanisms

---

## 🚀 Quick Access Links

**Local Development:**
- Step 1: http://localhost:3000/booking/service/select
- Step 2: http://localhost:3000/booking/service/standard/details
- Step 3: http://localhost:3000/booking/service/standard/schedule
- Step 4: http://localhost:3000/booking/service/standard/contact
- Step 5: http://localhost:3000/booking/service/standard/select-cleaner
- Step 6: http://localhost:3000/booking/service/standard/review
- Confirmation: http://localhost:3000/booking/confirmation?ref=TEST-REF

---

**Happy Testing! 🎉**

