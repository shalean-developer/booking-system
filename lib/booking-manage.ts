import { createServiceClient } from '@/lib/supabase-server';
import { isValidManageTokenFormat } from '@/lib/manage-booking-token';

export const DEFAULT_PUBLIC_SITE_BASE = 'https://shalean.co.za';

function normalizePublicSiteBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  let t = trimmed.replace(/^https?:\/\/shalean\.com(?=\/|$)/i, 'https://shalean.co.za');
  // Emails require absolute URLs; bare "domain.com" breaks <a href> in many clients.
  if (t.length > 0 && !/^https?:\/\//i.test(t)) {
    t = `https://${t.replace(/^\/+/, '')}`;
  }
  return t;
}

export function publicSiteBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_PUBLIC_SITE_BASE;
  return normalizePublicSiteBase(raw);
}

export type BookingRowForManage = {
  id: string;
  service_type: string | null;
  booking_date: string | null;
  booking_time: string | null;
  address_line1: string | null;
  address_suburb: string | null;
  address_city: string | null;
  customer_name: string | null;
  customer_email?: string | null;
  status: string | null;
  manage_token: string | null;
  total_amount: number | null;
};

/** Public-safe view — no internal UUID. */
export type PublicBookingManageView = {
  referenceLabel: string;
  serviceName: string;
  bookingDate: string | null;
  bookingTime: string | null;
  addressLine: string;
  customerName: string;
  status: string;
  amountZar: number | null;
};

function referenceLabelFromRow(id: string): string {
  return /^SC\d{8}$/i.test(id) ? id : id.replace(/-/g, '').slice(-8).toUpperCase();
}

export function toPublicBookingView(row: BookingRowForManage): PublicBookingManageView {
  const amt = row.total_amount;
  const amountZar =
    typeof amt === 'number' && Number.isFinite(amt) ? Math.round(amt) / 100 : null;

  const parts = [row.address_line1, row.address_suburb, row.address_city].filter(Boolean);
  return {
    referenceLabel: referenceLabelFromRow(row.id),
    serviceName: row.service_type || 'Cleaning',
    bookingDate: row.booking_date,
    bookingTime: row.booking_time,
    addressLine: parts.join(', ') || '—',
    customerName: row.customer_name?.trim() || 'Customer',
    status: row.status || 'pending',
    amountZar,
  };
}

export async function getBookingByManageToken(token: string) {
  if (!isValidManageTokenFormat(token)) {
    return { data: null as BookingRowForManage | null, error: null, reason: 'invalid_token' as const };
  }
  const supabase = createServiceClient();
  const normalized = token.trim().toLowerCase();
  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, service_type, booking_date, booking_time, address_line1, address_suburb, address_city, customer_name, customer_email, status, manage_token, total_amount',
    )
    .eq('manage_token', normalized)
    .maybeSingle();
  return { data: data as BookingRowForManage | null, error, reason: undefined as undefined };
}

export function canManageBooking(row: BookingRowForManage): boolean {
  if (!row.manage_token) return false;
  const s = (row.status || '').toLowerCase();
  if (s === 'cancelled' || s === 'canceled' || s === 'completed') return false;
  return true;
}

export function isBookingDateInPast(date: string | null): boolean {
  if (!date) return false;
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}
