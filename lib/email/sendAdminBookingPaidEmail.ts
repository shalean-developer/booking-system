import { resolveAdminNotificationEmail } from '@/lib/admin-email';
import { postResendEmail } from '@/lib/email/send';
import type { AdminBookingPaidTemplateParams } from '@/lib/email/templates/adminBookingPaid';
import { adminBookingPaidTemplate } from '@/lib/email/templates/adminBookingPaid';

/**
 * Sends the professional admin notification for a paid booking (Resend + optional PDF).
 */
export async function sendAdminBookingPaidEmail(params: AdminBookingPaidTemplateParams & {
  invoicePdf?: Buffer | null;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const sender = process.env.SENDER_EMAIL?.trim() || 'noreply@shalean.co.za';
  if (!apiKey) {
    console.warn('[sendAdminBookingPaidEmail] RESEND_API_KEY missing — skipped');
    return { ok: false, error: 'RESEND_API_KEY missing' };
  }

  const admin = resolveAdminNotificationEmail();
  const html = adminBookingPaidTemplate(params);
  const displayId = /^SC\d{8}$/i.test(params.booking.id)
    ? params.booking.id
    : params.booking.id.slice(-8);
  const invLabel = params.zohoInvoiceNumber?.trim() || displayId;
  const subject = `Booking paid • ${displayId} • ${params.booking.customer_name || 'Customer'}`;

  const attachments: { filename: string; content: string }[] | undefined =
    params.invoicePdf && params.invoicePdf.length > 0
      ? [
          {
            filename: `Invoice-${invLabel.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`,
            content: params.invoicePdf.toString('base64'),
          },
        ]
      : undefined;

  try {
    await postResendEmail({
      from: `Shalean Cleaning <${sender}>`,
      to: [admin],
      subject,
      html,
      attachments,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[sendAdminBookingPaidEmail]', msg);
    return { ok: false, error: msg };
  }
}
