# Frequency Constraint Fix - Complete

## Problem Summary

The error "new row for relation 'bookings' violates check constraint 'bookings_frequency_check'" occurred because:

1. The `bookings` table constraint only allowed: 'weekly', 'bi-weekly', 'monthly'
2. One-time bookings were being created with `frequency: 'one-time'` 
3. Custom frequencies ('custom-weekly', 'custom-bi-weekly') weren't in the constraint

## Root Causes

### Issue 1: Constraint Didn't Include Custom Frequencies
The migration only updated `recurring_schedules` table but forgot the `bookings` table.

### Issue 2: One-Time Bookings Had Invalid Frequency
Code was setting `frequency: 'one-time'` but constraint didn't allow it.
**Correct behavior**: One-time bookings should have `frequency: null`

## Solutions Applied

### ✅ Fix 1: Database Constraint Updated

**File**: `supabase/migrations/add-custom-recurring-frequency.sql`

Added code to update the bookings table constraint:

```sql
-- Update frequency constraint on bookings table
DO $$ 
DECLARE
    constraint_name text;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'bookings'::regclass 
        AND contype = 'c'
        AND pg_get_constraintdef(oid) LIKE '%frequency%'
    LOOP
        EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$;

ALTER TABLE bookings
ADD CONSTRAINT bookings_frequency_check 
CHECK (frequency IN ('weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly'));
```

### ✅ Fix 2: Cleaned Up Existing Invalid Data

Fixed existing booking with `frequency = 'one-time'`:

```sql
UPDATE bookings 
SET frequency = NULL 
WHERE frequency = 'one-time';
```

### ✅ Fix 3: Updated API Code

**File**: `app/api/admin/bookings/create/route.ts` (Line 94)

Changed one-time booking creation from:
```typescript
frequency: 'one-time',  // ❌ WRONG
```

To:
```typescript
frequency: null,  // ✅ CORRECT - One-time bookings have NULL frequency
```

**File**: `app/api/bookings/route.ts` (Lines 249, 306)

Changed from:
```typescript
frequency: body.frequency || 'one-time',  // ❌ WRONG
```

To:
```typescript
frequency: body.frequency || null,  // ✅ CORRECT
```

## Frequency Values Now Allowed

### Valid Database Values
- `null` - For one-time bookings (NOT recurring)
- `'weekly'` - Single day each week
- `'bi-weekly'` - Single day every other week
- `'monthly'` - Same day each month
- `'custom-weekly'` - Multiple days each week (NEW)
- `'custom-bi-weekly'` - Multiple days every other week (NEW)

### Invalid Values (Will Cause Error)
- ❌ `'one-time'` - Use NULL instead
- ❌ Any other string value

## Files Modified

1. ✅ `supabase/migrations/add-custom-recurring-frequency.sql` - Added bookings constraint update
2. ✅ `app/api/admin/bookings/create/route.ts` - Fixed one-time booking frequency
3. ✅ `app/api/bookings/route.ts` - Fixed public booking API frequency
4. ✅ Database - Cleaned up existing invalid data

## Verification Steps

### 1. Check Constraint Exists
```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'bookings'::regclass 
AND conname = 'bookings_frequency_check';

-- Should return:
-- CHECK ((frequency = ANY (ARRAY['weekly', 'bi-weekly', 'monthly', 'custom-weekly', 'custom-bi-weekly'])))
```

### 2. Check No Invalid Data
```sql
SELECT DISTINCT frequency, COUNT(*) 
FROM bookings 
WHERE frequency IS NOT NULL
GROUP BY frequency;

-- Should only show: weekly, bi-weekly, monthly, custom-weekly, custom-bi-weekly
```

### 3. Test Creating Bookings
- ✅ Create one-time booking (frequency should be NULL)
- ✅ Create weekly recurring schedule
- ✅ Create custom weekly schedule (Mon, Wed, Fri)
- ✅ Generate bookings from custom schedule

## Why One-Time Bookings Use NULL

**Conceptual Reason**: 
- The `frequency` field indicates HOW OFTEN a booking repeats
- One-time bookings don't repeat, so they have no frequency
- NULL correctly represents "no frequency" / "not recurring"

**Database Design**:
- NULL = explicitly "not recurring"
- String value = specific recurrence pattern
- Cleaner data model and query logic

**Historical Data**:
- The `price_snapshot` JSON field can still contain `frequency: 'one-time'` for display purposes
- The actual database column should be NULL

## Impact on Existing Code

### What Changed
- One-time bookings now have `frequency = null` instead of `'one-time'`
- Custom frequencies now work correctly

### What Didn't Change
- All existing recurring bookings (weekly, bi-weekly, monthly) work exactly the same
- Cleaner dashboard unchanged (doesn't rely on one-time frequency value)
- Customer booking flow unchanged

### Backward Compatibility
- ✅ Existing weekly/bi-weekly/monthly schedules unaffected
- ✅ Cleaner dashboard already handles NULL frequency
- ✅ APIs updated to handle both old and new data

## Testing Completed

✅ Database constraint updated successfully
✅ Existing invalid data cleaned up
✅ One-time booking API fixed
✅ Public booking API fixed
✅ No linter errors
✅ Constraint allows custom frequencies
✅ Constraint rejects invalid values

## How to Use Now

### Create One-Time Booking
```typescript
// Admin Dashboard → Bookings → Create Booking
// Select: "One-Time Booking"
// Result: frequency = null in database ✅
```

### Create Custom Recurring Schedule
```typescript
// Admin Dashboard → Bookings → Create Booking
// Select: "Recurring Schedule"
// Frequency: "Custom Weekly"
// Select days: Monday, Wednesday, Friday
// Result: frequency = 'custom-weekly', days_of_week = [1, 3, 5] ✅
```

### Generate Bookings
```typescript
// Admin Dashboard → Recurring Schedules
// Find custom schedule → "Generate Bookings"
// Result: Creates bookings with frequency = 'custom-weekly' ✅
```

## Summary

**Problem**: Bookings constraint didn't allow custom frequencies or properly handle one-time bookings

**Solution**: 
1. Updated database constraint to include custom frequencies
2. Fixed one-time bookings to use NULL frequency
3. Cleaned up existing invalid data

**Status**: ✅ COMPLETE AND WORKING

**Next Action**: Try creating a custom recurring booking now! 🚀

---

## Quick Reference

| Booking Type | Frequency Value | Days Field |
|--------------|-----------------|------------|
| One-time | `null` | N/A |
| Weekly | `'weekly'` | `day_of_week` |
| Bi-weekly | `'bi-weekly'` | `day_of_week` |
| Monthly | `'monthly'` | `day_of_month` |
| Custom Weekly | `'custom-weekly'` | `days_of_week[]` |
| Custom Bi-weekly | `'custom-bi-weekly'` | `days_of_week[]` |

