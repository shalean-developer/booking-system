# Product Requirements Document (PRD)
# Complete Booking Form

**Version:** 1.0  
**Date:** 2025-01-XX  
**Status:** Draft  
**Owner:** Product Team  
**Stakeholders:** Engineering, Design, QA, Customer Support

---

## 1. Executive Summary

This PRD defines the requirements for a complete, robust booking form system that allows customers to book cleaning services from service selection through payment confirmation. The form must be reliable, user-friendly, and handle all edge cases gracefully.

**Business Goals:**
- Increase booking completion rate
- Reduce booking errors and support tickets
- Ensure payment security and reliability
- Provide seamless user experience

**Success Metrics:**
- Booking completion rate > 85%
- Payment success rate > 98%
- Booking error rate < 1%
- Average booking time < 5 minutes

---

## 2. Scope

### 2.1 In Scope
- Service selection (Step 1)
- Home details and extras (Step 2)
- Schedule selection (Step 3)
- Contact information and address (Step 4)
- Cleaner/team selection (Step 5)
- Review and payment (Step 6)
- Payment processing and confirmation
- Form validation at each step
- Error handling and recovery
- State persistence across steps

### 2.2 Out of Scope
- Admin dashboard functionality
- Booking management after confirmation
- Email template customization
- Multi-language support (v1)
- Mobile app integration
- Recurring booking management UI

---

## 3. User Stories

### 3.1 Primary User Flow
**As a customer**, I want to:
1. Select a cleaning service type
2. Specify my home details (bedrooms, bathrooms, extras)
3. Choose a date and time for the service
4. Enter my contact information and service address
5. Select a cleaner or team (or request manual assignment)
6. Review all details and pricing
7. Complete secure payment
8. Receive confirmation with booking details

**Acceptance Criteria:**
- Can complete entire flow in < 5 minutes
- Can navigate back to edit any previous step
- See real-time price updates
- Receive clear error messages if something goes wrong
- Get confirmation immediately after payment

---

## 4. Functional Requirements

### 4.1 Step 1: Service Selection

**FR-1.1: Service Type Selection**
- **Requirement:** User must select one service type from: Standard, Deep, Move In/Out, Airbnb
- **Validation:** Service selection is required to proceed
- **UI:** Visual cards with service descriptions and icons
- **State:** Selected service persists across navigation
- **Error Handling:** Show error if user tries to proceed without selection

**FR-1.2: Service Information Display**
- **Requirement:** Display service-specific information and pricing guidelines
- **UI:** Info card explaining what's included in each service type
- **Content:** Brief description, typical duration, what's included

**FR-1.3: Navigation**
- **Requirement:** "Continue" button only enabled when service is selected
- **Navigation:** Navigate to `/booking/service/{slug}/details` where slug is service-specific

**Acceptance Criteria:**
- ✅ Service selection is required
- ✅ Selected service persists if user navigates back
- ✅ URL reflects selected service
- ✅ Cannot proceed without selection

---

### 4.2 Step 2: Home Details

**FR-2.1: Bedroom Selection**
- **Requirement:** User selects number of bedrooms (0-5+)
- **Default:** 2 bedrooms
- **Validation:** No minimum requirement (studio/0 bedrooms allowed)
- **UI:** Dropdown selector

**FR-2.2: Bathroom Selection**
- **Requirement:** User selects number of bathrooms (1-5+)
- **Default:** 1 bathroom
- **Validation:** Minimum 1 bathroom required
- **UI:** Dropdown selector
- **Error:** Show validation message if 0 bathrooms selected

**FR-2.3: Extra Services Selection**
- **Requirement:** User can select multiple extra services
- **Service-Specific:** Available extras vary by service type:
  - Standard/Airbnb: Inside Fridge, Inside Oven, Laundry, Interior Walls, Interior Windows, Inside Cabinets, Ironing
  - Deep/Move In/Out: All extras including Carpet Cleaning, Ceiling Cleaning, Garage Cleaning, Balcony Cleaning, Couch Cleaning, Outside Window Cleaning
- **Quantity Selection:** Some extras allow quantity selection (Carpet Cleaning, Couch Cleaning, Ceiling Cleaning)
- **Quantity Range:** 1-5 per extra
- **Pricing:** Real-time price updates as extras are selected
- **UI:** Grid of selectable cards with icons, prices, and descriptions

