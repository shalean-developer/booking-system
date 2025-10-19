# Cleaners Dashboard - Setup & Usage Guide

## Overview

The Cleaners Dashboard is a comprehensive mobile-responsive system that allows cleaners to:
- Login with phone number (password or SMS OTP)
- View and manage assigned bookings
- Claim available bookings in their service areas
- Track booking status (pending → in-progress → completed)
- Rate customers after job completion
- Track location for proximity-based job matching
- Toggle availability status

## Installation

### 1. Install Dependencies

```bash
npm install
```

New packages added:
- `bcryptjs` - Password hashing
- `@types/bcryptjs` - TypeScript types
- `@radix-ui/react-switch` - Toggle component
- `@radix-ui/react-avatar` - Avatar component

### 2. Database Migration

Run the migration to add cleaner authentication and tracking features:

```bash
# Using Supabase CLI
supabase db push

# Or apply the migration file manually in Supabase Dashboard
# File: supabase/migrations/cleaners-auth.sql
```

This adds:
- Authentication fields to `cleaners` table (password_hash, otp_code, etc.)
- Location tracking fields (last_location_lat, last_location_lng)
- `customer_ratings` table for cleaner ratings of customers
- Booking tracking timestamps (claimed_at, started_at, completed_at)
- RLS policies for cleaner access control

### 3. Setup Test Cleaner Account

You need to add a cleaner to the database with authentication credentials:

```sql
-- Add a test cleaner with password authentication
-- Password: "test123" (hashed)
INSERT INTO cleaners (
  name,
  phone,
  email,
  areas,
  photo_url,
  rating,
  bio,
  years_experience,
  specialties,
  is_active,
  is_available,
  password_hash,
  auth_provider
) VALUES (
  'John Doe',
  '+27123456789',
  'john@example.com',
  ARRAY['Cape Town', 'Sea Point', 'Green Point'],
  null,
  5.0,
  'Experienced professional cleaner',
  5,
  ARRAY['Deep cleaning', 'Move-in/out'],
  true,
  true,
  '$2a$10$rYvxPPEQK3HVZ8YJYGvZJOuB5xvBmJXLMvQXxJ8QH7KXJJqXLCLCK', -- "test123"
  'both'
);
```

Or use bcrypt to hash your own password:

```javascript
const bcrypt = require('bcryptjs');
const password = 'your-password';
const hash = bcrypt.hashSync(password, 10);
console.log(hash);
```

## Usage

### Cleaner Login

Navigate to `/cleaner/login`

**Two authentication methods:**

1. **Password Login**
   - Enter phone number (e.g., `+27123456789` or `0123456789`)
   - Enter password
   - Click "Sign In"

2. **SMS OTP Login**
   - Enter phone number
   - Click "Send Verification Code"
   - Enter 6-digit OTP (logged to console in development)
   - Click "Verify & Sign In"

### Dashboard Features

#### 1. Header
- Cleaner profile info (name, photo, rating)
- Availability toggle (Available/Not Available)
- Logout button

#### 2. Location Tracking
- Auto-requests GPS permission
- Updates location every 2 minutes
- Shows tracking status

#### 3. Quick Stats
- Today's Bookings count
- Completed Today count
- Today's Earnings (in Rands)

#### 4. My Bookings Tab
Shows bookings assigned to the cleaner:

**Upcoming Bookings:**
- Status: pending or in-progress
- Actions:
  - **Start Job** - Mark booking as in-progress
  - **Complete Job** - Mark as completed (opens rating modal)
  - **Call Customer** - Direct phone call
  - **Open Maps** - Navigate to address
  - **View Details** - Full booking information

**Completed Bookings:**
- Past completed jobs
- Can rate customer if not already rated

#### 5. Available Jobs Tab
Shows unassigned bookings in cleaner's service areas:

**Features:**
- Filter by date
- Sorted by date/time
- Shows distance (if location enabled)
- **Claim Job** button - Assigns booking to cleaner

**Filters:**
- Date filter for specific dates
- Automatically filtered by service areas
- Proximity-based (when location enabled)

#### 6. Customer Rating
After completing a job:
- 5-star rating system
- Optional comment
- Skip option

## API Routes

### Authentication
- `POST /api/cleaner/auth/login` - Password login
- `POST /api/cleaner/auth/send-otp` - Send OTP code
- `POST /api/cleaner/auth/verify-otp` - Verify OTP and login
- `POST /api/cleaner/auth/logout` - Logout

### Bookings
- `GET /api/cleaner/bookings` - Get assigned bookings
  - Query params: `status`, `startDate`, `endDate`
- `GET /api/cleaner/bookings/available` - Get available bookings
  - Query params: `date`, `lat`, `lng`, `maxDistance`
- `POST /api/cleaner/bookings/[id]/claim` - Claim a booking
- `PATCH /api/cleaner/bookings/[id]/status` - Update booking status
- `POST /api/cleaner/bookings/[id]/rate` - Rate customer

