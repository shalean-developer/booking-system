/**
 * Cross-dashboard identifiers — extend in domain modules as needed.
 */

import type { BookingProfitRow } from '@/shared/finance-engine/booking-money';

export type DashboardBookingStatusBucket = 'upcoming' | 'completed' | 'cancelled';

/** Minimal shape for lifecycle helpers (ISO date yyyy-mm-dd on the booking). */
export type BookingLifecycleInput = {
  dbStatus?: string | null;
  status?: string | null;
  bookingDateIso?: string | null;
};

/**
 * Canonical booking row: identity + DB fields + finance columns consumed by
 * `shared/finance-engine/booking-money` and `shared/dashboard-data/booking-lifecycle`.
 * View models (formatted dates/prices) should live next to UI; map from this shape.
 */
export type Booking = BookingProfitRow & {
  id: string;
  status?: string | null;
  dbStatus?: string | null;
  booking_date?: string | null;
  booking_time?: string | null;
  service_type?: string | null;
  customer_name?: string | null;
  address_line1?: string | null;
  address_suburb?: string | null;
  address_city?: string | null;
  cleaner_id?: string | null;
  notes?: string | null;
  payment_reference?: string | null;
  customer_review_id?: string | null;
  customer_reviewed?: boolean;
  bedrooms?: number | null;
  bathrooms?: number | null;
  extras?: string[] | null;
  frequency?: string | null;
  service_fee?: number | null;
  frequency_discount?: number | null;
  tip_amount?: number | null;
  cleaner_earnings?: number | null;
  cleaner_claimed_at?: string | null;
  cleaner_accepted_at?: string | null;
  cleaner_on_my_way_at?: string | null;
  cleaner_started_at?: string | null;
  cleaner_completed_at?: string | null;
  expected_end_time?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};
