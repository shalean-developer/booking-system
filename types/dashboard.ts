// Dashboard TypeScript Types
// Centralized type definitions for customer dashboard

export interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  status: string;
  total_amount: number;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  cleaner_id?: string | null;
  notes?: string | null;
  payment_reference?: string | null;
  customer_review_id?: string | null;
  customer_reviewed?: boolean;
  bedrooms?: number | null;
  bathrooms?: number | null;
  extras?: string[] | null;
  frequency?: string | null;
  service_fee?: number | null;
  frequency_discount?: number | null;
  tip_amount?: number | null;
  cleaner_earnings?: number | null;
  cleaner_claimed_at?: string | null;
  cleaner_accepted_at?: string | null;
  cleaner_on_my_way_at?: string | null;
  cleaner_started_at?: string | null;
  cleaner_completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cleaner {
  id: string;
  name: string;
  photoUrl?: string | null;
  photo_url?: string | null;
  rating?: number | null;
  email?: string | null;
  phone?: string | null;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  photos?: string[] | null;
  booking_id?: string | null;
  cleaner_id?: string | null;
  created_at?: string | null;
}

export interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  addressLine1?: string | null;
  address_line1?: string | null;
  addressSuburb?: string | null;
  address_suburb?: string | null;
  addressCity?: string | null;
  address_city?: string | null;
  totalBookings?: number;
  total_bookings?: number;
}

export interface RecurringSchedule {
  id: string;
  service_type: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  preferred_time: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupportTicket {
  id: string;
  customer_id: string;
  subject: string;
  message: string;
  category: 'general' | 'booking' | 'payment' | 'service' | 'technical' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  customer_email?: string;
  customer_name?: string;
  response?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  payment_reference?: string | null;
  date: string;
}

export interface DashboardStats {
  upcomingAppointments: number;
  activeCleaningPlans: number;
  lastCleaningCompleted: string | null;
  balanceDue: number;
}

export interface PaymentData {
  outstandingBalance: number;
  recentPayments: Payment[];
  nextInvoice: {
    id: string;
    date: string;
    amount: number;
    dueDate: string;
  } | null;
}

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
    [key: string]: unknown;
  };
  created_at?: string;
  [key: string]: unknown;
}
