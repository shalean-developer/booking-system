export type CleanerNotificationType = 'assigned' | 'reassigned_removed' | 'reassigned_new';

type CleanerLike = { id: string; name?: string | null; phone?: string | null };
type BookingLike = {
  id: string;
  start_time?: string | null;
  booking_time?: string | null;
};

/**
 * Cleaner-facing alerts (SMS / WhatsApp / push — placeholder log for now).
 */
export async function sendCleanerNotification({
  type,
  cleaner,
  booking,
}: {
  type: CleanerNotificationType;
  cleaner: CleanerLike;
  booking: BookingLike;
}): Promise<void> {
  const start =
    String(booking.start_time || booking.booking_time || '').trim() || 'scheduled time';

  const messages: Record<CleanerNotificationType, string> = {
    assigned: `New job assigned at ${start}`,
    reassigned_removed: `This job has been reassigned due to delay.`,
    reassigned_new: `Urgent job assigned. Please confirm immediately.`,
  };

  const message = messages[type];
  console.log('[cleaner-notification]', cleaner.id, type, message);
}
