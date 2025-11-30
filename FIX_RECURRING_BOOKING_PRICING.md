# Fix Recurring Booking Pricing

This guide explains how to fix bookings that were generated with incorrect pricing.

## Problem

Some recurring bookings were generated with wrong pricing (e.g., R304) because the cron job was calculating pricing instead of using the stored pricing from `recurring_schedules`.

## Solution

You have two options to fix the pricing:

### Option 1: SQL Script (Recommended for Bulk Fixes)

**File:** `supabase/fix-recurring-booking-pricing.sql`

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file `supabase/fix-recurring-booking-pricing.sql`
3. Run **Step 1** first to preview what will be changed
4. Review the results to ensure they look correct
5. Run **Step 3** to actually update the bookings
6. Run **Step 4** to verify the updates

**Advantages:**
- Fast for large numbers of bookings
- Can preview changes before applying
- Transparent about what's being changed

### Option 2: API Endpoint (Easier, Programmatic)

**Endpoint:** `POST /api/admin/recurring-schedules/fix-pricing`

**Step 1: Preview (Dry Run)**
```bash
curl -X POST https://your-domain.com/api/admin/recurring-schedules/fix-pricing \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

This will show you:
- How many bookings need fixing
- Preview of first 10 bookings
- Current vs correct pricing

**Step 2: Actually Fix the Bookings**
```bash
curl -X POST https://your-domain.com/api/admin/recurring-schedules/fix-pricing \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

**Advantages:**
- Easy to use
- Can be called from admin dashboard
- Returns detailed results

## What Gets Fixed

The fix updates:
1. **total_amount** - Set to match the schedule's `total_amount`
2. **cleaner_earnings** - Set to match the schedule's `cleaner_earnings` (if set)
3. **price_snapshot.total** - Updated to reflect correct total
4. **price_snapshot.manual_pricing** - Set to `true`
5. **price_snapshot.pricing_fixed_at** - Timestamp of when it was fixed

## Safety

- Both methods only update bookings that have a `recurring_schedule_id` and where the schedule has `total_amount` set
- The API endpoint defaults to `dryRun: true` to prevent accidental updates
- The SQL script has preview steps before the actual update

## Verification

After running the fix, verify by:

1. Check a few bookings in the admin dashboard
2. Compare `total_amount` with the schedule's `total_amount`
3. Look for `pricing_fixed_at` in the `price_snapshot` field

## Example Response (API)

**Dry Run:**
```json
{
  "ok": true,
  "message": "DRY RUN: Found 59 bookings that need pricing fixes",
  "dryRun": true,
  "wouldFix": 59,
  "preview": [
    {
      "booking_id": "...",
      "current_total": 30400,
      "correct_total": 30400,
      "current_cleaner_earnings": null,
      "correct_cleaner_earnings": 15240
    }
  ],
  "total": 59
}
```

**Actual Fix:**
```json
{
  "ok": true,
  "message": "Fixed pricing for 59 booking(s)",
  "fixed": 59,
  "total": 59,
  "errors": []
}
```