**FR-2.4: Special Instructions**
- **Requirement:** Optional text field for special instructions
- **Character Limit:** 500 characters
- **UI:** Textarea with character counter

**FR-2.5: Navigation**
- **Back:** Navigate to service selection
- **Continue:** Navigate to schedule step (only if bathroom >= 1)
- **Validation:** Disable continue button if bathroom < 1

**Acceptance Criteria:**
- ✅ Minimum 1 bathroom required
- ✅ Extras filtered by service type
- ✅ Quantity extras show quantity selector when selected
- ✅ Price updates in real-time
- ✅ Cannot proceed without valid bathroom count

---

### 4.3 Step 3: Schedule Selection

**FR-3.1: Date Selection**
- **Requirement:** User selects preferred date
- **Date Range:** Today onwards (no past dates)
- **Default:** Today's date
- **UI:** Horizontal scrolling date cards showing next 7 days
- **Navigation:** "Earlier" and "Later" buttons to browse dates
- **Custom Date:** Date picker input to jump to specific date
- **Visual Indicators:** Today highlighted, selected date highlighted

**FR-3.2: Time Slot Selection**
- **Requirement:** User selects preferred arrival time window
- **Time Slots:** Predefined slots grouped by time of day:
  - Early morning (7:00 – 8:30)
  - Mid-morning (9:00 – 10:30)
  - Midday (11:00 – 12:30)
  - Early afternoon (13:00)
- **Past Slots:** Slots in the past for today are hidden
- **UI:** Grid of selectable time buttons
- **Validation:** Both date and time required to proceed

**FR-3.3: Frequency Selection**
- **Requirement:** User can select booking frequency
- **Options:** One-time, Weekly, Bi-weekly, Monthly
- **Pricing Display:** Show pricing for each frequency option
- **Discount Display:** Show discount percentage for recurring bookings
- **Default:** One-time

**FR-3.4: Price Preview**
- **Requirement:** Display estimated total price based on selections
- **Update:** Real-time price updates as frequency changes
- **Breakdown:** Show subtotal, discounts, service fees

**FR-3.5: Navigation**
- **Back:** Navigate to details step
- **Continue:** Navigate to contact step (only if date AND time selected)
- **Validation:** Disable continue button if date or time missing

**Acceptance Criteria:**
- ✅ Cannot select past dates
- ✅ Past time slots hidden for today
- ✅ Both date and time required
- ✅ Frequency pricing displayed
- ✅ Price updates in real-time

---

### 4.4 Step 4: Contact Information

**FR-4.1: Personal Information**
- **Requirement:** Collect customer personal information
- **Fields:**
  - First Name (required, min 2 characters)
  - Last Name (required, min 2 characters)
  - Email (required, valid email format)
  - Phone (required, valid South African format)
- **Validation:**
  - Email: Standard email format validation
  - Phone: Must be 10-11 digits, start with 0, +27, or 27
- **UI:** Form fields with inline validation
- **Error Messages:** Clear, specific error messages for each field

**FR-4.2: Customer Profile Detection**
- **Requirement:** Check if customer exists by email
- **Behavior:** On email blur, check database for existing customer
- **Autofill Prompt:** If customer exists, show prompt to autofill saved information
- **User Choice:** User can accept autofill or enter new details
- **Caching:** Cache customer lookup results to avoid repeated API calls

**FR-4.3: Service Address**
- **Requirement:** Collect service delivery address
- **Fields:**
  - Street Address (required, min 5 characters)
  - Suburb (required, min 2 characters)
  - City (required, min 2 characters)
- **Address Autocomplete:** Use address autocomplete API for street address
- **Autofill:** Autocomplete can populate suburb and city
- **Validation:** All address fields required

**FR-4.4: Form Validation**
- **Requirement:** Validate all fields before allowing submission
- **Real-time:** Show validation errors as user types/blurs fields
- **Submit Validation:** Prevent form submission if any field invalid
- **Error Display:** Inline error messages below each field

**FR-4.5: Navigation**
- **Back:** Navigate to schedule step
- **Continue:** Navigate to cleaner selection step (only if form valid)
- **Validation:** Disable continue button if form invalid

