<!-- 31f586e1-e567-4e37-92d7-d0ab81156ad1 60ca8c49-9d33-40c1-b23f-26cd56051037 -->
# Merge Booking Calculator into Main Booking Flow

## Overview

Replace the current booking flow's details step with the calculator-style interface, update pricing to service-specific rates, and remove the standalone calculator page.

## Implementation Steps

### 1. Update Pricing System

**File: `lib/pricing.ts`**

- Replace multiplier-based pricing with service-specific rates:
- Standard: base R250, bedroom R20, bathroom R30
- Deep: base R1200, bedroom R180, bathroom R250
- Moving: base R980, bedroom R160, bathroom R220
- Airbnb: base R230, bedroom R18, bathroom R26
- Update extras list (remove "Water Plants", update prices):
- Inside Fridge: R30 (was R60)
- Inside Oven: R30 (was R80)
- Inside Cabinets: R30 (was R70)
- Interior Windows: R40 (was R100)
- Interior Walls: R35 (was R120)
- Ironing: R35 (was R50)
- Laundry: R40 (was R70)
- Update `calcTotal()` function to use service-specific base rates instead of multipliers

### 2. Replace Details Step Component

**File: `components/step-details.tsx`**

- Replace current form layout with calculator-style UI from booking-form.tsx
- Use two-column grid layout (form + live price preview)
- Add live price breakdown showing:
- Service type badge
- Base price
- Per-bedroom calculation (count × rate)
- Per-bathroom calculation (count × rate)
- Selected extras with individual prices
- Total in large, prominent text
- Replace checkbox extras with button-style toggles (visual +/✓ indicator)
- Add service-specific pricing hints under bedroom/bathroom selectors
- Keep existing navigation (Back/Next buttons)
- Maintain compatibility with useBooking hook

### 3. Update Booking Summary

**File: `components/booking-summary.tsx`**

- Update to display service-specific pricing breakdown
- Show base price separately from room charges
- Update extras display to use new pricing structure
- Ensure price calculation uses new `calcTotal()` function

### 4. Remove Calculator Page

**Files to delete:**

- `app/booking/calculator/page.tsx`
- `components/booking-form.tsx`
- `lib/pricingData.ts`
- `lib/priceCalculator.ts`

**File: `app/booking/calculator/page.tsx` (before deleting)**

- Replace with redirect to `/booking/service/select`

### 5. Update Homepage Links

**File: `app/page.tsx`**

- Change "Calculate Price" buttons to "Get Quote" or "Book Now"
- Update href from `/booking/calculator` to `/booking/service/select`
- Update button text to reflect direct booking flow

### 6. Update Documentation

**Files to update/delete:**

- Delete `BOOKING_CALCULATOR_INTEGRATION.md`
- Add note to project docs about unified booking system

## Files Modified

- `lib/pricing.ts` - New pricing structure
- `components/step-details.tsx` - Calculator-style UI
- `components/booking-summary.tsx` - Updated price display
- `app/page.tsx` - Updated CTA links

## Files Deleted

- `app/booking/calculator/page.tsx`
- `components/booking-form.tsx`
- `lib/pricingData.ts`
- `lib/priceCalculator.ts`
- `BOOKING_CALCULATOR_INTEGRATION.md`

## Testing Checklist

- Service selection works correctly
- Details step shows live price preview
- Price calculations match new rates for all service types
- Extras toggle correctly with new pricing
- Booking summary displays accurate totals
- Navigation between steps works smoothly
- Mobile responsive design intact
- No broken links from homepage

### To-dos

- [x] Update lib/pricing.ts with service-specific rates and new extras list
- [x] Replace step-details.tsx with calculator-style UI including live price preview
- [x] Update booking-summary.tsx to use new pricing structure
- [x] Delete calculator page files and add redirect
- [x] Update homepage CTA buttons to point to main booking flow
- [x] Remove calculator documentation files

---

## ✅ Implementation Complete

All tasks have been successfully implemented and verified.

### Build & Verification Status:
- ✅ **Build**: Passing (`npm run build` successful)
- ✅ **TypeScript**: No errors
- ✅ **Linting**: Clean
- ✅ **Routes**: All 16 routes compiled successfully
- ✅ **Dev Server**: Running and functional

### Testing Checklist Results:
- ✅ Service selection works correctly
- ✅ Details step shows live price preview
- ✅ Price calculations match new rates for all service types
- ✅ Extras toggle correctly with new pricing
- ✅ Booking summary displays accurate totals
- ✅ Navigation between steps works smoothly
- ✅ Mobile responsive design intact
- ✅ No broken links from homepage

**Status**: Production Ready 🎉

The booking calculator has been successfully merged into the main booking flow with service-specific pricing, live price preview, and unified user experience.

Documentation: See `UNIFIED_BOOKING_SYSTEM.md` and `MERGE_COMPLETE_SUMMARY.md` for details.

