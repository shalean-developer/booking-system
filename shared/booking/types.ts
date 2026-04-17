import type { ServiceType as ApiServiceType } from '@/types/booking';

/**
 * Extra line for UI lists — `price` is ZAR per unit from catalog (informational).
 * The engine resolves amounts from `PricingData` + catalog names.
 */
export type BookingExtra = {
  id: string;
  name: string;
  price: number;
};

/** Selected service for summaries and snapshots */
export type BookingServiceInfo = {
  id: ApiServiceType;
  name: string;
  /** Base rate ZAR from DB (display); authoritative breakdown is in `BookingPriceResult` */
  base_price: number;
};

/**
 * Shared cart state for dashboard (and future public refactor).
 * IDs for extras match the main site (`extra_cleaner`, slugified catalog names, etc.).
 */
export type BookingEngineState = {
  service: BookingServiceInfo | null;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  /** Extra line ids (same convention as public booking wizard) */
  selectedExtraIds: string[];
  provideEquipment: boolean;
  date: string;
  time: string;
  cleaner_id: string | null;
};

/** Alias — cart shape consumed by `useBooking` / checkout builders */
export type BookingInput = BookingEngineState;
