import type { PricingMode } from '@/lib/pricing-mode';

export type ServiceType = 'standard' | 'deep' | 'move' | 'airbnb' | 'carpet';
export type PropertyType = 'apartment' | 'house' | 'office' | 'studio';

export type PaymentMethod = 'online' | 'later';

export type { PricingMode };

export interface BookingFormData {
  service: ServiceType;
  bedrooms: number;
  bathrooms: number;
  extraRooms: number;
  propertyType: PropertyType;
  officeSize: string;
  extras: string[];
  /** Per–extra-id quantities (public wizard); keys match `extras` entries (e.g. slugified DB extra ids). */
  extrasQuantities: Record<string, number>;
  cleanerId: string;
  teamId: string;
  workingArea: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  instructions: string;
  paymentMethod: PaymentMethod;
  tipAmount: number;
  promoCode: string;
  discountAmount: number;
  /** Step 1 — office breakdown (maps into bedrooms/bathrooms/extraRooms for API pricing) */
  officeBoardrooms?: number;
  officePrivateOffices?: number;
  officeOpenAreas?: number;
  officeBathrooms?: number;
  officeKitchens?: number;
  officeHasReception?: boolean;
  /** Step 1 — carpet */
  carpetRooms?: number;
  carpetRugs?: number;
  carpetExtraCleaner?: boolean;
  /** Step 2 — standard / Airbnb: cleaners bring equipment vs customer supplies */
  scheduleEquipmentPref?: 'bring' | 'own';
  /** Cleaners booked for the job (1–6); defaults from `calculateOptimalTeam` unless user overrides */
  numberOfCleaners: number;
  /** When true, workload changes do not auto-update `numberOfCleaners` */
  teamSizeUserOverride?: boolean;
  /** Quick Clean (affordable) vs Premium Clean (full engine). */
  pricingMode: PricingMode;
  /** Basic flow only: fixed duration buttons (2–5h). Drives pricing when `pricingMode === 'basic'`. */
  basicPlannedHours: number | null;
}