### Location & Availability
- `POST /api/cleaner/location` - Update location
  - Body: `{ latitude, longitude }`
- `GET /api/cleaner/location` - Get current location
- `PATCH /api/cleaner/availability` - Toggle availability
  - Body: `{ is_available: boolean }`
- `GET /api/cleaner/availability` - Get availability status

## Mobile Responsiveness

The dashboard is 100% mobile-responsive:
- Touch-friendly buttons (min 44px)
- Collapsible mobile menu
- Responsive grid layouts
- Swipeable tabs
- Mobile-first design
- Bottom navigation spacing

### Tested Breakpoints
- Mobile: 320px - 640px
- Tablet: 640px - 1024px
- Desktop: 1024px+

## Security Features

1. **Session Management**
   - HTTP-only cookies
   - 7-day session duration
   - Server-side validation

2. **Password Security**
   - Bcrypt hashing (10 salt rounds)
   - Minimum password requirements

3. **OTP Security**
   - 6-digit codes
   - 5-minute expiration
   - Rate limiting (3 attempts per 15 minutes)
   - Cleared after use

4. **RLS Policies**
   - Cleaners can only access their own data
   - Cleaners can only view bookings in their areas
   - Protected customer information

## SMS Integration (Production)

For production, integrate with an SMS provider:

**Recommended: Twilio**

1. Sign up at https://www.twilio.com
2. Get Account SID and Auth Token
3. Add to `.env.local`:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

4. Update `app/api/cleaner/auth/send-otp/route.ts`:
   ```typescript
   import twilio from 'twilio';
   
   const client = twilio(
     process.env.TWILIO_ACCOUNT_SID,
     process.env.TWILIO_AUTH_TOKEN
   );
   
   await client.messages.create({
     body: `Your Shalean verification code is: ${otp}`,
     from: process.env.TWILIO_PHONE_NUMBER,
     to: normalizedPhone,
   });
   ```

## Troubleshooting

### "Unauthorized" Error
- Check if cleaner session cookie is set
- Verify phone number matches database
- Try logging out and back in

### OTP Not Working
- Check console for OTP code (development)
- Verify phone number is in database
- Check OTP hasn't expired (5 minutes)
- Verify `auth_provider` includes 'otp' or 'both'

### Location Not Updating
- Allow location permissions in browser
- Check HTTPS connection (required for geolocation)
- Verify API route is accessible

### Bookings Not Showing
- Check cleaner's `areas` array matches booking locations
- Verify RLS policies are applied
- Check booking status (available = null cleaner_id)

## Development vs Production

### Development
- OTP codes logged to console
- Returns OTP in API response
- Less strict validation

### Production
- OTP sent via SMS (Twilio)
- No OTP in responses
- Rate limiting enforced
- HTTPS required for geolocation

## Testing Checklist

- [ ] Login with password
- [ ] Login with OTP
- [ ] View assigned bookings
- [ ] Start a job
- [ ] Complete a job
- [ ] Rate a customer
- [ ] View available jobs
- [ ] Claim a job
- [ ] Toggle availability
- [ ] Location tracking works
- [ ] Mobile responsive on phone
- [ ] Call customer works
- [ ] Open maps works
- [ ] Logout works

## File Structure

```
app/
├── cleaner/
│   ├── login/
│   │   └── page.tsx              # Login page with dual auth
│   └── dashboard/
│       ├── page.tsx              # Server component (auth check)
│       └── dashboard-client.tsx  # Main dashboard
├── api/cleaner/
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── send-otp/route.ts
│   │   ├── verify-otp/route.ts
│   │   └── logout/route.ts
│   ├── bookings/
│   │   ├── route.ts              # Get assigned bookings
│   │   ├── available/route.ts    # Get available bookings
│   │   └── [id]/
│   │       ├── claim/route.ts
│   │       ├── status/route.ts
│   │       └── rate/route.ts
│   ├── location/route.ts
│   └── availability/route.ts

components/cleaner/
├── cleaner-header.tsx            # Header with avatar, logout
├── availability-toggle.tsx       # Availability switch
├── location-tracker.tsx          # GPS tracking component
├── booking-card.tsx              # Reusable booking card
├── booking-details-modal.tsx     # Full booking details
├── rate-customer-modal.tsx       # Customer rating modal
├── my-bookings.tsx               # My Bookings tab
└── available-bookings.tsx        # Available Jobs tab

lib/
└── cleaner-auth.ts               # Auth helper functions

supabase/migrations/
└── cleaners-auth.sql             # Database migration
```

## Support

For issues or questions:
- Check console for error messages
- Review API responses in Network tab
- Verify database records in Supabase
- Check RLS policies are applied

## Next Steps

1. Install dependencies: `npm install`
2. Run migration: Apply `cleaners-auth.sql`
3. Create test cleaner account
4. Test login at `/cleaner/login`
5. Explore dashboard features
6. Integrate SMS provider (production)
7. Test on mobile devices
8. Deploy to production

