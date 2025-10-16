// Core booking data types

export type ServiceType = 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb';

export interface BookingState {
  step: 1 | 2 | 3 | 4 | 5;
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
  paymentReference?: string; // Paystack payment reference
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

