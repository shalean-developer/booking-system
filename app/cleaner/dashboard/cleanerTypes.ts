export type CleanerPageId = 'home' | 'jobs' | 'schedule' | 'earnings' | 'profile';

export type JobTabId = 'available' | 'accepted' | 'completed';

export type JobStatus =
  | 'available'
  | 'accepted'
  | 'assigned'
  | 'on_my_way'
  | 'arrived'
  | 'in_progress'
  | 'completed';

/** @deprecated use JobStatus */
export type JobUiStatus = 'available' | 'accepted' | 'in_progress';

export interface Job {
  id: string;
  service: string;
  client: string;
  clientInitial: string;
  address: string;
  date: string;
  time: string;
  duration: string;
  pay: string;
  payNumber: number;
  status: JobStatus;
  distance: string;
  notes: string;
  rating?: number;
  /** API booking status — used for status transitions */
  dbStatus?: string;
  /** Customer phone for tel: / WhatsApp */
  customerPhone?: string;
  /** Full address string for maps */
  mapsQuery?: string;
  /** ISO timestamps from booking row (cleaner_* or alias columns) */
  acceptedAt?: string;
  onMyWayAt?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface EarningRecord {
  id: string;
  jobId: string;
  service: string;
  client: string;
  date: string;
  amount: string;
  amountNumber: number;
}

export interface EarningsSummary {
  today: number;
  week: number;
  month: number;
}

export interface BarChartDataPoint {
  id: string;
  day: string;
  amount: number;
}

export interface CleanerProfile {
  name: string;
  initial: string;
  email: string;
  phone: string;
  rating: number;
  totalJobs: number;
  memberSince: string;
  specialty: string;
}

export interface CleanerReview {
  id: string;
  clientName: string;
  clientInitial: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
}

export interface ScheduleDay {
  id: string;
  date: number;
  dayShort: string;
  isToday: boolean;
  hasJobs: boolean;
  isAvailable: boolean;
  /** YYYY-MM-DD */
  dateKey: string;
}

export interface ScheduledJob {
  id: string;
  service: string;
  client: string;
  time: string;
  address: string;
  pay: string;
}

export interface AvailabilitySlot {
  id: string;
  label: string;
  enabled: boolean;
}

export type BookingStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  clientName: string;
  address: string;
  time: string;
  date: string;
  status: BookingStatus;
  earnings: number;
  serviceType: string;
}

export interface ScheduleEvent {
  id: string;
  date: string;
  time: string;
  clientName: string;
  address: string;
  duration: string;
}

export interface EarningsRecord {
  id: string;
  date: string;
  clientName: string;
  amount: number;
  status: 'paid' | 'pending';
  booking_date?: string;
}

export interface DatabaseBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  status: string;
  total_amount?: number;
  cleaner_earnings?: number;
  address_line1?: string;
  address_suburb?: string;
  address_city?: string;
  customer_name?: string;
  customer_phone?: string;
  notes?: string | null;
}

export interface DatabaseEarnings {
  id: string;
  booking_date: string;
  customer_name?: string;
  cleaner_earnings?: number;
  tip_amount?: number;
}
