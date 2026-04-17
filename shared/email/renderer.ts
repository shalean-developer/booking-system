import { bookingConfirmationTemplate } from './templates/booking-confirmation';
import type { BookingEmailData } from './types';

export function bookingConfirmationSubject(data: BookingEmailData): string {
  return data.status === 'paid' ? 'Booking Confirmed' : 'Complete Your Booking';
}

export function renderBookingEmail(data: BookingEmailData): string {
  return bookingConfirmationTemplate(data);
}
