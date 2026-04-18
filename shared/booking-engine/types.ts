import type { BookingState } from '@/types/booking';
import type { BookingCalculateInput, BookingPriceResult } from './calculate';

/** Cart + rooms + extras input for catalog pricing (alias for engine calculate input). */
export type BookingEngineCalculateInput = BookingCalculateInput;

/** Result of `calculateBooking` / wizard line pricing — exported for UI + APIs. */
export type BookingPricingResult = BookingPriceResult;

/**
 * Payload for `/api/bookings/pending`, `/api/bookings/guest`, and related routes.
 * Align with `BookingState` in `@/types/booking`, plus optional fields some routes accept.
 */
export type BookingPayload = BookingState & {
  /** Legacy back-compat for process route (duplicate of equipment_fee in some paths). */
  equipmentCharge?: number;
};

export type { BookingInput, BookingEngineState } from '@/shared/booking/types';
