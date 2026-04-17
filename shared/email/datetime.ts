/** Shared date/time formatting for booking emails (Node + Deno). */

export function formatBookingDateDisplay(date: string | null | undefined): string | undefined {
  if (!date) return undefined;
  try {
    return new Date(date).toLocaleDateString('en-ZA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return undefined;
  }
}

export function formatBookingTimeDisplay(time: string | null | undefined): string | undefined {
  if (!time) return undefined;
  try {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return undefined;
  }
}
