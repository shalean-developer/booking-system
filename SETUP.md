# Quick Setup Guide

Follow these steps to get your Shalean Cleaning Booking System up and running.

## Option 1: Fresh Installation (Recommended)

If you haven't installed dependencies yet:

```bash
# Install all dependencies
npm install

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## Option 2: Manual Installation

If you prefer to install step-by-step:

```bash
# 1. Install Next.js dependencies
npm install react react-dom next typescript @types/react @types/node @types/react-dom

# 2. Install Tailwind CSS
npm install tailwindcss postcss autoprefixer
npm install tailwindcss-animate

# 3. Install UI dependencies
npm install lucide-react framer-motion
npm install clsx tailwind-merge class-variance-authority

# 4. Install Radix UI components
npm install @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-select
npm install @radix-ui/react-popover @radix-ui/react-dialog @radix-ui/react-checkbox
npm install @radix-ui/react-separator

# 5. Install form handling
npm install react-hook-form zod @hookform/resolvers

# 6. Install date utilities
npm install date-fns react-day-picker

# 7. Run the development server
npm run dev
```

## What's Included

✅ Complete 5-step booking wizard
✅ Beautiful landing page
✅ Success confirmation page
✅ API endpoint for bookings
✅ LocalStorage persistence
✅ Mobile-responsive design
✅ Smooth animations
✅ Form validation
✅ Real-time pricing calculator

## File Structure

```
shalean/
├── app/                    # Next.js app router pages
│   ├── api/bookings/      # API endpoint
│   ├── booking/           # Wizard pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── step-*.tsx        # Wizard step components
├── lib/                   # Utilities and hooks
│   ├── pricing.ts        # 💰 Edit pricing here!
│   ├── useBooking.ts     # State management
│   └── utils.ts          # Helpers
└── types/                 # TypeScript types
    └── booking.ts        # Data models
```

## Testing the App

1. **Landing Page** (`/`)
   - Click "Book a Cleaning" button

2. **Step 1: Service** (`/booking`)
   - Choose a service type (Standard, Deep, Move In/Out, Airbnb)

3. **Step 2: Details**
   - Add bedrooms and bathrooms
   - Select extra services
   - Add special instructions

4. **Step 3: Schedule**
   - Pick a date from the calendar
   - Choose a time slot (07:00 - 13:00)

5. **Step 4: Contact**
   - Fill in your contact information
   - Enter service address

6. **Step 5: Review**
   - Review all details
   - Click "Confirm Booking"
   - See success page (`/booking/success`)

## Customization

### Change Pricing

Edit `lib/pricing.ts`:

```typescript
export const PRICING = {
  base: 250,        // Change base price
  perBedroom: 20,   // Change per bedroom
  perBathroom: 30,  // Change per bathroom
  extras: {
    'Inside Fridge': 60,     // Edit or add extras
    'Inside Oven': 80,
    // Add more...
  },
};
```

### Change Colors

Edit `tailwind.config.ts` or `app/globals.css` to change the primary color from blue (#0C53ED) to your brand color.

### Modify Time Slots

Edit `lib/pricing.ts` and change the `generateTimeSlots()` function to customize available hours.

## API Integration

Currently, bookings are logged to the console. To integrate with a real backend:

1. Open `app/api/bookings/route.ts`
2. Add database code to save bookings
3. Add email service to send confirmations
4. Add payment gateway (Paystack/Stripe)

Example:
```typescript
export async function POST(req: Request) {
  const booking = await req.json();
  
  // Save to database
  await db.bookings.create({ data: booking });
  
  // Send email
  await sendEmail(booking.email, 'Booking Confirmed', ...);
  
  // Create payment link
  const payment = await paystack.createPayment(...);
  
  return NextResponse.json({ ok: true, paymentUrl: payment.url });
}
```

## Troubleshooting

### Port 3000 is already in use
```bash
# Use a different port
npm run dev -- -p 3001
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### TypeScript errors
```bash
# Check TypeScript
npx tsc --noEmit
```

## Next Steps

- [ ] Add environment variables for API keys
- [ ] Set up a database (Prisma + PostgreSQL/MongoDB)
- [ ] Integrate payment gateway
- [ ] Add email service
- [ ] Deploy to Vercel/Netlify
- [ ] Set up analytics
- [ ] Add unit tests

## Support

For questions or issues, refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Happy Coding! 🚀**

