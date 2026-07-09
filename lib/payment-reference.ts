/** `booking-{uuid}` or `booking-{uuid}-{suffix}` -> booking UUID */
export function parseBookingIdFromBookingPrefixedReference(reference: string): string | null {
  if (!reference.startsWith('booking-')) return null;
  const rest = reference.slice('booking-'.length);
  const m = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(rest);
  return m ? m[1] : null;
}
