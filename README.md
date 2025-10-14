# Shalean Cleaning Service Booking System

A modern, full-featured cleaning service booking system built with Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, and Framer Motion.

## Features

✨ **5-Step Booking Wizard**
- Service selection (Standard, Deep, Move In/Out, Airbnb)
- Home details with customizable rooms and extras
- Date & time scheduling
- Contact and address information
- Review and confirmation

🎨 **Modern UI/UX**
- Smooth animations with Framer Motion
- Responsive design (mobile & desktop)
- Sticky booking summary on desktop
- Mobile-friendly sheet drawer for summary
- shadcn/ui components for consistent design

💾 **State Management**
- Automatic localStorage persistence
- Progress saved across page refreshes
- Easy state restoration

💰 **Transparent Pricing**
- Real-time price calculation
- Editable pricing in `lib/pricing.ts`
- Service multipliers (Standard 1x, Deep 1.4x, Move In/Out 1.6x, Airbnb 1.2x)
- Per-bedroom and per-bathroom pricing
- Customizable extras with individual pricing

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + Radix UI
- **Animations**: Framer Motion
- **Forms**: react-hook-form + Zod validation
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, or pnpm package manager

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
├── app/
│   ├── api/bookings/route.ts    # API endpoint for booking submissions
│   ├── booking/
│   │   ├── page.tsx             # Main booking wizard
│   │   └── success/page.tsx     # Success confirmation page
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── stepper.tsx              # Step indicator
│   ├── booking-summary.tsx      # Price summary (sticky/sheet)
│   ├── step-service.tsx         # Step 1: Service selection
│   ├── step-details.tsx         # Step 2: Home details
│   ├── step-schedule.tsx        # Step 3: Date & time
│   ├── step-contact.tsx         # Step 4: Contact info
│   └── step-review.tsx          # Step 5: Review & confirm
├── lib/
│   ├── utils.ts                 # Utility functions
│   ├── pricing.ts               # Pricing logic (editable)
│   └── useBooking.ts            # Booking state hook
└── types/
    └── booking.ts               # TypeScript interfaces
```

## Customizing Pricing

Edit the pricing in `lib/pricing.ts`:

```typescript
export const PRICING = {
  base: 250,                    // Base fee
  perBedroom: 20,               // Per bedroom
  perBathroom: 30,              // Per bathroom
  extras: {
    'Inside Fridge': 60,
    'Inside Oven': 80,
    'Inside Cabinets': 70,
    'Interior Windows': 100,
    'Interior Walls': 120,
    'Ironing': 50,
    'Laundry': 70,
  },
};
```

Service multipliers are applied automatically:
- Standard: 1.0x base
- Deep: 1.4x base
- Move In/Out: 1.6x base
- Airbnb: 1.2x base

## API Integration

The booking submission currently logs to console. To integrate with your backend:

1. Open `app/api/bookings/route.ts`
2. Add your database, email, and payment gateway integration
3. Example integrations to consider:
   - Database: Prisma, MongoDB
   - Email: SendGrid, Resend
   - Payment: Paystack, Stripe

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features to Add

- [ ] Payment gateway integration (Paystack/Stripe)
- [ ] Email confirmations
- [ ] Admin dashboard
- [ ] Booking management
- [ ] Calendar availability
- [ ] Multi-language support
- [ ] SMS notifications

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

## Author

Built for Shalean Cleaning Services

