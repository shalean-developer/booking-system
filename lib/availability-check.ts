/**
 * Availability checking utilities for cleaner booking preferences
 */

interface AvailabilityPreferences {
  preferred_start_time: string | null;
  preferred_end_time: string | null;
  preferred_days_of_week: number[];
  blocked_dates: string[];
  blocked_time_slots: Array<{ date: string; start: string; end: string }>;
  auto_decline_outside_availability: boolean;
  auto_decline_below_min_value: boolean;
  min_booking_value_cents: number | null;
  preferred_service_types: string[];
  max_distance_km: number | null;
}

interface BookingCheck {
  booking_date: string;
  booking_time: string;
  service_type: string;
  total_amount: number;
  distance_km?: number | null;
}

/**
 * Check if a booking matches availability preferences
 */
export function checkBookingAvailability(
  preferences: AvailabilityPreferences | null,
  booking: BookingCheck
): { allowed: boolean; reason?: string } {
  if (!preferences) {
    return { allowed: true }; // No preferences = allow all
  }

  // Check blocked dates
  if (preferences.blocked_dates.includes(booking.booking_date)) {
    return {
      allowed: false,
      reason: 'This date is blocked in your availability preferences',
    };
  }

  // Check blocked time slots
  const bookingTime = booking.booking_time.slice(0, 5); // HH:MM
  const blockedSlot = preferences.blocked_time_slots.find(
    (slot) =>
      slot.date === booking.booking_date &&
      bookingTime >= slot.start &&
      bookingTime < slot.end
  );
  if (blockedSlot) {
    return {
      allowed: false,
      reason: 'This time slot is blocked in your availability preferences',
    };
  }

  // Check preferred days of week
  if (
    preferences.preferred_days_of_week.length > 0 &&
    preferences.auto_decline_outside_availability
  ) {
    const bookingDate = new Date(booking.booking_date);
    const dayOfWeek = bookingDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (!preferences.preferred_days_of_week.includes(dayOfWeek)) {
      return {
        allowed: false,
        reason: 'This day is not in your preferred working days',
      };
    }
  }

  // Check preferred time slots
  if (
    preferences.preferred_start_time &&
    preferences.preferred_end_time &&
    preferences.auto_decline_outside_availability
  ) {
    const preferredStart = preferences.preferred_start_time.slice(0, 5); // HH:MM
    const preferredEnd = preferences.preferred_end_time.slice(0, 5);
    const bookingTime = booking.booking_time.slice(0, 5);

    if (bookingTime < preferredStart || bookingTime >= preferredEnd) {
      return {
        allowed: false,
        reason: 'This time is outside your preferred working hours',
      };
    }
  }

  // Check minimum booking value
  if (
    preferences.auto_decline_below_min_value &&
    preferences.min_booking_value_cents &&
    booking.total_amount < preferences.min_booking_value_cents
  ) {
    return {
      allowed: false,
      reason: `Booking value is below your minimum of R${(preferences.min_booking_value_cents / 100).toFixed(2)}`,
    };
  }

  // Check preferred service types
  if (
    preferences.preferred_service_types.length > 0 &&
    !preferences.preferred_service_types.includes(booking.service_type)
  ) {
    // This is a warning, not a block (cleaner can still accept)
    // But we could make it auto-decline if needed
  }

  // Check maximum distance
  if (
    preferences.max_distance_km &&
    booking.distance_km !== null &&
    booking.distance_km !== undefined &&
    booking.distance_km > preferences.max_distance_km
  ) {
    return {
      allowed: false,
      reason: `Booking is ${booking.distance_km}km away, exceeding your maximum of ${preferences.max_distance_km}km`,
    };
  }

  return { allowed: true };
}

/**
 * Filter bookings based on availability preferences
 */
export function filterBookingsByAvailability(
  preferences: AvailabilityPreferences | null,
  bookings: BookingCheck[]
): BookingCheck[] {
  if (!preferences) {
    return bookings; // No preferences = show all
  }

  return bookings.filter((booking) => {
    const check = checkBookingAvailability(preferences, booking);
    return check.allowed;
  });
}

