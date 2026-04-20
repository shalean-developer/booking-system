export type BookingAbVariant = 'A' | 'B';

/** Conversion-focused copy under each time slot (matches occupancy `remaining`). */
export function getAvailabilityUrgencyLabel(
  remaining: number,
  variant: BookingAbVariant = 'A'
): string {
  if (remaining === 0) return 'Fully booked';
  if (remaining === 1) return 'Last chance • Book now';
  if (remaining <= 3) return 'Filling fast';
  if (variant === 'B') return 'Filling fast';
  return 'Available';
}

/** Tailwind classes for time-slot availability subline (urgency-driven). */
export function getAvailabilityStyle(remaining: number): string {
  if (remaining === 0) return 'text-gray-400 bg-gray-100';
  if (remaining === 1) return 'text-red-600 bg-red-50 animate-pulse';
  if (remaining <= 3) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
}
