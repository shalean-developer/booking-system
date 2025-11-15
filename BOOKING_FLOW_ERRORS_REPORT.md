# Booking Flow Error Report
## Comprehensive Scan: Service Selection → Payment Confirmation

**Date:** Generated during code review  
**Scope:** Complete booking flow from step 1 (service selection) through payment confirmation

---

## 🔴 CRITICAL ERRORS

### 1. **Inconsistent Confirmation Page Routes**
**Location:** `components/step-review.tsx:349`  
**Issue:** After successful payment, redirects to `/booking/confirmation` but there's also a `/booking/success` page. Both exist and handle similar functionality but differently.
- `step-review.tsx` redirects to `/booking/confirmation`
- `app/booking/success/page.tsx` exists and expects `?ref=` parameter
- `app/booking/confirmation/page.tsx` also exists and expects `?ref=` or `?id=` parameter
- **Impact:** Users may be redirected to wrong page or see inconsistent UI

**Files Affected:**
- `components/step-review.tsx:349`
- `app/booking/success/page.tsx`
- `app/booking/confirmation/page.tsx`

---

### 2. **Payment Reference Reuse Risk**
**Location:** `components/step-review.tsx:272-274`  
**Issue:** Payment reference is generated once per component mount using `useState(() => ...)`. If user navigates back and forward, the same reference could be reused.
```typescript
const [paymentReference] = useState(
  () => `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
);
```
- **Impact:** Potential duplicate payment references if user navigates back/forward
- **Fix Needed:** Generate fresh reference on each payment attempt or when component mounts for review step

---

### 3. **Missing Payment Amount Validation**
**Location:** `components/step-review.tsx:895-908`  
**Issue:** Payment button checks if pricing is loaded but doesn't validate that the amount sent to Paystack matches the calculated total. If pricing updates after button click, mismatch could occur.
- **Impact:** User could be charged wrong amount if pricing changes between validation and payment
- **Fix Needed:** Lock pricing amount when payment button is clicked, before Paystack initialization

---

### 4. **Step Number Mismatch in Review Page**
**Location:** `app/booking/service/[slug]/review/page.tsx:39`  
**Issue:** Review page sets step to 6, but the actual flow has:
- Step 1: Service Selection
- Step 2: Details  
- Step 3: Schedule
- Step 4: Contact
- Step 5: Select Cleaner
- Step 6: Review ✓

**However:** Contact page navigation goes directly to cleaner selection (step 5), skipping step 4 validation check.
- **Impact:** Step validation may fail if user navigates directly

---

### 5. **Missing Cleaner Selection Validation**
**Location:** `components/step-review.tsx`  
**Issue:** Review page doesn't validate that a cleaner is selected for non-team bookings before allowing payment. User can proceed to payment without selecting a cleaner for Standard/Airbnb services.
- **Impact:** Bookings can be created without cleaner assignment
- **Fix Needed:** Add validation: `if (!requiresTeam && !cleaner_id && cleaner_id !== 'manual') { show error }`

---

## 🟡 HIGH PRIORITY ERRORS

### 6. **Email Validation Missing Before Payment**
**Location:** `components/step-review.tsx:933-940`  
**Issue:** Email is checked for existence but not validated for format before payment initialization.
- **Impact:** Invalid email could be sent to Paystack
- **Current Check:** `if (!state.email)` - only checks existence
- **Fix Needed:** Validate email format using regex or zod schema

---

### 7. **Race Condition in Step Updates**
**Location:** Multiple page components  
**Issue:** Each page component updates step in `useEffect` after checking `isLoaded`, but navigation happens immediately via `router.push()`. This creates a race condition where:
1. User clicks "Continue"
2. `router.push()` navigates immediately
3. Target page's `useEffect` runs and updates step
4. If user navigates back quickly, step might be wrong

**Files Affected:**
- `app/booking/service/[slug]/details/page.tsx:36-46`
- `app/booking/service/[slug]/schedule/page.tsx:35-45`
- `app/booking/service/[slug]/contact/page.tsx:33-43`
- `app/booking/service/[slug]/select-cleaner/page.tsx:35-45`
- `app/booking/service/[slug]/review/page.tsx:32-42`

---

### 8. **Inconsistent API Route Usage**
**Location:** `app/booking/success/page.tsx:132` vs `app/booking/confirmation/page.tsx:69`  
**Issue:** 
- Success page: `fetch(\`/api/bookings/${ref}\`)`
- Confirmation page: `fetch(\`/api/bookings/${id}\`)`
- Both expect same response format but use different parameter names
- **Impact:** Confusion in codebase, potential bugs if API changes

---

### 9. **Missing Error Recovery for Payment Success but Booking Save Failure**
**Location:** `components/step-review.tsx:350-378`  
**Issue:** If payment succeeds but booking save fails, error is shown but:
- Payment reference is stored in sessionStorage
- User is not redirected anywhere
- No clear path to recovery
- **Impact:** User paid but booking not saved, stuck on review page

---

### 10. **Paystack Public Key Not Validated at Build Time**
**Location:** `components/step-review.tsx:393, 925`  
**Issue:** `process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` is checked at runtime but not validated. If missing, error only shows when user clicks payment button.
- **Impact:** Poor UX - user fills entire form only to discover payment is broken
- **Fix Needed:** Validate environment variable on page load and show warning

---

## 🟢 MEDIUM PRIORITY ERRORS

### 11. **Missing Required Field Validation Before Payment**
**Location:** `components/step-review.tsx`  
**Issue:** Payment button doesn't validate all required fields before allowing payment:
- Missing: `firstName`, `lastName`, `phone`, `address.line1`, `address.suburb`, `address.city`
- Only validates: `email`, `pricing`, `PaystackHook`
- **Impact:** Incomplete bookings could be submitted

---

### 12. **Date/Time Validation Missing**
**Location:** `components/step-review.tsx`  
**Issue:** Review page doesn't validate that `date` and `time` are set before allowing payment.
- **Impact:** Bookings could be created without schedule

---

### 13. **Service Type Validation Missing**
**Location:** `components/step-review.tsx`  
**Issue:** Review page doesn't validate that `service` is set before allowing payment.
- **Impact:** Bookings could be created without service type

---

### 14. **Duplicate Slug Mapping Functions**
**Location:** Multiple files  
**Issue:** `serviceTypeToSlug()` and `slugToServiceType()` functions are duplicated across multiple files:
- `app/booking/service/select/service-select-content.tsx:13-22`
- `app/booking/service/[slug]/details/page.tsx:15-25`
- `app/booking/service/[slug]/schedule/page.tsx:14-24`
- `app/booking/service/[slug]/contact/page.tsx:12-22`
- `app/booking/service/[slug]/select-cleaner/page.tsx:14-24`
- `app/booking/service/[slug]/review/page.tsx:11-21`
- `components/step-review.tsx:20-29`
- `components/step-details.tsx:59-69`
- `components/step-schedule.tsx:20-29`
- `components/step-contact.tsx:21-30`
- `components/step-select-cleaner.tsx:16-25`

**Impact:** Code duplication, maintenance burden, potential inconsistencies

---

### 15. **Missing Loading State During Payment Processing**
**Location:** `components/step-review.tsx:277-379`  
**Issue:** `onPaymentSuccess` callback sets `isSubmitting` but if Paystack popup closes before callback fires, loading state might persist.
- **Impact:** UI stuck in loading state

---

### 16. **No Retry Mechanism for Failed Booking Save**
**Location:** `components/step-review.tsx:350-378`  
**Issue:** If booking save fails after payment success, there's no retry button. User must refresh and lose progress.
- **Impact:** Poor UX for error recovery

---

### 17. **SessionStorage Fallback May Expire**
**Location:** `app/booking/success/page.tsx:67-88`  
**Issue:** Cached booking data in sessionStorage has 5-minute expiry, but if user takes longer to reach success page, data is lost.
- **Impact:** Success page shows error even though payment succeeded

---

### 18. **Missing Validation for Address Fields**
**Location:** `components/step-contact.tsx`  
**Issue:** Address autocomplete sets `line1`, `suburb`, and `city` but doesn't validate all are filled before allowing navigation to next step.
- **Impact:** Incomplete addresses could be submitted

---

### 19. **Phone Number Validation Too Permissive**
**Location:** `components/step-contact.tsx:36-43`  
**Issue:** Phone validation allows formats starting with `0`, `+27`, or `27` but doesn't validate:
- Minimum length properly (allows 10 digits but SA numbers need 10-11)
- Maximum length
- **Impact:** Invalid phone numbers could be accepted

---

### 20. **Missing Cleaner Availability Re-validation**
**Location:** `components/step-review.tsx`  
**Issue:** Review page doesn't re-check cleaner availability before payment. Cleaner could become unavailable between selection and payment.
- **Impact:** Booking created with unavailable cleaner

---

## 🔵 LOW PRIORITY / CODE QUALITY ISSUES

### 21. **Console.log Statements in Production Code**
**Location:** Multiple files  
**Issue:** Extensive console.log statements throughout booking flow:
- `components/step-review.tsx` - 20+ console.log statements
- `lib/useBooking.ts` - console.log statements
- `app/api/bookings/route.ts` - console.log statements
- **Impact:** Performance, security (exposes internal state), clutter

---

### 22. **Missing Type Safety for Payment Reference**
**Location:** `components/step-review.tsx:277`  
**Issue:** `reference` parameter in `onPaymentSuccess` is typed as `any`.
- **Impact:** Type safety issues

---

### 23. **Hardcoded Currency**
**Location:** `components/step-review.tsx:394`  
**Issue:** Currency is hardcoded as `'ZAR'` instead of using configuration.
- **Impact:** Difficult to support multiple currencies

---

### 24. **Missing Accessibility Labels**
**Location:** Payment button in `components/step-review.tsx:876-988`  
**Issue:** Payment button doesn't have `aria-label` or `aria-describedby` for screen readers.
- **Impact:** Accessibility issues

---

### 25. **Error Messages Not Internationalized**
**Location:** All error messages  
**Issue:** All error messages are hardcoded in English.
- **Impact:** No support for other languages

---

## 📊 SUMMARY

**Total Errors Found:** 25
- 🔴 Critical: 5
- 🟡 High Priority: 5  
- 🟢 Medium Priority: 10
- 🔵 Low Priority: 5

**Most Critical Issues:**
1. Inconsistent confirmation page routes (2 pages doing same thing)
2. Payment reference reuse risk
3. Missing payment amount validation
4. Missing cleaner selection validation
5. Race conditions in step updates

**Recommended Fix Order:**
1. Fix confirmation page routing (consolidate to one page)
2. Fix payment reference generation
3. Add comprehensive validation before payment
4. Fix step update race conditions
5. Add error recovery mechanisms

---

## 🔍 ADDITIONAL OBSERVATIONS

### Potential Edge Cases Not Handled:
1. User closes browser during payment
2. Network failure during booking save after payment
3. Multiple tabs open with same booking flow
4. Browser back button during payment
5. Payment succeeds but email sending fails (handled but could be better)

### Missing Features:
1. Booking cancellation from confirmation page
2. Edit booking details after confirmation
3. Payment retry mechanism
4. Booking status polling on confirmation page
5. Real-time cleaner availability updates

---

**End of Report**

