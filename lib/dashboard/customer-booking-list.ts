import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Single ordering contract for customer booking lists:
 * GET /api/dashboard/bookings, invoice summaries, and any other customer booking reads
 * must use this so rows appear in the same order everywhere.
 */
export const CUSTOMER_BOOKINGS_ORDER = {
  column: 'booking_date' as const,
  ascending: false as const,
};

export const CUSTOMER_INVOICE_LIST_SELECT =
  'id, service_type, created_at, total_amount, status, payment_status, invoice_url, booking_date' as const;

export function listCustomerBookingsForInvoicePage(
  supabase: SupabaseClient,
  customerId: string
) {
  return supabase
    .from('bookings')
    .select(CUSTOMER_INVOICE_LIST_SELECT)
    .eq('customer_id', customerId)
    .order(CUSTOMER_BOOKINGS_ORDER.column, { ascending: CUSTOMER_BOOKINGS_ORDER.ascending });
}
