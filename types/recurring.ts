// Recurring booking types and interfaces

export type Frequency = 'weekly' | 'bi-weekly' | 'monthly' | 'custom-weekly' | 'custom-bi-weekly';

export type BookingType = 'one-time' | 'recurring';

export interface RecurringSchedule {
  id: string;
  customer_id: string;
  service_type: string;
  frequency: Frequency;
  day_of_week?: number; // 0=Sunday, 1=Monday, etc. (for single-day weekly/bi-weekly)
  day_of_month?: number; // 1-31 (for monthly)
  days_of_week?: number[]; // Array of days (0-6) for custom frequencies
  preferred_time: string; // HH:MM format
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  extrasQuantities?: Record<string, number>;
  extras_quantities?: Record<string, number>;
  notes?: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  cleaner_id?: string;
  is_active: boolean;
  start_date: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  last_generated_month?: string; // YYYY-MM format
  created_at: string;
  updated_at: string;
}

export interface RecurringScheduleWithCustomer extends RecurringSchedule {
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  cleaner?: {
    id: string;
    name: string;
  };
}

export interface CreateBookingFormData {
  booking_type: BookingType;
  customer_id: string;
  service_type: string;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  notes?: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  cleaner_id?: string;
  
  // Pricing fields
  total_amount?: number; // Total booking amount in rands
  service_fee?: number; // Service fee in rands (0 for recurring)
  cleaner_earnings?: number; // Cleaner earnings in rands
  
  // One-time booking fields
  booking_date?: string; // YYYY-MM-DD format
  booking_time?: string; // HH:MM format
  
  // Recurring booking fields
  frequency?: Frequency;
  day_of_week?: number;
  day_of_month?: number;
  days_of_week?: number[]; // For custom frequencies
  preferred_time?: string; // HH:MM format
  start_date?: string; // YYYY-MM-DD format
  end_date?: string; // YYYY-MM-DD format
  generate_current_month?: boolean;
}

export interface GenerateBookingsRequest {
  schedule_id?: string; // If provided, generate for specific schedule
  month: string; // YYYY-MM format
  year: number;
}

export interface GenerateBookingsResponse {
  ok: boolean;
  bookings_created: number;
  schedules_processed: number;
  errors: string[];
  bookings: Array<{
    id: string;
    booking_date: string;
    booking_time: string;
    customer_name: string;
  }>;
}

export interface BookingWithSchedule {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  customer_name: string;
  customer_email: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  status: string;
  total_amount: number;
  cleaner_id?: string;
  cleaner_name?: string;
  recurring_schedule_id?: string;
  recurring_schedule?: {
    frequency: Frequency;
    next_occurrence?: string;
  };
  created_at: string;
}

// Helper types for UI
export interface DayOfWeekOption {
  value: number;
  label: string;
}

export interface DayOfMonthOption {
  value: number;
  label: string;
}

export interface FrequencyOption {
  value: Frequency;
  label: string;
  description: string;
}

// Constants
export const DAYS_OF_WEEK: DayOfWeekOption[] = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const DAYS_OF_MONTH: DayOfMonthOption[] = Array.from(
  { length: 31 },
  (_, i) => ({
    value: i + 1,
    label: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`,
  })
);

export const FREQUENCY_OPTIONS: FrequencyOption[] = [
  {
    value: 'weekly',
    label: 'Weekly',
    description: 'Every week on the same day',
  },
  {
    value: 'bi-weekly',
    label: 'Bi-weekly',
    description: 'Every other week on the same day',
  },
  {
    value: 'monthly',
    label: 'Monthly',
    description: 'Once per month on the same day',
  },
  {
    value: 'custom-weekly',
    label: 'Custom Weekly',
    description: 'Every week on selected days',
  },
  {
    value: 'custom-bi-weekly',
    label: 'Custom Bi-weekly',
    description: 'Every other week on selected days',
  },
];

export const TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
];
