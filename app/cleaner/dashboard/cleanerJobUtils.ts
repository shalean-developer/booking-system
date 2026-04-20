import {
  DEFAULT_ESTIMATED_CLEANER_SHARE_OF_REVENUE,
  getBookingRevenueCents,
  getCleanerPayoutCents,
} from '@/shared/finance-engine/booking-money';
import { isCompletedBooking } from '@/shared/dashboard-data';
import { formatDate, formatTimeRange } from './cleanerDashboardTransforms';
import type { DatabaseBooking, Job, JobStatus } from './cleanerTypes';

function combineAddress(line1?: string, suburb?: string, city?: string): string {
  const parts = [line1, suburb, city].filter(Boolean);
  return parts.join(', ') || 'Address not provided';
}

function clientInitials(name: string): string {
  if (!name?.trim()) return '?';
  const p = name.trim().split(/\s+/);
  if (p.length >= 2) return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function estimatePayRands(
  b: Pick<DatabaseBooking, 'service_type' | 'total_amount' | 'cleaner_earnings'> & {
    earnings_final?: number | null;
    earnings_calculated?: number | null;
  }
): number {
  const serviceTypeLower = (b.service_type || '').toLowerCase();
  const isFixedRateService =
    serviceTypeLower.includes('deep') ||
    serviceTypeLower.includes('move') ||
    serviceTypeLower.includes('carpet');
  if (isFixedRateService) return 250;
  const payoutCents = getCleanerPayoutCents(b);
  if (payoutCents > 0) return payoutCents / 100;
  const rev = getBookingRevenueCents(b);
  return rev ? (rev / 100) * DEFAULT_ESTIMATED_CLEANER_SHARE_OF_REVENUE : 0;
}

function dbToUiStatus(db: string): JobStatus {
  if (db === 'completed') return 'completed';
  if (db === 'in-progress') return 'in_progress';
  if (db === 'arrived') return 'arrived';
  if (db === 'on_my_way') return 'on_my_way';
  if (db === 'assigned') return 'assigned';
  if (db === 'accepted') return 'accepted';
  if (db === 'pending') return 'available';
  return 'accepted';
}

export function rawBookingToJob(
  b: Record<string, unknown>,
  pool: 'available' | 'assigned',
  rating?: number,
): Job {
  const address = combineAddress(
    b.address_line1 as string | undefined,
    b.address_suburb as string | undefined,
    b.address_city as string | undefined,
  );
  const pay = estimatePayRands(b as unknown as DatabaseBooking);
  const payRounded = Math.round(pay * 100) / 100;
  const payStr = `R${payRounded.toFixed(0)}`;
  const bookingDate = String(b.booking_date ?? '');
  const startRaw = (b.start_time as string | undefined) || String(b.booking_time ?? '09:00');
  const bookingTime = startRaw;
  const dbStatus = String(b.status ?? 'pending');

  let status: JobStatus;
  let storedDbStatus: string | undefined;
  if (pool === 'available') {
    status = 'available';
    storedDbStatus = 'pending';
  } else {
    storedDbStatus = dbStatus;
    if (dbStatus === 'pending') {
      status = 'available';
    } else {
      status = dbToUiStatus(dbStatus);
    }
  }

  const distRaw = b.distance;
  const dist =
    distRaw != null && typeof distRaw === 'number'
      ? `${distRaw.toFixed(1)} km`
      : 'Nearby';

  const notesRaw = b.notes;
  const notesStr =
    typeof notesRaw === 'string' ? notesRaw : notesRaw != null ? String(notesRaw) : '';

  const phoneRaw = b.customer_phone;
  const customerPhone =
    typeof phoneRaw === 'string' && phoneRaw.trim() ? phoneRaw.trim() : undefined;
  const mapsQuery = encodeURIComponent(address);

  const pickIso = (a: unknown, b: unknown): string | undefined => {
    const s = (typeof a === 'string' && a ? a : typeof b === 'string' && b ? b : '') || '';
    return s || undefined;
  };

  const job: Job = {
    id: String(b.id),
    service: String(b.service_type ?? 'Cleaning'),
    date: formatDate(bookingDate),
    time: formatTimeRange(bookingTime),
    client: String(b.customer_name ?? 'Client'),
    clientInitial: clientInitials(String(b.customer_name ?? 'C')),
    address,
    pay: payStr,
    payNumber: payRounded,
    duration: '2–3 hrs',
    distance: dist,
    notes: notesStr,
    status,
    dbStatus: storedDbStatus,
    customerPhone,
    mapsQuery,
    acceptedAt: pickIso(b.cleaner_accepted_at, b.accepted_at),
    onMyWayAt: pickIso(b.cleaner_on_my_way_at, b.on_my_way_at),
    startedAt: pickIso(b.cleaner_started_at, b.started_at),
    completedAt: pickIso(b.cleaner_completed_at, b.completed_at),
  };

  if (isCompletedBooking(status) && rating !== undefined && rating > 0) {
    job.rating = rating;
  }

  return job;
}

export function pickActiveRawBooking(
  bookings: Record<string, unknown>[],
): Record<string, unknown> | null {
  const active = bookings.filter(b => {
    const s = String(b.status);
    return (
      s === 'pending' ||
      s === 'paid' ||
      s === 'assigned' ||
      s === 'accepted' ||
      s === 'on_my_way' ||
      s === 'arrived' ||
      s === 'in-progress'
    );
  });
  if (active.length === 0) return null;
  const rank: Record<string, number> = {
    'in-progress': 0,
    arrived: 1,
    on_my_way: 2,
    assigned: 3,
    accepted: 4,
    pending: 5,
    paid: 6,
  };
  active.sort((a, b) => (rank[String(a.status)] ?? 9) - (rank[String(b.status)] ?? 9));
  return active[0];
}
