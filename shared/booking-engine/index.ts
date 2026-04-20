/**
 * Single source of truth for booking math, payloads, and scheduling helpers.
 * Use `calculateBooking` from here — it delegates to `calculateFinalBookingPrice`.
 */

export {
  MAX_BOOKING_DAYS_FROM_TODAY,
  DAYS_OF_WEEK,
  toDateStr,
  parseDateStr,
  daysFromTodayStart,
  isAllowedBookingDate,
  offsetForDateToBeVisible,
  getSevenDaysStartingOffset,
  formatWeekRangeLabel,
  formatSelectedDateLong,
} from './booking-dates';

export {
  apiServiceToWizardService,
  buildDashboardWizardShim,
  aggregateExtraIdsToQuantities,
} from './dashboard-pricing-bridge';

export {
  BOOKING_TEAM_NAMES,
  isBookingTeamName,
  sanitizeSelectedTeamInput,
  selectedTeamFromTeamSelection,
  type BookingTeam,
  type BookingTeamName,
  type TeamSelection,
} from './booking-team-names';

export {
  calculateBooking,
  computeLinePricingFromWizard,
  resolveWizardNumberOfCleaners,
} from './calculate';
export type { BookingCalculateInput, BookingPriceResult } from './calculate';

export {
  getOptimalTeamSize,
  getDashboardOptimalTeamSize,
  getWizardOptimalTeamBreakdown,
  type OptimalTeamInput,
} from './optimal-team';

export { getBookingDurationMinutes, extrasUnitCount } from './duration';

export { getAvailableSlots, type TimeSlotDef, type SlotAvailabilityRow } from './slots';

export {
  computeWizardDisplayPricing,
  type WizardDisplayPricing,
} from './wizard-display-pricing';

export { assertSinglePricingSource } from '@/lib/pricing-single-source';

export { BOOKING_PROMO_CODES, applyPromoDiscount } from './promo-codes';

export {
  computeWizardEnginePricingRow,
  deriveWizardCompanyCostsCents,
  deriveWizardEngineCompanyLinesCents,
  getWizardEngineCompanyCostsCents,
} from './wizard-engine-pricing';

export { buildWizardPendingBookingPayload, type WizardPendingPricingContext } from './wizard-checkout';

export { buildDashboardPendingBookingPayload } from './dashboard-checkout';

export type {
  BookingEngineCalculateInput,
  BookingPricingResult,
  BookingPayload,
  BookingInput,
  BookingEngineState,
} from './types';