**Acceptance Criteria:**
- ✅ All fields validated before proceeding
- ✅ Email format validated
- ✅ Phone number format validated (SA format)
- ✅ Address autocomplete works
- ✅ Customer autofill prompt appears for existing customers
- ✅ Cannot proceed with invalid form

---

### 4.5 Step 5: Cleaner/Team Selection

**FR-5.1: Service Type Detection**
- **Requirement:** Determine if service requires team assignment
- **Team Services:** Deep cleaning, Move In/Out cleaning
- **Individual Services:** Standard cleaning, Airbnb cleaning
- **Logic:** Automatically set `requires_team` flag based on service type

**FR-5.2: Team Selection (Team Services)**
- **Requirement:** For team services, user selects team
- **Options:** Team A, Team B, Team C
- **UI:** Radio buttons or select dropdown
- **Information:** Display team information and typical team size
- **Note:** Specific cleaners assigned by admin after booking

**FR-5.3: Cleaner Selection (Individual Services)**
- **Requirement:** For individual services, user selects cleaner or requests manual assignment
- **Cleaner List:** Fetch available cleaners based on:
  - Selected date
  - Service city
  - Cleaner availability
- **Display:** Show cleaner cards with:
  - Photo
  - Name
  - Rating (stars)
  - Years of experience
  - Bio/preview
- **Sorting Options:** Recommended, Rating, Experience
- **Filter:** Option to show only top-rated cleaners (4+ stars)

**FR-5.4: Manual Assignment Option**
- **Requirement:** User can request manual assignment
- **UI:** Option to select "Let us assign the best cleaner"
- **Behavior:** Sets `cleaner_id` to 'manual'
- **Note:** Admin will assign cleaner within 24 hours

**FR-5.5: Cleaner Availability**
- **Requirement:** Only show cleaners available for selected date/city
- **API:** Call `/api/cleaners/available?date={date}&city={city}`
- **Loading State:** Show loading indicator while fetching
- **Error Handling:** Show error message if fetch fails
- **Empty State:** Show message if no cleaners available

**FR-5.6: Navigation**
- **Back:** Navigate to contact step
- **Continue:** Navigate to review step
- **Validation:** 
  - Team services: Team selection required
  - Individual services: Cleaner selection OR manual assignment required

**Acceptance Criteria:**
- ✅ Team services show team selection
- ✅ Individual services show cleaner selection
- ✅ Only available cleaners shown
- ✅ Manual assignment option available
- ✅ Selection required before proceeding

---

### 4.6 Step 6: Review and Payment

**FR-6.1: Review Display**
- **Requirement:** Display all booking details for review
- **Sections:**
  - Service Type (with edit button)
  - Home Details: Bedrooms, Bathrooms (with edit button)
  - Additional Services: List of selected extras with quantities and prices (with edit button)
  - Special Instructions: If provided (with edit button)
  - Schedule: Date and time (with edit button)
  - Contact Information: Name, email, phone (with edit button)
  - Service Address: Full address (with edit button)
  - Cleaner/Team Assignment: Selected cleaner or team (with edit button)
- **Edit Functionality:** Each section has "Edit" button that navigates to appropriate step

**FR-6.2: Price Breakdown**
- **Requirement:** Display detailed price breakdown
- **Components:**
  - Service & rooms subtotal
  - Extras total (if any)
  - Service fee (if any)
  - Frequency discount (if recurring)
  - Total amount due
- **Display:** Clear, prominent total amount
- **Currency:** ZAR (R)
- **Format:** Currency formatted with 2 decimal places

**FR-6.3: Price Calculation**
- **Requirement:** Calculate final price accurately
- **Sources:** 
  - Primary: Database pricing (async)
  - Fallback: Client-side pricing (sync)
  - Cache: SessionStorage cached pricing (if < 5 minutes old)
- **Loading State:** Show "Calculating pricing..." if not loaded
- **Error Handling:** Use fallback if database pricing fails

**FR-6.4: Payment Integration**
- **Requirement:** Integrate Paystack payment gateway
- **Payment Button:** "Confirm & Pay R{amount}" button
- **Validation Before Payment:**
  - Pricing must be loaded and valid (> 0)
  - Email must be provided and valid
  - Paystack must be loaded
  - Paystack public key must be configured
  - All required fields must be filled:
    - Service type
    - Date and time
    - Contact information (name, email, phone)
    - Address (line1, suburb, city)
    - Cleaner/team selection (for non-team services)
