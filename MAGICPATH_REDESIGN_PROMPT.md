# MagicPath Redesign Prompt: Complete Booking Flow Redesign

## Context
Redesign the complete booking flow from service selection through confirmation in the `feature/simplify-booking-summary` branch. This includes all steps of the booking process: service details, scheduling, contact information, cleaner selection (if applicable), review/payment, and confirmation page.

## Complete Booking Flow Overview

The booking flow consists of the following steps:

### Step 1: Service Details (`components/booking-v2/step-service-details.tsx`)
- Service type selection (Standard, Deep, Move In/Out, Airbnb, Carpet)
- Property details (bedrooms, bathrooms)
- Extras/add-ons selection with quantities
- Equipment provision option (Standard/Airbnb)
- Carpet-specific details (for Carpet service)
- Notes/comments field
- Service frequency selection (one-time, weekly, bi-weekly, monthly)

### Step 2: Schedule (`components/booking-v2/step-schedule-cleaner.tsx`)
- Date selection with availability checking
- Time slot selection
- Frequency confirmation (if recurring booking)
- Surge pricing indicators (if applicable)

### Step 3: Contact Information (`components/booking-v2/step-contact.tsx`)
- First name, last name (required)
- Email address (required)
- Phone number (required, South African format validation)
- Address collection with autocomplete
- Suburb and city selection

### Step 4: Cleaner Selection (`components/booking-v2/step-cleaner.tsx`) - Optional
- Individual cleaner selection (Standard/Airbnb services)
- Team selection (for services requiring teams)
- Cleaner profiles with photos, ratings, experience
- Manual assignment option

### Step 5: Review & Payment (`components/booking-v2/step-review.tsx`)
- Complete booking summary display
- Contact information review/entry
- Tip selection for cleaner
- Discount code application
- Pricing breakdown (subtotal, fees, discounts, tips)
- Payment processing via Paystack
- Edit capabilities for previous steps

### Step 6: Confirmation (`app/booking/confirmation/page.tsx`)
- Booking confirmation message
- Booking details summary
- Payment confirmation
- Next steps information
- Booking reference number

## Technical Stack
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **UI Library**: React with Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion
- **Payment**: Paystack (react-paystack)
- **State Management**: Custom hooks (`useBookingV2`, `useBookingPath`)
- **Icons**: Lucide React
- **Date Formatting**: date-fns

## Key Requirements to Maintain

### Step 1: Service Details Requirements
- **Service Selection**: Clear service type cards with descriptions
- **Property Details**: Bedroom/bathroom inputs with validation
- **Extras Management**: Add-ons with quantity selection, price display
- **Equipment Option**: Toggle for equipment provision (Standard/Airbnb)
- **Carpet Details**: Specialized form for carpet-specific services
- **Frequency Selection**: Recurring booking options with pricing impact
- **Notes Field**: Optional comments/instructions

### Step 2: Schedule Requirements
- **Date Picker**: Calendar interface with availability restrictions
- **Time Slots**: Available time selection based on date/service
- **Surge Pricing**: Visual indicators for high-demand periods
- **Frequency Display**: Show selected frequency for recurring bookings

### Step 3: Contact Requirements
- **Form Fields**: First name, last name, email, phone (all required)
- **Validation**: Client-side validation with Zod schemas
- **Address Autocomplete**: Integrated address search component
- **City/Suburb**: Dropdown or autocomplete for location

### Step 4: Cleaner Selection Requirements
- **Cleaner Profiles**: Display cleaner cards with photos, ratings, experience
- **Availability**: Show cleaner availability for selected date/time
- **Team Selection**: Option for team-based services
- **Manual Assignment**: Fallback option for admin assignment

### Step 5: Review & Payment Requirements
- **Complete Summary**: All booking details clearly displayed
- **Contact Review**: Ability to edit contact info if needed
- **Tip Selection**: Pre-defined amounts + custom option
- **Discount Codes**: Input with validation and error handling
- **Pricing Breakdown**: Detailed cost breakdown with all fees
- **Payment Integration**: Paystack payment flow with error handling
- **Edit Navigation**: Links to go back and edit previous steps

