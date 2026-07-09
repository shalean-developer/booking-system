import type { BookingV2ServiceId } from '@/shared/booking-v2/useBookingStore';
import type { ServiceType as ApiServiceType } from '@/types/booking';

const TO_API: Record<BookingV2ServiceId, ApiServiceType> = {
  standard: 'Standard',
  deep: 'Deep',
  move: 'Move In/Out',
  airbnb: 'Airbnb',
  carpet: 'Carpet',
};

export function bookingV2ServiceToApi(service: BookingV2ServiceId): ApiServiceType {
  return TO_API[service];
}
