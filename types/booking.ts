// Core booking data types

export type ServiceType = 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb';

export interface BookingState {
  step: 1 | 2 | 3 | 4 | 5 | 6;
  service: ServiceType | null;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  notes: string;
  date: string | null; // ISO yyyy-mm-dd
  time: string | null; // "07:00", "07:30", ..., "13:00"
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    suburb: string;
    city: string;
  };
  cleaner_id?: string; // Selected cleaner ID
  paymentReference?: string; // Paystack payment reference
}

// Cleaner data types
export interface Cleaner {
  id: string;
  name: string;
  photo_url: string | null;
  rating: number;
  areas: string[];
  bio: string | null;
  years_experience: number | null;
  specialties: string[] | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AvailableCleanersResponse {
  ok: boolean;
  cleaners: Cleaner[];
  error?: string;
}

// Payment verification response types
export interface PaystackVerificationResponse {
  ok: boolean;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    customer: {
      email: string;
    };
  };
  message?: string;
  error?: string;
}

