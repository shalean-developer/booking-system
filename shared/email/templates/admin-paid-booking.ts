import { escapeHtml } from '../escape-html';
import { emailBrandedDocument } from './email-shell';

/** Payload for the admin “new paid booking” alert (was inline in booking-paid-server). */
export type AdminPaidBookingEmailData = {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  dateText: string;
  timeText: string;
  endText: string | null;
  frequencyText: string;
  cleanerText: string;
  addressText: string;
  amountZar: number;
  serviceFeeCents: number;
  tipCents: number;
  frequencyDiscountCents: number;
  surgeApplied: boolean;
  surgeCents: number;
  paymentReference: string;
  zohoInvoiceId: string | null;
  bedrooms: number | undefined;
  bathrooms: number | undefined;
  cleaners: number | undefined;
  extrasHtml: string;
  notesHtml: string;
};

function row(label: string, valueHtml: string): string {
  const e = escapeHtml;
  return `<tr>
    <td style="padding:10px 0;color:#6b7280;font-size:14px;vertical-align:top;">${e(label)}</td>
    <td style="padding:10px 0;text-align:right;color:#111827;font-size:14px;font-weight:600;">${valueHtml}</td>
  </tr>`;
}

export function adminPaidBookingNotificationHtml(data: AdminPaidBookingEmailData): string {
  const e = escapeHtml;
  const timeCell =
    e(data.timeText) + (data.endText ? ` - ${e(data.endText)}` : '');

  const body = `
      <h2 style="margin:0 0 14px 0;color:#111827;font-size:16px;font-weight:700;">Booking summary</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
        ${row('Booking ID', `<strong>${e(data.bookingId)}</strong>`)}
        ${row('Customer', `<strong>${e(data.customerName)}</strong>`)}
        ${row('Customer email', `<strong>${e(data.customerEmail)}</strong>`)}
        ${row('Customer phone', `<strong>${e(data.customerPhone)}</strong>`)}
        ${row('Service', `<strong>${e(data.serviceName)}</strong>`)}
        ${row('Date', `<strong>${e(data.dateText)}</strong>`)}
        ${row('Time', `<strong>${timeCell}</strong>`)}
        ${row('Address', `<strong>${e(data.addressText)}</strong>`)}
        ${row('Frequency', `<strong>${e(data.frequencyText)}</strong>`)}
        ${row('Cleaner selection', `<strong>${e(data.cleanerText)}</strong>`)}
        ${row('Amount paid', `<strong style="font-weight:700;">R ${data.amountZar.toFixed(2)}</strong>`)}
        ${row('Service fee', `<strong>R ${(data.serviceFeeCents / 100).toFixed(2)}</strong>`)}
        ${row('Tip amount', `<strong>R ${(data.tipCents / 100).toFixed(2)}</strong>`)}
        ${row('Frequency discount', `<strong>R ${(data.frequencyDiscountCents / 100).toFixed(2)}</strong>`)}
        ${row(
          'Surge pricing',
          `<strong>${
            data.surgeApplied ? `Yes (R ${(data.surgeCents / 100).toFixed(2)})` : 'No'
          }</strong>`,
        )}
        ${row('Payment reference', `<strong>${e(data.paymentReference)}</strong>`)}
        ${row('Invoice ID', `<strong>${data.zohoInvoiceId ? e(data.zohoInvoiceId) : 'Pending'}</strong>`)}
      </table>
      <h2 style="margin:18px 0 10px 0;color:#111827;font-size:16px;font-weight:700;">Service details chosen</h2>
      <p style="margin:0 0 8px 0;color:#4b5563;font-size:14px;">
        Bedrooms: <strong>${data.bedrooms ?? 'N/A'}</strong> &nbsp;|&nbsp; Bathrooms: <strong>${data.bathrooms ?? 'N/A'}</strong> &nbsp;|&nbsp; Cleaners: <strong>${data.cleaners ?? 1}</strong>
      </p>
      <p style="margin:0;color:#4b5563;font-size:14px;">Extras selected:</p>
      <ul style="margin:8px 0 0 18px;padding:0;color:#111827;font-size:14px;">
        ${data.extrasHtml}
      </ul>
      ${data.notesHtml}
  `;

  return emailBrandedDocument({
    eyebrow: 'Shalean admin',
    title: 'New paid booking',
    subtitle: 'A customer payment has been confirmed.',
    bodyHtml: body,
  });
}
