import type { BookingV2ServiceId } from '@/shared/booking-v2/useBookingStore';
import { bookingV2ServiceToApi } from '@/shared/booking-v2/service-map';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';

const PLACEHOLDER_TIME_FOR_BASE = '09:00';

export type BookingV2PricingShape = {
  service: BookingV2ServiceId;
  rooms: number;
  bathrooms: number;
  extras: string[];
  extrasQuantities: Record<string, number>;
  date: string;
  suburb: string;
};

function carpetPayload(rooms: number, bathrooms: number) {
  return {
    carpetDetails: {
      hasFittedCarpets: rooms > 0,
      hasLooseCarpets: bathrooms > 0,
      numberOfRooms: Math.max(0, rooms),
      numberOfLooseCarpets: Math.max(0, bathrooms),
      roomStatus: 'empty' as const,
    },
    rugs: Math.max(0, bathrooms),
    carpets: Math.max(0, rooms),
  };
}

/** Step 1 — read-only preview; uses fixed placeholder time so slot surge is not interpreted as final. */
export function buildPricingPreviewBody(s: BookingV2PricingShape): Record<string, unknown> {
  const city = BOOKING_DEFAULT_CITY;
  return {
    service: bookingV2ServiceToApi(s.service),
    bedrooms: s.rooms,
    bathrooms: s.bathrooms,
    extraRooms: 0,
    extras: s.extras,
    extrasQuantities: Object.keys(s.extrasQuantities).length ? s.extrasQuantities : undefined,
    date: s.date,
    time: PLACEHOLDER_TIME_FOR_BASE,
    frequency: 'one-time',
    tipAmount: 0,
    discountAmount: 0,
    numberOfCleaners: 1,
    teamSize: 1,
    pricingMode: 'premium',
    provideEquipment: false,
    address: { suburb: s.suburb.trim() || city, city },
    ...(s.service === 'carpet' ? carpetPayload(s.rooms, s.bathrooms) : {}),
  };
}

/** Step 2 — same inputs + real `time` for authoritative snapshot. */
export function buildCreateSnapshotBody(
  s: BookingV2PricingShape & { time: string; tipAmount: number; discountAmount: number; promoCode: string },
): Record<string, unknown> {
  const city = BOOKING_DEFAULT_CITY;
  const suburb = s.suburb.trim() || city;
  return {
    service: bookingV2ServiceToApi(s.service),
    bedrooms: s.rooms,
    bathrooms: s.bathrooms,
    extraRooms: 0,
    extras: s.extras,
    extrasQuantities: Object.keys(s.extrasQuantities).length ? s.extrasQuantities : undefined,
    date: s.date,
    time: s.time,
    frequency: 'one-time',
    tipAmount: s.tipAmount,
    discountAmount: s.discountAmount,
    numberOfCleaners: 1,
    teamSize: 1,
    pricingMode: 'premium',
    provideEquipment: false,
    scheduleEquipmentPref: 'own',
    address: { suburb, city },
    discountCode: s.promoCode.trim() || undefined,
    promo_code: s.promoCode.trim() || undefined,
    ...(s.service === 'carpet' ? carpetPayload(s.rooms, s.bathrooms) : {}),
  };
}
