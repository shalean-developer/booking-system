/**
 * Shared invoice list helpers (bookings row → display labels).
 * Amounts use DB column `total_amount`; invoice payment state uses `payment_status`.
 */

export type InvoicePaymentLabel = 'Paid' | 'Pending';

export function invoicePaymentLabel(
  paymentStatus: string | null | undefined,
  bookingStatus?: string | null
): InvoicePaymentLabel {
  const s = (paymentStatus ?? '').toLowerCase();
  if (s === 'success' || s === 'paid') return 'Paid';
  const b = (bookingStatus ?? '').toLowerCase();
  if (b === 'paid') return 'Paid';
  return 'Pending';
}

/** Raw numeric display (e.g. already in rands). */
export function formatZarAmount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-ZA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

/** Bookings store `total_amount` in minor units (cents). */
export function formatZarFromMinorUnits(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const zar = Number(value) / 100;
  return new Intl.NumberFormat('en-ZA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(zar);
}
