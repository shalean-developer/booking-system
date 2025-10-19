# 🔧 Available Jobs Troubleshooting Guide

## Problem
Bookings exist in the database but are not appearing in the "Available Jobs" section of the cleaner dashboard.

## Root Cause
For a booking to appear in "Available Jobs", it must meet **ALL** of these conditions:

1. ✅ `cleaner_id` must be `NULL` (not assigned to any cleaner)
2. ✅ `status` must be `'pending'`
3. ✅ `booking_date` must be **today or in the future**
4. ✅ The booking's `address_city` or `address_suburb` must **match** at least one of the cleaner's service areas

## Step-by-Step Fix

### Step 1: Diagnose the Problem

Run this diagnostic query in your Supabase SQL Editor:

```sql
-- Run this file:
supabase/quick-diagnose-jobs.sql
```

This will show you:
- All your bookings and their status
- All cleaners and their service areas
- Which bookings don't match any cleaner areas

### Step 2: Identify the Issue

Look at the output and identify which condition is failing:

#### Issue A: Cleaner Already Assigned
**Symptom:** `cleaner_id` is not NULL

**Fix:**
```sql
UPDATE bookings
SET cleaner_id = NULL
WHERE id = 'your-booking-id';
```

#### Issue B: Wrong Status
**Symptom:** `status` is not 'pending' (e.g., 'confirmed', 'completed', 'cancelled')

**Fix:**
```sql
UPDATE bookings
SET status = 'pending'
WHERE id = 'your-booking-id';
```

#### Issue C: Past Date
**Symptom:** `booking_date` is in the past

**Fix:**
```sql
UPDATE bookings
SET booking_date = '2025-10-20'  -- Set to future date
WHERE id = 'your-booking-id';
```

#### Issue D: Location Mismatch
**Symptom:** Booking location doesn't match cleaner's service areas

**Example:**
- Cleaner services: `['Johannesburg', 'Pretoria', 'Sandton']`
- Booking has: `address_city = 'Cape Town'`
- Result: ❌ Won't show up

**Fix Option 1:** Update booking location
```sql
UPDATE bookings
SET 
  address_city = 'Johannesburg',
  address_suburb = 'Sandton'
WHERE id = 'your-booking-id';
```

**Fix Option 2:** Update cleaner areas
```sql
UPDATE cleaners
SET areas = ARRAY['Johannesburg', 'Pretoria', 'Cape Town']
WHERE id = 'your-cleaner-id';
```

### Step 3: Quick Fix All Bookings

If you want to make **ALL** bookings available immediately:

```sql
-- Run this file:
supabase/make-bookings-available.sql
```

This will:
- Set all `cleaner_id` to NULL
- Set all `status` to 'pending'
- Move past dates to tomorrow
- You'll still need to fix location matching manually

### Step 4: Verify the Fix

After making changes, run this verification query:

```sql
-- Check what bookings should now appear for a specific cleaner
-- Replace 'YOUR_CLEANER_ID' with actual ID

SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.address_city,
  b.address_suburb,
  b.service_type,
  c.areas as cleaner_service_areas
FROM bookings b
CROSS JOIN cleaners c
WHERE c.id = 'YOUR_CLEANER_ID'
  AND b.cleaner_id IS NULL
  AND b.status = 'pending'
  AND b.booking_date >= CURRENT_DATE
  AND (
    EXISTS (
      SELECT 1
      FROM unnest(c.areas) as area
      WHERE LOWER(b.address_city) LIKE '%' || LOWER(area) || '%'
         OR LOWER(b.address_suburb) LIKE '%' || LOWER(area) || '%'
    )
  );
```

### Step 5: Refresh the Dashboard

After fixing the database:
1. Go to the cleaner dashboard
2. Click the "Refresh" button (🔄) in the Available Jobs section
3. Bookings should now appear!

## Common Scenarios

### Scenario 1: Test Booking Not Showing
```sql
-- Create a test booking that will definitely show up
INSERT INTO bookings (
  id,
  booking_date,
  booking_time,
  service_type,
  customer_name,
  customer_phone,
  customer_email,
  address_line1,
  address_city,
  address_suburb,
  total_amount,
  status,
  cleaner_id
) VALUES (
  gen_random_uuid(),
  CURRENT_DATE + interval '1 day',  -- Tomorrow
  '10:00',
  'Standard Cleaning',
  'Test Customer',
  '+27123456789',
  'test@example.com',
  '123 Test Street',
  'Johannesburg',  -- Make sure this matches cleaner's areas
  'Sandton',
  15000,  -- R150.00
  'pending',
  NULL  -- No cleaner assigned
);
```

### Scenario 2: Multiple Cleaners, Different Areas
```sql
-- Cleaner 1 services Johannesburg area
UPDATE cleaners
SET areas = ARRAY['Johannesburg', 'Sandton', 'Rosebank']
WHERE phone = '+27123456789';

-- Cleaner 2 services Pretoria area
UPDATE cleaners
SET areas = ARRAY['Pretoria', 'Centurion', 'Hatfield']
WHERE phone = '+27987654321';

-- Create booking for Johannesburg (only Cleaner 1 will see it)
INSERT INTO bookings (...) VALUES (..., 'Johannesburg', ...);

-- Create booking for Pretoria (only Cleaner 2 will see it)
INSERT INTO bookings (...) VALUES (..., 'Pretoria', ...);
```

### Scenario 3: Import Existing Bookings

If you have bookings from your main system that need to be available:

```sql
-- Make all customer bookings available for cleaners to claim
UPDATE bookings
SET 
  cleaner_id = NULL,
  status = 'pending'
WHERE 
  status IN ('confirmed', 'scheduled')
  AND booking_date >= CURRENT_DATE
  AND cleaner_id IS NULL;
```

## Testing Checklist

- [ ] Bookings have `cleaner_id = NULL`
- [ ] Bookings have `status = 'pending'`
- [ ] Bookings have `booking_date` >= today
- [ ] Bookings `address_city` or `address_suburb` matches cleaner's `areas`
- [ ] Cleaner is logged in to the dashboard
- [ ] Clicked refresh button in Available Jobs
- [ ] Bookings appear in the list!

## Quick Reference: SQL Files

| File | Purpose |
|------|---------|
| `supabase/quick-diagnose-jobs.sql` | Diagnose what's wrong |
| `supabase/make-bookings-available.sql` | Quick fix to make bookings available |
| `supabase/fix-available-jobs.sql` | Detailed fix options with explanations |

## Still Not Working?

If bookings still don't appear after following this guide:

1. **Check browser console** (F12) for any errors
2. **Check Network tab** to see the API response from `/api/cleaner/bookings/available`
3. **Verify cleaner session** - make sure the cleaner is logged in properly
4. **Check cleaner availability** - ensure `is_available = true` in cleaners table

### Debug API Response

Open browser console and run:
```javascript
fetch('/api/cleaner/bookings/available')
  .then(r => r.json())
  .then(data => console.log('Available bookings:', data));
```

This will show you exactly what the API is returning.

## Need More Help?

Check these files for more details:
- `app/api/cleaner/bookings/available/route.ts` - The API endpoint code
- `components/cleaner/available-bookings.tsx` - The frontend component
- `CLEANERS_DASHBOARD_COMPLETE.md` - Full cleaner system documentation

