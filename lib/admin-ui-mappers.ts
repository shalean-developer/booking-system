import { formatTimeSafe } from '@/lib/date-utils';
import { normalizeBookingStatusForUi, type AdminUiBookingStatus } from '@/lib/booking-status-ui';

export type BookingsPageRow = {
  id: string;
  client: string;
  email: string;
  service: string;
  cleaner: string;
  cleanerId: string;
  date: string;
  time: string;
  amount: number;
  status: AdminUiBookingStatus;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  address: string;
  suburb: string;
  /** raw DB status for PATCH / display */
  dbStatus?: string;
};

export function mapAdminBookingApiToRow(b: {
  id: string;
  customer_name?: string | null;
  customer_email?: string | null;
  service_type?: string | null;
  booking_date?: string | null;
  booking_time?: string | null;
  status?: string | null;
  total_amount?: number | null;
  cleaner_id?: string | null;
  cleaner_name?: string | null;
  address_line1?: string | null;
  address_suburb?: string | null;
  payment_reference?: string | null;
  paystack_ref?: string | null;
}): BookingsPageRow {
  const amountZar = (Number(b.total_amount) || 0) / 100;
  const hasPaid =
    !!(b.payment_reference || b.paystack_ref) ||
    ['paid', 'completed', 'accepted', 'in-progress', 'on_my_way'].includes(
      (b.status || '').toLowerCase()
    );
  const paymentStatus: BookingsPageRow['paymentStatus'] = hasPaid ? 'paid' : 'pending';

  const timeRaw = b.booking_time || '';
  const timeDisplay = timeRaw ? formatTimeSafe(timeRaw) : '';

  return {
    id: b.id,
    client: b.customer_name || 'Unknown',
    email: b.customer_email || '',
    service: b.service_type || '—',
    cleaner: b.cleaner_name || 'Unassigned',
    cleanerId: b.cleaner_id || '',
    date: b.booking_date || '',
    time: timeDisplay || timeRaw,
    amount: amountZar,
    status: normalizeBookingStatusForUi(b.status),
    paymentStatus,
    address: b.address_line1 || '',
    suburb: b.address_suburb || '',
    dbStatus: b.status || undefined,
  };
}
