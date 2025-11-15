<!-- 6100e01c-521d-40d0-8817-b659c91178d4 3b42991b-e497-4dac-9b2d-31705d0436c4 -->
# Map Old Booking URLs to New Booking Flow

## Overview

Add Next.js rewrites configuration to internally route old booking URLs to the new booking flow. Users will see the new booking flow content when visiting old URLs, but the URL in the browser will remain unchanged.

## Implementation Steps

### 1. Add Rewrites to next.config.js

Add a `rewrites()` function to `next.config.js` that maps old booking routes to new booking routes:

**File**: `next.config.js`

**Route Mappings**:

- `/booking/service/select` → `/booking-v2/select`
- `/booking/service/:slug/details` → `/booking-v2/:slug/details`
- `/booking/service/:slug/schedule` → `/booking-v2/:slug/schedule`
- `/booking/service/:slug/contact` → `/booking-v2/:slug/contact`
- `/booking/service/:slug/select-cleaner` → `/booking-v2/:slug/cleaner`
- `/booking/service/:slug/review` → `/booking-v2/:slug/review`
- `/booking/confirmation` → `/booking-v2/confirmation`

**Implementation**:

- Add `async rewrites()` function after `async redirects()` in next.config.js
- Use Next.js rewrite syntax with `source` and `destination`
- Handle dynamic `[slug]` parameter mapping
- Ensure rewrites work alongside existing redirects

### 2. Verify Route Compatibility

Ensure the new booking flow components can handle the old URL structure:

- Check that `[slug]` parameter handling is compatible
- Verify layout components work with rewritten routes
- Test that state management (useBookingV2) works correctly

### 3. Handle Edge Cases

- Old booking flow pages remain accessible via direct file access (if needed)
- Confirmation page handles both old and new booking references
- Any query parameters are preserved through rewrites

## Files to Modify

1. `next.config.js` - Add rewrites configuration

## Testing Checklist

- [ ] `/booking/service/select` shows new booking flow
- [ ] `/booking/service/standard/details` shows new details page
- [ ] `/booking/service/standard/schedule` shows new schedule page
- [ ] `/booking/service/standard/contact` shows new contact page
- [ ] `/booking/service/standard/select-cleaner` shows new cleaner page
- [ ] `/booking/service/standard/review` shows new review page
- [ ] `/booking/confirmation` shows new confirmation page
- [ ] URLs remain unchanged in browser address bar
- [ ] Both `/booking-v2/*` and `/booking/*` routes work independently