- **Payment Reference:** Generate unique reference per payment attempt
- **Format:** `BK-{timestamp}-{random}`

**FR-6.5: Payment Processing**
- **Requirement:** Process payment securely via Paystack
- **Flow:**
  1. User clicks "Confirm & Pay"
  2. Validate all requirements
  3. Lock pricing amount (prevent changes during payment)
  4. Initialize Paystack payment popup
  5. User completes payment in popup
  6. On success: Save booking, send emails, redirect to confirmation
  7. On failure: Show error, allow retry
  8. On close: Show cancellation message
- **Loading State:** Show loading indicator during payment processing
- **Error Handling:** Display clear error messages

**FR-6.6: Booking Submission**
- **Requirement:** Save booking after successful payment
- **API:** POST to `/api/bookings`
- **Payload:** Complete booking state + payment reference + pricing
- **Payment Verification:** API re-verifies payment with Paystack
- **Success:** Redirect to confirmation page with booking reference
- **Failure:** Show error, store booking reference for recovery

**FR-6.7: Error Recovery**
- **Requirement:** Handle payment success but booking save failure
- **Scenario:** Payment succeeds but booking save fails
- **Actions:**
  - Store payment reference in sessionStorage
  - Store booking state in sessionStorage
  - Show error message with recovery instructions
  - Provide retry mechanism
  - Store reference for manual recovery

**FR-6.8: Navigation**
- **Back:** Navigate to cleaner selection step
- **Payment:** Process payment (if all validations pass)
- **Edit:** Navigate to appropriate step for each section

**Acceptance Criteria:**
- ✅ All booking details displayed correctly
- ✅ Price breakdown accurate
- ✅ Payment button disabled until all validations pass
- ✅ Payment reference unique per attempt
- ✅ Payment processing secure
- ✅ Error recovery works if booking save fails
- ✅ Redirect to confirmation after success

---

### 4.7 Payment Confirmation

**FR-7.1: Confirmation Page**
- **Requirement:** Single confirmation page (consolidate `/booking/confirmation` and `/booking/success`)
- **Route:** `/booking/confirmation?ref={payment_reference}`
- **Loading State:** Show loading while fetching booking details
- **Error Handling:** Handle cases where booking not found

**FR-7.2: Booking Details Display**
- **Requirement:** Display confirmed booking details
- **Information:**
  - Booking reference
  - Service type
  - Date and time
  - Service address
  - Cleaner/team assignment
  - Total amount paid
  - Payment status
- **Format:** Clear, organized layout

**FR-7.3: Payment Confirmation**
- **Requirement:** Confirm payment was successful
- **Display:** Prominent payment success indicator
- **Details:** Payment method, amount, reference
- **Receipt:** Link to download receipt

**FR-7.4: Email Confirmation**
- **Requirement:** Display email confirmation status
- **Information:** Confirmation email sent to customer email
- **Resend:** Button to resend confirmation email
- **Status:** Show success/loading states

**FR-7.5: Next Steps**
- **Requirement:** Provide clear next steps
- **Information:**
  - Check email for confirmation
  - Be available 15 minutes before service
  - Contact information for changes
- **Actions:** Links to manage booking, book another service

**FR-7.6: Fallback Handling**
- **Requirement:** Handle cases where booking not immediately available
- **Scenario:** Payment succeeded but booking not yet saved
- **Actions:**
  - Check sessionStorage for booking reference
  - Show "Payment successful, processing booking" message
  - Poll for booking availability
  - Provide contact information

**Acceptance Criteria:**
- ✅ Single confirmation page (no duplicates)
- ✅ Booking details displayed correctly
- ✅ Payment confirmation clear
- ✅ Email resend works
- ✅ Fallback handling works

---

## 5. Non-Functional Requirements

### 5.1 Performance
- **NFR-1:** Form should load in < 2 seconds
- **NFR-2:** Price calculations should complete in < 500ms
- **NFR-3:** Payment initialization should happen in < 1 second
- **NFR-4:** Page transitions should be instant (< 100ms)

