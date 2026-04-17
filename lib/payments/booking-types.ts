/** Shared row shape for payment fulfillment (bookings table subset). */

export type BookingPaidRow = {
  id: string;
  cleaner_id: string | null;
  booking_date: string | null;
  booking_time: string | null;
  expected_end_time?: string | null;
  service_type: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone?: string | null;
  address_line1?: string | null;
  address_suburb?: string | null;
  address_city?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  extras?: string[] | null;
  total_amount: number | null;
  price?: number | null;
  tip_amount?: number | null;
  service_fee?: number | null;
  frequency_discount?: number | null;
  frequency?: string | null;
  surge_pricing_applied?: boolean | null;
  surge_amount?: number | null;
  requires_team?: boolean | null;
  notes?: string | null;
  price_snapshot?: unknown;
  status: string | null;
  payment_reference: string | null;
  paystack_ref: string | null;
  zoho_invoice_id: string | null;
  invoice_url?: string | null;
  payment_status?: string | null;
  equipment_required?: boolean | null;
  equipment_fee?: number | null;
  manage_token?: string | null;
};
