import { postResendEmail, validateResendConfig } from '@/lib/email/send';
import { resolveAdminNotificationEmail } from '@/lib/admin-email';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Email ops inbox when a booking breaches SLA (Resend).
 */
export async function sendAdminNotification(params: {
  bookingId: string;
  issues: string[];
  /** Defaults to SLA warning subject */
  subject?: string;
}): Promise<void> {
  const { bookingId, issues, subject } = params;
  if (!issues.length) return;

  const to = resolveAdminNotificationEmail().trim();
  if (!to || !validateResendConfig().ok) {
    console.warn('[sendAdminNotification] Skip — admin email or Resend not configured', bookingId);
    return;
  }

  const senderEmail = process.env.SENDER_EMAIL?.trim() || 'no-reply@shalean.com';
  const from = `Shalean <${senderEmail}>`;
  const list = issues.map((i) => `<li>${escapeHtml(i)}</li>`).join('');
  const html = `<p>SLA warning for booking <strong>${escapeHtml(bookingId)}</strong></p><ul>${list}</ul>`;

  try {
    await postResendEmail({
      from,
      to: [to],
      subject: subject ?? `SLA warning: ${bookingId}`,
      html,
    });
    console.log('[notification] Admin SLA alert sent:', bookingId);
  } catch (e) {
    console.warn('[sendAdminNotification] Resend failed:', bookingId, e);
  }
}
