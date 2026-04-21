import type { PricingMode } from '@/lib/pricing-mode';
import type { PricingSnapshot } from '@/lib/pricing/snapshot';
import type { WizardDisplayPricing } from '@/shared/booking-engine/wizard-display-pricing';

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
  cleaner?: {
    id: string;
    name: string;
    rating: number;
    jobs: number;
    type: 'ai' | 'manual';
  } | null;
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

  /** Locked checkout pricing from `POST /api/pricing/create-snapshot` (authoritative path). */
  pricingSnapshot?: PricingSnapshot | null;
  pricingLoading?: boolean;
  pricing_hash?: string;
  pricing_lock_token?: string | null;
  pricing_expires_at?: string;
  pricing_version?: string;
  /** Row id in `booking_pricing_snapshots` from create-snapshot. */
  pricing_snapshot_id?: string;

  /** Final ZAR total from pricing engine at lock time (with surge); mirrors snapshot result. */
  lockedPrice?: number;
  /** Surge multiplier applied once at schedule/crew lock; mirrors snapshot result. */
  surgeMultiplier?: number;
  /** ISO time when the server lock was last written (schedule or crew confirmation). */
  priceLockedAt?: string;

  /** Set after smart defaults are applied once (avoids fighting session restore). */
  initialized?: boolean;
  /** User changed booking fields — do not re-apply smart defaults. */
  userHasEdited?: boolean;

  /**
   * Single source of truth for locked wizard pricing (set with `POST /api/pricing/create-snapshot`).
   * Use `pricing.total` for displayed and persisted totals from Step 2 onward; Step 1 may keep this null until lock.
   */
  pricing: WizardDisplayPricing | null;
}