### Step 6: Confirmation Requirements
- **Success Message**: Clear confirmation of booking
- **Booking Details**: Complete summary of what was booked
- **Payment Confirmation**: Payment reference and status
- **Next Steps**: What happens next, contact information
- **Booking Reference**: Display booking ID for future reference

### Cross-Step Requirements
- **State Management**: `useBookingV2()` hook for shared state
- **Navigation**: `useBookingPath()` hook for route generation
- **Pricing Calculations**: Real-time pricing updates across steps
- **Form Validation**: Consistent validation patterns
- **Loading States**: Proper loading indicators during API calls
- **Error Handling**: Clear error messages and recovery options
- **Mobile Responsiveness**: Excellent mobile experience throughout

## Design Goals

### Simplify & Modernize Entire Flow
- **Consistent Design Language**: Unified visual style across all steps
- **Progressive Enhancement**: Show booking summary/sidebar on all steps (where applicable)
- **Better Navigation**: Clear step indicators, back/next buttons, progress tracking
- **Mobile-First**: Excellent mobile experience for all steps
- **Visual Polish**: Modern design with proper spacing, typography, and color usage
- **Accessibility**: WCAG compliance, proper ARIA labels, keyboard navigation throughout

### Suggested Improvements by Step

#### Step 1 (Service Details)
- **Visual Service Cards**: Better service type selection with icons/imagery
- **Simplified Extras**: Clearer add-on selection with pricing visible
- **Smart Defaults**: Pre-fill common selections
- **Inline Pricing**: Show pricing impact in real-time

#### Step 2 (Schedule)
- **Better Calendar UX**: Modern date picker with availability clearly marked
- **Time Slot Grid**: Visual time slot selection
- **Surge Indicators**: Clear but non-intrusive surge pricing warnings

#### Step 3 (Contact)
- **Two-Column Layout**: Split form and booking summary side-by-side on desktop
- **Better Form UX**: 
  - Improved input styling and focus states
  - Inline validation feedback
  - Clearer required field indicators
- **Address Autocomplete**: Better integration and UI

#### Step 4 (Cleaner)
- **Cleaner Cards**: Enhanced cleaner profiles with better imagery
- **Availability Badges**: Clear availability indicators
- **Comparison View**: Easy cleaner comparison (if multiple available)

#### Step 5 (Review)
- **Two-Column Layout**: Contact form and summary side-by-side
- **Progressive Disclosure**: Collapse less critical sections by default
- **Enhanced Summary**:
  - Visual pricing breakdown
  - Better grouping of booking details
  - More prominent total display
- **Streamlined Payment**:
  - Clearer CTA button
  - Better security indicators
  - Improved discount code UX

#### Step 6 (Confirmation)
- **Celebration UI**: Engaging success experience
- **Clear Information Hierarchy**: Most important info first
- **Action Items**: Clear next steps and CTAs
- **Share Options**: Easy way to share booking confirmation

## Design Specifications

