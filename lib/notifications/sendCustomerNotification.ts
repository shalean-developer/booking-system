import { postResendEmail, validateResendConfig } from '@/lib/email/send';

export type CustomerBookingNotificationType =
  | 'accepted'
  | 'on_my_way'
  | 'started'
  | 'completed'
  | 'delay'
  | 'delay_critical'
  | 'reassigned';

type BookingLike = {
  id: string;
  email?: string | null;
  customer_email?: string | null;
  phone?: string | null;
  customer_phone?: string | null;
  booking_time?: string | null;
  start_time?: string | null;
};

/**
 * Lifecycle emails when a cleaner updates job status (Resend + optional SMS log).
 */
export async function sendCustomerNotification({
  type,
  booking,
}: {
  type: CustomerBookingNotificationType;
  booking: BookingLike;
}): Promise<void> {
  const startDisplay =
    String(booking.start_time || booking.booking_time || '').trim() || 'your scheduled time';

  const messageMap: Record<CustomerBookingNotificationType, string> = {
    accepted: `Your cleaner has accepted your booking for ${startDisplay}.`,
    on_my_way: `Your cleaner is on the way 🚗`,
    started: `Your cleaning service has started 🧼`,
    completed: `Your cleaning is complete ✅`,
    delay: `We're sorry — your booking is running behind schedule. Our team has been notified and we're working to get your cleaner to you as soon as possible.`,
    delay_critical: `We're urgently resolving a delay and assigning the best available cleaner.`,
    reassigned: `We've reassigned a cleaner to ensure your service is on time.`,
  };

  const message = messageMap[type];
  const to = String(booking.customer_email || booking.email || '').trim();

  if (to && validateResendConfig().ok) {
    const senderEmail = process.env.SENDER_EMAIL?.trim() || 'no-reply@shalean.com';
    const from = `Shalean <${senderEmail}>`;
    try {
      await postResendEmail({
        from,
        to: [to],
        subject:
          type === 'delay' || type === 'delay_critical' || type === 'reassigned'
            ? 'Update on your booking'
            : 'Booking update',
        html: `<p>${message}</p>`,
      });
    } catch (e) {
      console.warn('[notification] Resend failed:', booking.id, e);
    }
  } else if (!to) {
    console.warn('[notification] No customer email — skip email', booking.id);
  }

  const phone = String(booking.customer_phone || booking.phone || '').trim();
  if (phone) {
    console.log('Send SMS:', phone, message);
  }

  console.log('[notification] Sent:', type, booking.id);
}
