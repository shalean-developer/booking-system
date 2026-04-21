import { Resend } from 'resend';
import {
  bookingConfirmationSubject,
  renderBookingEmail,
} from '@/shared/email/renderer';
import type { BookingEmailData } from '@/shared/email/types';

export type SendEmailResult =
  | { success: true; messageId?: string }
  | { success: false; error: string };

function getSenderFromAddress(): string {
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@shalean.co.za';
  const senderName = 'Shalean Cleaning';
  return `${senderName} <${senderEmail}>`;
}

/**
 * Low-level send via Resend SDK (used for HTML + optional attachments).
 */
export async function postResendEmail(params: {
  from: string;
  to: string[];
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}): Promise<{ id?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  const resend = new Resend(key);
  const { data, error } = await resend.emails.send({
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
    ...(params.attachments?.length
      ? {
          attachments: params.attachments.map((a) => ({
            filename: a.filename,
            content: a.content,
          })),
        }
      : {}),
  });
  if (error) {
    console.error('❌ Resend API error:', error);
    throw new Error(error.message || 'Resend send failed');
  }
  return { id: data?.id };
}

/** Call before sending; logs clearly when misconfigured (local + prod). */
export function validateResendConfig(): { ok: true } | { ok: false; error: string } {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    const msg = 'RESEND_API_KEY is missing — set it in .env.local';
    console.error('❌ [email]', msg);
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

/**
 * Resend-backed send with structured success/failure (no throw).
 */
export async function sendEmailSafe({ to, subject, html }: EmailData): Promise<SendEmailResult> {
  const cfg = validateResendConfig();
  if (!cfg.ok) {
    return { success: false, error: cfg.error };
  }
  try {
    const fromAddress = getSenderFromAddress();
    const { id: emailId } = await postResendEmail({
      from: fromAddress,
      to: [to],
      subject,
      html,
    });
    console.log('[email] sent', { messageId: emailId });
    return { success: true, messageId: emailId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[email] send failed', msg);
    return { success: false, error: msg };
  }
}

/**
 * Same as {@link sendEmailSafe} but throws on failure — matches legacy transactional callers.
 */
export async function sendEmail({ to, subject, html }: EmailData) {
  const r = await sendEmailSafe({ to, subject, html });
  if (!r.success) {
    throw new Error(r.error);
  }
  return { success: true as const, messageId: r.messageId };
}

export async function sendBookingEmailWithData(
  to: string,
  data: BookingEmailData,
  opts?: { invoicePdf?: Buffer; invoiceAttachmentFilename?: string },
) {
  const html = renderBookingEmail(data);
  const subject = bookingConfirmationSubject(data);
  const attachments =
    opts?.invoicePdf && opts.invoicePdf.byteLength > 0 && opts.invoiceAttachmentFilename
      ? [{ filename: opts.invoiceAttachmentFilename, content: opts.invoicePdf.toString('base64') }]
      : undefined;
  const fromAddress = getSenderFromAddress();
  const { id: emailId } = await postResendEmail({
    from: fromAddress,
    to: [to],
    subject,
    html,
    attachments,
  });
  console.log('Email sent successfully:', { emailId });
  return { success: true, messageId: emailId };
}

export { bookingConfirmationSubject, renderBookingEmail };