### Color Scheme
- Primary: Blue (#2563EB - blue-600)
- Success: Green (for discounts)
- Error: Red (for errors)
- Background: Light gray (#F9FAFB)
- Cards: White with subtle shadows

### Typography
- Headings: Bold, clear hierarchy
- Body: Readable, appropriate sizes
- Labels: Semibold, clearly distinguishable

### Spacing & Layout
- Container: max-w-7xl with proper padding
- Cards: Rounded-2xl with shadow-sm
- Form inputs: Proper padding and border radius
- Consistent spacing between sections

## Component Structure to Maintain

### Shared Hooks & Utilities
```typescript
- useBookingV2() - Central booking state management
- useBookingPath() - Navigation path generation
- useBookingFormData() - Dynamic form data fetching
- usePaystackPayment() - Payment initialization (review step only)
```

### Key Components
- `AddressAutocomplete` - Address input component
- `BookingSummaryV2` - Booking summary sidebar/component
- `ServiceSelector` - Service type selection
- `HouseDetailsForm` - Property details form
- `ExtrasSelector` - Add-ons selection
- `ScheduleSelector` - Date/time picker
- `SuburbModal` - Suburb selection modal

### Navigation Flow
```typescript
// Step progression
1. Service Details → Schedule
2. Schedule → Contact (or Cleaner if applicable)
3. Contact → Cleaner (if applicable) → Review
4. Cleaner → Review
5. Review → Confirmation (after payment)
```

## Files to Modify

### Primary Components
1. **Step 1**: `components/booking-v2/step-service-details.tsx`
2. **Step 2**: `components/booking-v2/step-schedule-cleaner.tsx`
3. **Step 3**: `components/booking-v2/step-contact.tsx`
4. **Step 4**: `components/booking-v2/step-cleaner.tsx`
5. **Step 5**: `components/booking-v2/step-review.tsx`
6. **Step 6**: `app/booking/confirmation/page.tsx` (or `app/booking-v2/confirmation/page.tsx` if it exists)

### Supporting Components (if needed)
- `components/booking-v2/booking-summary.tsx` - Summary sidebar
- `components/booking-v2/stepper.tsx` - Step indicator
- `components/booking-v2/service-selector.tsx`
- `components/booking-v2/house-details-form.tsx`
- `components/booking-v2/extras-selector.tsx`
- `components/booking-v2/schedule-selector.tsx`

### Dependencies (Maintain Compatibility)
- `lib/useBookingV2.ts` - State management
- `lib/useBookingPath.ts` - Navigation helpers
- `lib/pricing.ts` - Pricing calculations
- `lib/booking-utils.ts` - Utility functions
- `components/address-autocomplete.tsx` - Address input

## Testing Considerations

### End-to-End Flow
- Test complete booking flow from service selection to confirmation
- Verify state persistence across steps
- Test navigation (forward and backward) between steps
- Ensure data is correctly passed between steps

### Step-Specific Testing
- **Step 1**: Service selection, extras, pricing calculations
- **Step 2**: Date/time availability, surge pricing display
- **Step 3**: Form validation, address autocomplete
- **Step 4**: Cleaner selection, team assignment
- **Step 5**: Payment flow, discount codes, tip selection
- **Step 6**: Confirmation display, booking reference

### Cross-Cutting Concerns
- Mobile responsiveness across all steps
- Accessibility (keyboard navigation, screen readers)
- Error handling and recovery
- Loading states and transitions
- Form validation consistency
- Pricing accuracy across all steps

## Deliverables

### Required
1. **Redesigned Step Components**: All 6 steps with improved UX/UI
2. **Maintained Functionality**: All existing features preserved
3. **Consistent Design**: Unified design language across all steps
4. **Improved Code Organization**: Clean, maintainable code structure
5. **Enhanced Visual Design**: Modern aesthetics while keeping brand consistency
6. **Mobile Optimization**: Excellent experience on all device sizes
7. **Accessibility**: WCAG 2.1 AA compliance

### Nice to Have
- Booking summary sidebar/persistent component across steps
- Improved step indicator/progress bar
- Better error states and recovery flows
- Optimistic UI updates where appropriate

## Branch
Work in: `feature/simplify-booking-summary`

## Priority Order
If redesigning in phases, recommended order:
1. **Phase 1**: Step 5 (Review) - Most critical, payment conversion
2. **Phase 2**: Step 3 (Contact) - User input critical
3. **Phase 3**: Steps 1 & 2 (Service Details & Schedule) - Core booking flow
4. **Phase 4**: Steps 4 & 6 (Cleaner & Confirmation) - Enhancements

---

**Please redesign the complete booking flow with a focus on simplicity, modern aesthetics, improved user experience, and consistency across all steps while maintaining all existing functionality and integrations.**
