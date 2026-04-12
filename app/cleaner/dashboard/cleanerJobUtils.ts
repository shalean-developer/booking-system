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
  b: Pick<DatabaseBooking, 'service_type' | 'total_amount' | 'cleaner_earnings'>,
): number {
  const serviceTypeLower = (b.service_type || '').toLowerCase();
  const isFixedRateService =
    serviceTypeLower.includes('deep') ||
    serviceTypeLower.includes('move') ||
    serviceTypeLower.includes('carpet');
  if (isFixedRateService) return 250;
  if (b.cleaner_earnings) return b.cleaner_earnings / 100;
  return b.total_amount ? (b.total_amount / 100) * 0.7 : 0;
}

function dbToUiStatus(db: string): JobStatus {
  if (db === 'completed') return 'completed';
  if (db === 'in-progress') return 'in_progress';
  if (db === 'pending') return 'available';
  if (db === 'accepted' || db === 'on_my_way') return 'accepted';
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
  const bookingTime = String(b.booking_time ?? '09:00');
  const dbStatus = String(b.status ?? 'pending');

  let status: JobStatus;
  let storedDbStatus: string | undefined;
  if (pool === 'available') {
    status = 'available';
    storedDbStatus = 'pending';
  } else {
    status = dbToUiStatus(dbStatus);
    storedDbStatus = dbStatus;
  }

  const distRaw = b.distance;
  const dist =
    distRaw != null && typeof distRaw === 'number'
      ? `${distRaw.toFixed(1)} km`
      : 'Nearby';

  const notesRaw = b.notes;
  const notesStr =
    typeof notesRaw === 'string' ? notesRaw : notesRaw != null ? String(notesRaw) : '';

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
  };

  if (status === 'completed' && rating !== undefined && rating > 0) {
    job.rating = rating;
  }

  return job;
}

export function pickActiveRawBooking(
  bookings: Record<string, unknown>[],
): Record<string, unknown> | null {
  const active = bookings.filter(b => {
    const s = String(b.status);
    return s === 'accepted' || s === 'on_my_way' || s === 'in-progress';
  });
  if (active.length === 0) return null;
  const rank: Record<string, number> = { 'in-progress': 0, on_my_way: 1, accepted: 2 };
  active.sort((a, b) => (rank[String(a.status)] ?? 9) - (rank[String(b.status)] ?? 9));
  return active[0];
}
