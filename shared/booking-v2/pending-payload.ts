import type { BookingV2ServiceId } from '@/shared/booking-v2/useBookingStore';
import { bookingV2ServiceToApi } from '@/shared/booking-v2/service-map';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
import type { BookingState } from '@/types/booking';

function mergeExtrasQuantities(extras: string[], extrasQuantities: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  const unique = [...new Set(extras)];
  for (const id of unique) {
    const explicit = extrasQuantities[id];
    if (typeof explicit === 'number' && explicit > 0) out[id] = Math.min(999, Math.floor(explicit));
    else {
      const c = extras.filter((e) => e === id).length;
      out[id] = c > 0 ? c : 1;
    }
  }
  return out;
}

export type BookingV2StoreSnapshot = {
  service: BookingV2ServiceId;
  rooms: number;
  bathrooms: number;
  extras: string[];
  extrasQuantities: Record<string, number>;
  date: string;
  time: string;
  suburb: string;
  finalPrice: number;
  pricingSnapshotId: string;
  pricingHash: string;
  pricingLockToken: string;
  pricingExpiresAt: string;
  pricingVersion: string;
  pricingEngineFinalCents: number | null;
  pricingTotalHours: number | null;
  pricingTeamSize: number;
  cleanerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine1: string;
  addressCity: string;
  tipAmount: number;
  discountAmount: number;
  promoCode: string;
  notes: string;
};

function splitName(raw: string): { firstName: string; lastName: string } {
  const t = raw.trim() || 'Customer';
  const parts = t.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? 'Customer',
    lastName: parts.slice(1).join(' '),
  };
}

function applyCarpetFields(
  body: BookingState,
  service: BookingV2ServiceId,
  rooms: number,
  bathrooms: number,
) {
  if (service !== 'carpet') return;
  body.carpetDetails = {
    hasFittedCarpets: rooms > 0,
    hasLooseCarpets: bathrooms > 0,
    numberOfRooms: Math.max(0, rooms),
    numberOfLooseCarpets: Math.max(0, bathrooms),
    roomStatus: 'empty',
  };
  body.rugs = Math.max(0, bathrooms);
  body.carpets = Math.max(0, rooms);
}

/**
 * Builds `BookingState` for `POST /api/bookings/pending` from the v2 store.
 * Totals and integrity fields come only from the Step 2 snapshot lock.
 */
export function buildPendingBookingBody(s: BookingV2StoreSnapshot): BookingState {
  const apiService = bookingV2ServiceToApi(s.service);
  const { firstName, lastName } = splitName(s.customerName);
  const suburb = s.suburb.trim() || s.addressCity.trim() || BOOKING_DEFAULT_CITY;
  const city = s.addressCity.trim() || BOOKING_DEFAULT_CITY;
  const requiresTeam = apiService === 'Deep' || apiService === 'Move In/Out';
  const extrasQuantities = mergeExtrasQuantities(s.extras, s.extrasQuantities);

  const body: BookingState = {
    step: 4,
    service: apiService,
    bedrooms: s.rooms,
    bathrooms: s.bathrooms,
    extraRooms: 0,
    numberOfCleaners: s.pricingTeamSize,
    extras: s.extras,
    extrasQuantities,
    notes: s.notes.trim(),
    date: s.date,
    time: s.time,
    frequency: 'one-time',
    firstName,
    lastName,
    email: s.customerEmail.trim().toLowerCase(),
    phone: s.customerPhone.trim(),
    address: {
      line1: s.addressLine1.trim() || '—',
      suburb,
      city,
    },
    cleaner_id: s.cleanerId?.trim() || undefined,
    team_selection: requiresTeam ? { type: 'auto' } : undefined,
    requires_team: requiresTeam,
    totalAmount: s.finalPrice,
    serviceFee: 0,
    frequencyDiscount: 0,
    discountCode: s.promoCode.trim() || undefined,
    promo_code: s.promoCode.trim() || undefined,
    discountAmount: s.discountAmount,
    tipAmount: s.tipAmount,
    provideEquipment: false,
    pricingMode: 'premium',
    scheduleEquipmentPref: 'own',
    pricing_hash: s.pricingHash,
    pricing_lock_token: s.pricingLockToken,
    pricing_expires_at: s.pricingExpiresAt,
    pricing_version: s.pricingVersion,
    pricing_snapshot_id: s.pricingSnapshotId,
  };

  if (typeof s.pricingEngineFinalCents === 'number' && Number.isFinite(s.pricingEngineFinalCents)) {
    body.pricingEngineFinalCents = Math.round(s.pricingEngineFinalCents);
  }
  if (typeof s.pricingTotalHours === 'number' && Number.isFinite(s.pricingTotalHours) && s.pricingTotalHours > 0) {
    body.pricingTotalHours = s.pricingTotalHours;
  }
  body.pricingTeamSize = Math.max(1, Math.round(s.pricingTeamSize || 1));

  applyCarpetFields(body, s.service, s.rooms, s.bathrooms);

  return body;
}
