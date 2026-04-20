export type TrackingStatus = 'assigned' | 'en_route' | 'arrived' | 'cleaning' | 'completed';

const TRACKING: TrackingStatus[] = ['assigned', 'en_route', 'arrived', 'cleaning', 'completed'];

export function isTrackingStatus(s: string | null | undefined): s is TrackingStatus {
  return TRACKING.includes(s as TrackingStatus);
}

/** Map legacy booking.status to a display tracking phase when tracking_status is null. */
export function deriveTrackingFromBookingStatus(status: string | null | undefined): TrackingStatus | null {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'pending':
      return null;
    case 'assigned':
    case 'accepted':
    case 'paid':
      return 'assigned';
    case 'on_my_way':
      return 'en_route';
    case 'arrived':
      return 'arrived';
    case 'in-progress':
    case 'in_progress':
      return 'cleaning';
    case 'completed':
      return 'completed';
    default:
      return null;
  }
}

export function effectiveTrackingStatus(row: {
  tracking_status?: string | null;
  status?: string | null;
  cleaner_id?: string | null;
  assigned_cleaner_id?: string | null;
  assigned_cleaners?: string[] | null;
}): TrackingStatus | null {
  if (isTrackingStatus(row.tracking_status)) return row.tracking_status;
  const hasCleaner =
    !!(row.cleaner_id && row.cleaner_id !== 'manual') ||
    !!row.assigned_cleaner_id ||
    (Array.isArray(row.assigned_cleaners) && row.assigned_cleaners.length > 0);
  if (!hasCleaner && ['pending', 'paid'].includes(String(row.status || '').toLowerCase())) {
    return null;
  }
  return deriveTrackingFromBookingStatus(row.status ?? null);
}
