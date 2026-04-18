import { formatZarFromMinorUnits, invoicePaymentLabel } from '@/lib/invoice-bookings';
import type { BookingStatus } from '@/components/dashboard/customer-portal/types';
import { InvoicePaymentBadge } from './invoice-payment-badge';
import { StatusBadge } from './status-badge';

export type CustomerInvoiceBookingRow = {
  id: string;
  service_type: string | null;
  created_at: string | null;
  booking_date: string | null;
  total_amount: number | null;
  status: string;
  payment_status: string | null;
  invoice_url: string | null;
};

function normalizeBookingStatus(raw: string): BookingStatus {
  if (raw === 'upcoming' || raw === 'completed' || raw === 'cancelled') return raw;
  return 'upcoming';
}

export function CustomerInvoiceRow({ booking: b }: { booking: CustomerInvoiceBookingRow }) {
  const payLabel = invoicePaymentLabel(b.payment_status, b.status);
  const displayDateIso = b.booking_date ?? b.created_at;
  const displayDate = displayDateIso ? new Date(displayDateIso).toLocaleDateString('en-ZA') : '—';

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-gray-900">#{b.id}</p>
        <p className="text-sm text-gray-500">
          {b.service_type ?? 'Service'}{' '}
          <span className="text-gray-300">•</span> {displayDate}
        </p>
        <p className="text-sm text-gray-600">R {formatZarFromMinorUnits(b.total_amount)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <InvoicePaymentBadge label={payLabel} />
        <StatusBadge status={normalizeBookingStatus(b.status)} />

        {b.invoice_url ? (
          <a
            href={b.invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 hover:text-indigo-700"
          >
            Download →
          </a>
        ) : (
          <span className="text-xs text-gray-400">No PDF yet</span>
        )}
      </div>
    </div>
  );
}
