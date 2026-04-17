import { validateResendConfig, sendEmail } from '@/lib/email/send';
import { escapeHtml } from '@/shared/email/escape-html';
import { formatBookingDateDisplay, formatBookingTimeDisplay } from '@/shared/email/datetime';

export async function sendBookingRescheduledNotice(
  to: string | null | undefined,
  params: { bookingDate: string; bookingTime: string },
): Promise<void> {
  const email = to?.trim();
  if (!email) return;
  if (!validateResendConfig().ok) {
    console.warn('[booking-manage-notify] Resend not configured — skip reschedule notice');
    return;
  }
  const dateLabel = formatBookingDateDisplay(params.bookingDate) ?? params.bookingDate;
  const timeLabel = formatBookingTimeDisplay(params.bookingTime) ?? params.bookingTime;
  try {
    await sendEmail({
      to: email,
      subject: 'Booking rescheduled',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <p>Your booking has been updated.</p>
        <p><strong>New date:</strong> ${escapeHtml(dateLabel)}<br/>
        <strong>New time:</strong> ${escapeHtml(timeLabel)}</p>
        <p style="color:#666;font-size:14px">If you did not request this change, contact us immediately.</p>
      </div>`,
    });
  } catch (e) {
    console.error('[booking-manage-notify] Reschedule email failed', e);
  }
}

export async function sendBookingCancelledNotice(to: string | null | undefined): Promise<void> {
  const email = to?.trim();
  if (!email) return;
  if (!validateResendConfig().ok) {
    console.warn('[booking-manage-notify] Resend not configured — skip cancel notice');
    return;
  }
  try {
    await sendEmail({
      to: email,
      subject: 'Booking cancelled',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
        <p>Your booking has been cancelled.</p>
        <p style="color:#666;font-size:14px">If this was a mistake, reply to this email or WhatsApp 
        <a href="https://wa.me/27871535250">+27 87 153 5250</a>.</p>
      </div>`,
    });
  } catch (e) {
    console.error('[booking-manage-notify] Cancel email failed', e);
  }
}
