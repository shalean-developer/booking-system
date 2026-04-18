// ─── Shared Types ─────────────────────────────────────────────────────────────

export type PageId =
  | 'dashboard'
  | 'book'
  | 'bookings'
  | 'payments'
  | 'rewards'
  | 'support'
  | 'profile'
  | 'notifications'
  | 'earn-share';

export type FilterId = 'all' | 'upcoming' | 'completed' | 'cancelled';

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  service: string;
  /** ISO yyyy-mm-dd from DB for scheduling APIs. */
  bookingDateIso?: string;
  /** Slot id (HH:mm) matching `BOOKING_TIME_SLOT_DEFS`. */
  bookingTimeSlotId?: string | null;
  /** Raw `service_type` from DB (e.g. Standard, Deep). */
  serviceTypeRaw?: string;
  cleaner: string;
  cleanerInitial: string;
  /** Assigned cleaner UUID when present. */
  cleanerId?: string | null;
  requiresTeam?: boolean;
  teamName?: string | null;
  /** For dispatch: extras id list + quantities from booking row / snapshot. */
  extrasIds?: string[];
  extrasQuantities?: Record<string, number>;
  bedrooms?: number | null;
  bathrooms?: number | null;
  durationMinutes?: number | null;
  /** Assigned cleaner phone when available (from DB). */
  cleanerPhone?: string | null;
  date: string;
  time: string;
  address: string;
  status: BookingStatus;
  /** Raw `bookings.status` for labels and modals. */
  dbStatus?: string;
  /** Customer-facing status line (e.g. "In progress"). */
  pipelineStatus?: string;
  /** Short room line for cards, e.g. "2 bed · 1 bath · 1 extra room" */
  roomSummary?: string | null;
  price: string;
  priceNumber: number;
  /** True when the customer has submitted a review for this booking. */
  customerReviewed?: boolean;
  rating?: number;
  invoiceId: string;
  zohoInvoiceId?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  type: 'booking' | 'cleaner' | 'rewards';
}

export interface StatItem {
  id: string;
  label: string;
  value: number;
  suffix: string;
  color: string;
}

export interface QuickAction {
  id: string;
  label: string;
  sublabel: string;
  colorClass: string;
  bgClass: string;
  page: PageId;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  service: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
}

/** Same shape as `PaymentRecord`; kept for existing portal hooks imports. */
export type PaymentRow = PaymentRecord;

export interface PointsHistoryItem {
  id: string;
  description: string;
  points: number;
  date: string;
  type: 'earned' | 'redeemed';
}

export interface RewardTier {
  id: string;
  name: string;
  minPoints: number;
  color: string;
  bgColor: string;
  borderColor: string;
}

/** Same shape as `RewardTier`; kept for existing portal hooks imports. */
export type TierRow = RewardTier;

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  isDefault: boolean;
}

export interface UserProfile {
  name: string;
  initial: string;
  email: string;
  phone: string;
  customerId?: string | null;
  referralCode: string;
  rewardPoints: number;
  rewardTier: string;
  rewardTarget: number;
  rewardProgress: number;
  nextTierName?: string | null;
}

export interface BookingStep {
  id: number;
  label: string;
}

export interface ServiceOption {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: string;
}

export interface CleanerOption {
  id: string;
  name: string;
  initial: string;
  rating: number;
  reviews: number;
  specialty: string;
}

export interface TimeSlotOption {
  id: string;
  time: string;
  available: boolean;
}

export interface ExtraOption {
  id: string;
  name: string;
  price: string;
}

export interface PreferredCleanerOption {
  id: string;
  name: string;
  initial: string;
  rating: number;
  reviews: number;
  specialty: string;
  available: boolean;
}
