export type { BookingExtra, BookingEngineState, BookingInput, BookingServiceInfo } from './types';
export { WIZARD_DEFAULT_FORM } from './wizard-defaults';
export { createInitialWizardState } from './wizard-state';
export { calculateBooking, computeLinePricingFromWizard } from './calculate';
export type { BookingCalculateInput, BookingPriceResult } from './calculate';

/** Public booking wizard — full `BookingFormData` + session + `lineCalc` */
export { useBooking } from './useBooking';

/** Customer dashboard book flow — slim cart */
export { useDashboardBooking, bookingServiceInfo } from './useDashboardBooking';
