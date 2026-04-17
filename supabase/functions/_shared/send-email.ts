import { encode as encodeBase64 } from 'https://deno.land/std@0.208.0/encoding/base64.ts';
import type { BookingEmailData } from '../../../shared/email/types.ts';
import { bookingConfirmationSubject, renderBookingEmail } from '../../../shared/email/renderer.ts';

export async function resendSendEmail(params: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string }[];
}): Promise<{ ok: boolean; providerId?: string; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY')?.trim();
  const sender = Deno.env.get('SENDER_EMAIL')?.trim() || 'noreply@shalean.co.za';
  if (!apiKey) {
    console.warn('[send-email] RESEND_API_KEY not set');
    return { ok: false, error: 'RESEND_API_KEY missing' };
  }

  const body: Record<string, unknown> = {
    from: `Shalean Cleaning <${sender}>`,
    to: [params.to],
    subject: params.subject,
    html: params.html,
  };
  if (params.attachments?.length) {
    body.attachments = params.attachments;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('[send-email] Resend error', data);
    return { ok: false, error: data?.message || 'Resend error' };
  }
  return { ok: true, providerId: data?.id as string | undefined };
}

/** Customer booking email using the same renderer as Next.js. */
export async function sendBookingEmailDeno(
  to: string,
  data: BookingEmailData,
  opts?: { invoicePdf?: Uint8Array; invoiceAttachmentFilename?: string },
): Promise<{ ok: boolean; providerId?: string; error?: string }> {
  const html = renderBookingEmail(data);
  const subject = bookingConfirmationSubject(data);
  let attachments: { filename: string; content: string }[] | undefined;
  if (opts?.invoicePdf && opts.invoicePdf.byteLength > 0 && opts.invoiceAttachmentFilename) {
    attachments = [
      {
        filename: opts.invoiceAttachmentFilename,
        content: encodeBase64(opts.invoicePdf),
      },
    ];
  }
  return resendSendEmail({ to: to.trim(), subject, html, attachments });
}
