import { create } from 'zustand';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';

/** Wizard service ids (no legacy `BookingFormData` shape). */
export type BookingV2ServiceId = 'standard' | 'deep' | 'move' | 'airbnb' | 'carpet';

export type BookingV2State = {
  service: BookingV2ServiceId | null;
  /** Bedrooms (or carpet rooms when service is carpet). */
  rooms: number;
  bathrooms: number;
  /** Extra catalogue lines as slug ids (matches pricing / extras payload). */
  extras: string[];
  extrasQuantities: Record<string, number>;
  date: string;
  time: string;
  suburb: string;
  basePrice: number | null;
  finalPrice: number | null;
  pricingSnapshotId: string | null;
  locked: boolean;
  /** Populated when `locked` — required for checkout APIs. */
  pricingHash: string | null;
  pricingLockToken: string | null;
  pricingExpiresAt: string | null;
  pricingVersion: string | null;
  totalAmountCents: number | null;
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

type BookingV2Actions = {
  patch: (p: Partial<BookingV2State>) => void;
  reset: () => void;
  /** Step 2 — authoritative lock from `POST /api/pricing/create-snapshot`. */
  applyPricingLock: (input: {
    finalPrice: number;
    pricingSnapshotId: string;
    pricingHash: string;
    pricingLockToken: string;
    pricingExpiresAt: string;
    pricingVersion: string;
    totalAmountCents: number;
    pricingEngineFinalCents: number | null;
    pricingTotalHours: number | null;
    time: string;
  }) => void;
  clearPricingLock: () => void;
};

const initial: BookingV2State = {
  service: null,
  rooms: 2,
  bathrooms: 2,
  extras: [],
  extrasQuantities: {},
  date: '',
  time: '',
  suburb: '',
  basePrice: null,
  finalPrice: null,
  pricingSnapshotId: null,
  locked: false,
  pricingHash: null,
  pricingLockToken: null,
  pricingExpiresAt: null,
  pricingVersion: null,
  totalAmountCents: null,
  pricingEngineFinalCents: null,
  pricingTotalHours: null,
  pricingTeamSize: 1,
  cleanerId: null,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  addressLine1: '',
  addressCity: BOOKING_DEFAULT_CITY,
  tipAmount: 0,
  discountAmount: 0,
  promoCode: '',
  notes: '',
};

export const useBookingStore = create<BookingV2State & BookingV2Actions>((set) => ({
  ...initial,
  patch: (p) => set((s) => ({ ...s, ...p })),
  reset: () => set({ ...initial }),
  applyPricingLock: (input) =>
    set((s) => ({
      ...s,
      finalPrice: input.finalPrice,
      pricingSnapshotId: input.pricingSnapshotId,
      pricingHash: input.pricingHash,
      pricingLockToken: input.pricingLockToken,
      pricingExpiresAt: input.pricingExpiresAt,
      pricingVersion: input.pricingVersion,
      totalAmountCents: input.totalAmountCents,
      pricingEngineFinalCents: input.pricingEngineFinalCents,
      pricingTotalHours: input.pricingTotalHours,
      time: input.time,
      locked: true,
    })),
  clearPricingLock: () =>
    set((s) => ({
      ...s,
      finalPrice: null,
      pricingSnapshotId: null,
      pricingHash: null,
      pricingLockToken: null,
      pricingExpiresAt: null,
      pricingVersion: null,
      totalAmountCents: null,
      pricingEngineFinalCents: null,
      pricingTotalHours: null,
      locked: false,
      time: '',
    })),
}));
