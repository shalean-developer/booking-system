import {
  bookingConfirmationSubject,
  renderBookingEmail,
} from '@/shared/email/renderer';
import type { BookingEmailData } from '@/shared/email/types';

/**
 * Send via Resend HTTP API (POST only). Do not use resend.emails.get() or GET /emails/:id
 * with non-UUID ids — that caused 422 "id must be a valid UUID" (e.g. /emails/0).
 */
async function postResendEmail(params: {
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
  const body: Record<string, unknown> = {
    from: params.from,
    to: params.to,
    subject: params.subject,
    html: params.html,
  };
  if (params.attachments?.length) {
    body.attachments = params.attachments;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { id?: string; message?: string; name?: string };
  if (!res.ok) {
    console.error('❌ Resend API error:', res.status, json);
    throw new Error(json.message || `Resend request failed (${res.status})`);
  }
  return { id: json.id };
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

export async function sendEmail({ to, subject, html }: EmailData) {
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@shalean.co.za';
  const senderName = 'Shalean Cleaning';
  const fromAddress = `${senderName} <${senderEmail}>`;

  const { id: emailId } = await postResendEmail({
    from: fromAddress,
    to: [to],
    subject,
    html,
  });

  console.log('Email sent successfully:', { emailId });
  return { success: true, messageId: emailId };
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
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@shalean.co.za';
  const senderName = 'Shalean Cleaning';
  const fromAddress = `${senderName} <${senderEmail}>`;
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