### 5.2 Reliability
- **NFR-5:** Payment success rate > 98%
- **NFR-6:** Booking save success rate > 99.5%
- **NFR-7:** Form state persistence across page refreshes
- **NFR-8:** Graceful degradation if external services fail

### 5.3 Security
- **NFR-9:** All payment data encrypted in transit (HTTPS)
- **NFR-10:** Payment references never exposed in logs
- **NFR-11:** Customer data validated server-side
- **NFR-12:** Payment verification required before booking confirmation

### 5.4 Usability
- **NFR-13:** Form should be completable in < 5 minutes
- **NFR-14:** Clear error messages for all validation failures
- **NFR-15:** Progress indicator showing current step
- **NFR-16:** Ability to navigate back to edit previous steps

### 5.5 Accessibility
- **NFR-17:** WCAG 2.1 AA compliance
- **NFR-18:** Keyboard navigation support
- **NFR-19:** Screen reader support
- **NFR-20:** Focus indicators visible

---

## 6. Technical Requirements

### 6.1 State Management
- **TR-1:** Use centralized booking state (useBooking hook)
- **TR-2:** Persist state to localStorage
- **TR-3:** State should sync across components
- **TR-4:** State should reset after successful booking

### 6.2 API Integration
- **TR-5:** Pricing API: `/api/pricing` or client-side calculation
- **TR-6:** Cleaner availability API: `/api/cleaners/available`
- **TR-7:** Customer lookup API: `/api/customers?email={email}`
- **TR-8:** Booking submission API: `/api/bookings` (POST)
- **TR-9:** Booking fetch API: `/api/bookings/{id}` (GET)
- **TR-10:** Payment verification: Paystack API

### 6.3 Payment Integration
- **TR-11:** Use Paystack payment gateway
- **TR-12:** Payment popup (no redirect)
- **TR-13:** Payment reference format: `BK-{timestamp}-{random}`
- **TR-14:** Currency: ZAR
- **TR-15:** Amount in cents (multiply by 100)

### 6.4 Validation
- **TR-16:** Client-side validation for UX
- **TR-17:** Server-side validation for security
- **TR-18:** Real-time validation feedback
- **TR-19:** Validation schemas using Zod

### 6.5 Error Handling
- **TR-20:** Try-catch blocks around all async operations
- **TR-21:** User-friendly error messages
- **TR-22:** Error logging for debugging
- **TR-23:** Retry mechanisms for transient failures

---

## 7. Validation Rules

### 7.1 Service Selection
- Service type: Required, must be one of: Standard, Deep, Move In/Out, Airbnb

### 7.2 Home Details
- Bedrooms: Required, integer 0-5+
- Bathrooms: Required, integer 1-5+ (minimum 1)
- Extras: Optional, array of valid extra service names
- Extras quantities: Object mapping extra names to integers 1-5

### 7.3 Schedule
- Date: Required, ISO date string, must be today or future
- Time: Required, string matching time slot format (HH:MM)
- Frequency: Required, one of: 'one-time', 'weekly', 'bi-weekly', 'monthly'

### 7.4 Contact Information
- First Name: Required, string, min 2 characters
- Last Name: Required, string, min 2 characters
- Email: Required, valid email format
- Phone: Required, valid SA phone format (10-11 digits, starts with 0/+27/27)
- Address Line1: Required, string, min 5 characters
- Suburb: Required, string, min 2 characters
- City: Required, string, min 2 characters

### 7.5 Cleaner Selection
- Team services: Team selection required (Team A, B, or C)
- Individual services: Cleaner ID required OR manual assignment ('manual')

### 7.6 Payment
- Pricing: Required, total > 0
- Payment reference: Required, unique format
- Email: Required, valid format
- All previous steps: Must be completed

---

## 8. Error Handling

### 8.1 Validation Errors
- **Display:** Inline error messages below fields
- **Style:** Red text, clear message
- **Prevention:** Disable submit/continue buttons until valid

### 8.2 API Errors
- **Network Errors:** Show "Network error, please try again"
- **Server Errors:** Show "Server error, please contact support"
- **Timeout Errors:** Show timeout message with retry option

### 8.3 Payment Errors
- **Payment Failed:** Show error, allow retry
- **Payment Cancelled:** Show cancellation message
- **Payment Success but Booking Failed:** Show error with recovery instructions

