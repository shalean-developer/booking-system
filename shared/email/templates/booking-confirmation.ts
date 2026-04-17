import { escapeHtml } from '../escape-html';
import type { BookingEmailData } from '../types';
import { SUPPORT_WHATSAPP_URL } from '@/lib/contact';
import { emailBrandedDocument } from './email-shell';

export function bookingConfirmationTemplate(data: BookingEmailData): string {
  const {
    customerName,
    serviceName,
    bookingId,
    amountZar,
    status,
    invoiceId,
    invoiceNumber,
    invoiceUrl,
    bookingDate,
    address,
    bookingTime,
    siteBaseUrl,
    manageToken,
    paymentReference,
    equipmentRequired,
    equipmentFeeZar,
    cleanerSummary,
    invoicePdfMissingNote,
  } = data;

  const e = escapeHtml;
  const isPaid = status === 'paid';

  const normalizedInvoiceNumber = (invoiceNumber || '').trim();
  const normalizedInvoiceId = (invoiceId || '').trim();
  const looksLikeBookingOrOrderRef = (value: string): boolean => {
    const v = value.trim();
    return /^SC\d{6,}$/i.test(v) || /^booking-/i.test(v);
  };
  const invoiceDisplay = normalizedInvoiceNumber
    ? normalizedInvoiceNumber
    : normalizedInvoiceId && !looksLikeBookingOrOrderRef(normalizedInvoiceId)
      ? normalizedInvoiceId
      : '';

  /** Must be https:// origin or email clients show broken [host/path]text instead of links. */
  const rawBase = (siteBaseUrl || 'https://shalean.co.za').trim().replace(/\/$/, '');
  const base = /^https?:\/\//i.test(rawBase)
    ? rawBase
    : `https://${rawBase.replace(/^\/+/, '')}`;
  const whenLine = [bookingDate, bookingTime].filter(Boolean).join(' · ');

  const token = manageToken?.trim();
  const rescheduleUrl = token ? `${base}/booking/reschedule?token=${encodeURIComponent(token)}` : '';
  const cancelUrl = token ? `${base}/booking/cancel?token=${encodeURIComponent(token)}` : '';
  const manageUrl = token ? `${base}/booking/manage?token=${encodeURIComponent(token)}` : '';

  const subtitle = isPaid
    ? 'Thank you — your payment was received and your booking is confirmed.'
    : "We've received your booking. Complete payment to lock in your slot.";

  const amountLabel = isPaid ? 'Amount paid' : 'Amount due';

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 0;color:#6b7280;font-size:14px;vertical-align:top;width:42%;">${e(label)}</td>
      <td style="padding:10px 0;text-align:right;color:#111827;font-size:14px;font-weight:600;">${value}</td>
    </tr>`;

  const detailsRows = [
    row('Service', `<strong>${e(serviceName)}</strong>`),
    row('Booking ID', `<strong>#${e(bookingId)}</strong>`),
    whenLine ? row('When', `<strong>${e(whenLine)}</strong>`) : '',
    address ? row('Address', `<strong>${e(address)}</strong>`) : '',
    typeof amountZar === 'number' && Number.isFinite(amountZar)
      ? row(amountLabel, `<strong style="font-weight:700;">R ${amountZar.toFixed(2)}</strong>`)
      : '',
    invoiceDisplay ? row('Invoice', `<strong>${e(invoiceDisplay)}</strong>`) : '',
    paymentReference?.trim()
      ? row('Payment reference', `<strong>${e(paymentReference.trim())}</strong>`)
      : '',
    equipmentRequired === true
      ? row(
          'Equipment',
          `<strong>Requested${
            typeof equipmentFeeZar === 'number' && Number.isFinite(equipmentFeeZar) && equipmentFeeZar > 0
              ? ` (+ R ${equipmentFeeZar.toFixed(2)})`
              : ''
          }</strong>`,
        )
      : '',
    cleanerSummary?.trim() ? row('Cleaner', `<strong>${e(cleanerSummary.trim())}</strong>`) : '',
  ]
    .filter(Boolean)
    .join('');

  const manageLinks = token
    ? `
        <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 12px;font-size:11px;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;font-weight:700;">Manage your booking</p>
          <p style="margin:0 0 10px;font-size:14px;color:#4b5563;line-height:1.5;">
            <a href="${e(rescheduleUrl)}" style="color:#0C53ED;text-decoration:none;font-weight:600;">Reschedule</a>
            <span style="color:#d1d5db;margin:0 10px;">|</span>
            <a href="${e(cancelUrl)}" style="color:#dc2626;text-decoration:none;font-weight:600;">Cancel</a>
          </p>
          <p style="margin:0;font-size:13px;color:#6b7280;">
            <a href="${e(manageUrl)}" style="color:#0C53ED;text-decoration:none;font-weight:500;">Open manage booking</a>
          </p>
        </div>`
    : '';

  const invoiceBlock = invoiceUrl?.trim()
    ? `
        <p style="margin:20px 0 0;padding:14px 16px;background:#eff6ff;border-radius:10px;border:1px solid #bfdbfe;font-size:14px;color:#1e3a8a;">
          <strong>Invoice</strong> —
          <a href="${e(invoiceUrl.trim())}" style="color:#0C53ED;font-weight:600;text-decoration:none;">Download or view</a>
        </p>`
    : '';

  const invoiceMissingNoteBlock =
    isPaid && invoicePdfMissingNote?.trim() && !invoiceUrl?.trim()
      ? `
        <p style="margin:20px 0 0;padding:14px 16px;background:#fffbeb;border-radius:10px;border:1px solid #fde68a;font-size:14px;color:#92400e;line-height:1.55;">
          ${e(invoicePdfMissingNote.trim())}
        </p>`
      : '';

  const bodyHtml = `
      <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
        Hi <strong>${e(customerName)}</strong>,
      </p>
      <h2 style="margin:0 0 14px;color:#111827;font-size:16px;font-weight:700;">Your booking details</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
        ${detailsRows}
      </table>
      ${invoiceBlock}
      ${invoiceMissingNoteBlock}
      <p style="margin:22px 0 0;font-size:14px;">
        <a href="${SUPPORT_WHATSAPP_URL}" style="color:#0C53ED;text-decoration:none;font-weight:600;">Message us on WhatsApp</a>
      </p>
      ${manageLinks}
  `;

  return emailBrandedDocument({
    eyebrow: 'Shalean Cleaning',
    title: isPaid ? 'Booking confirmed' : 'Booking received',
    subtitle,
    bodyHtml,
  });
}
