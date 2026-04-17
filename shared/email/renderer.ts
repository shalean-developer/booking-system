import { bookingConfirmationTemplate } from './templates/booking-confirmation';
import type { BookingEmailData } from './types';

export function bookingConfirmationSubject(data: BookingEmailData): string {
  return data.status === 'paid'
    ? 'Booking Confirmed – Shalean Cleaning Services'
    : 'Complete your booking – Shalean Cleaning Services';
}

export function renderBookingEmail(data: BookingEmailData): string {
  return bookingConfirmationTemplate(data);
}