### 8.4 State Errors
- **State Loss:** Restore from localStorage if available
- **Invalid State:** Reset to initial state
- **Corrupted State:** Clear and restart

---

## 9. Edge Cases

### 9.1 Navigation Edge Cases
- **EC-1:** User navigates back during payment → Cancel payment, allow navigation
- **EC-2:** User closes browser during booking → Restore state from localStorage
- **EC-3:** User opens multiple tabs → Each tab has independent state
- **EC-4:** User uses browser back button → Update step accordingly

### 9.2 Payment Edge Cases
- **EC-5:** Payment succeeds but network fails before booking save → Store reference, show recovery UI
- **EC-6:** Payment popup blocked → Show instructions to allow popups
- **EC-7:** Payment timeout → Show timeout message, allow retry
- **EC-8:** Duplicate payment attempt → Prevent duplicate submissions

### 9.3 Data Edge Cases
- **EC-9:** Cleaner becomes unavailable between selection and payment → Show warning, allow reselection
- **EC-10:** Price changes between steps → Use locked price at payment initiation
- **EC-11:** Date becomes unavailable → Validate date before payment
- **EC-12:** Customer email already exists → Show autofill prompt

---

## 10. Success Criteria

### 10.1 Functional Success
- ✅ All 6 steps complete without errors
- ✅ Payment processes successfully
- ✅ Booking saved to database
- ✅ Confirmation emails sent
- ✅ User reaches confirmation page

### 10.2 Quality Success
- ✅ Zero critical bugs
- ✅ < 1% booking error rate
- ✅ > 98% payment success rate
- ✅ > 85% booking completion rate
- ✅ All validations working correctly

### 10.3 User Experience Success
- ✅ Average booking time < 5 minutes
- ✅ Clear error messages
- ✅ Smooth navigation
- ✅ Real-time price updates
- ✅ Mobile-responsive design

---

## 11. Dependencies

### 11.1 External Services
- Paystack payment gateway
- Supabase database
- Resend email service
- Address autocomplete API

### 11.2 Internal Dependencies
- Pricing calculation service
- Cleaner availability service
- Customer lookup service
- Booking API

### 11.3 Libraries
- React Hook Form (form management)
- Zod (validation)
- Paystack React SDK
- Date-fns (date handling)

---

## 12. Out of Scope (Future Enhancements)

- Multi-language support
- Booking modification after confirmation
- Guest checkout without account
- Social login integration
- Booking cancellation from confirmation page
- Real-time cleaner availability updates
- Advanced filtering for cleaners
- Booking history integration
- Promo code support
- Gift card support

---

## 13. Testing Requirements

### 13.1 Unit Tests
- Form validation logic
- Price calculation functions
- State management functions
- Utility functions

### 13.2 Integration Tests
- API endpoint integration
- Payment flow integration
- State persistence
- Navigation flow

### 13.3 E2E Tests
- Complete booking flow
- Payment processing
- Error scenarios
- Edge cases

### 13.4 Manual Testing
- Cross-browser testing
- Mobile device testing
- Accessibility testing
- Payment testing (test mode)

---

## 14. Rollout Plan

### 14.1 Phase 1: Critical Fixes
- Fix confirmation page routing
- Fix payment reference generation
- Add comprehensive validation
- Fix step update race conditions

### 14.2 Phase 2: Enhancements
- Improve error recovery
- Add retry mechanisms
- Enhance loading states
- Improve error messages

### 14.3 Phase 3: Polish
- Remove console.logs
- Improve accessibility
- Add analytics
- Performance optimization

---

## 15. Appendix

### 15.1 Glossary
- **Booking State:** Complete booking information stored in localStorage
- **Payment Reference:** Unique identifier for payment transaction
- **Cleaner ID:** UUID of assigned cleaner or 'manual' for manual assignment
- **Team Service:** Service requiring team assignment (Deep, Move In/Out)
- **Individual Service:** Service with single cleaner (Standard, Airbnb)

### 15.2 References
- Error Report: `BOOKING_FLOW_ERRORS_REPORT.md`
- Paystack Documentation: https://paystack.com/docs
- Design System: [Link to design system]
- API Documentation: [Link to API docs]

---

**Document Status:** Draft  
**Last Updated:** 2025-01-XX  
**Next Review:** After implementation

