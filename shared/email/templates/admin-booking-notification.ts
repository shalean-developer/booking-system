import { escapeHtml } from '../escape-html';
import { emailBrandedDocument } from './email-shell';

export type AdminBookingNotificationData = {
  bookingId: string;
  customerName: string;
  email: string;
  phone: string;
  serviceLabel: string;
  formattedDate: string;
  formattedTime: string;
  addressLines: string[];
  bedrooms: number;
  bathrooms: number;
  extrasLines: string[];
  notes: string | null;
  cleaner: { kind: 'manual' } | { kind: 'assigned'; id: string } | { kind: 'none' };
  totalPrice: number;
  nextStepLines: string[];
  receivedAtLabel: string;
};

function rowTwoCol(label: string, valueHtml: string): string {
  const e = escapeHtml;
  return `<tr>
    <td style="padding:8px 0;color:#6b7280;vertical-align:top;width:140px;font-size:14px;">${e(label)}</td>
    <td style="padding:8px 0;font-size:14px;color:#111827;">${valueHtml}</td>
  </tr>`;
}

const LINK = '#0C53ED';

export function adminBookingNotificationTemplate(data: AdminBookingNotificationData): string {
  const e = escapeHtml;
  const {
    bookingId,
    customerName,
    email,
    phone,
    serviceLabel,
    formattedDate,
    formattedTime,
    addressLines,
    bedrooms,
    bathrooms,
    extrasLines,
    notes,
    cleaner,
    totalPrice,
    nextStepLines,
    receivedAtLabel,
  } = data;

  const addressHtml =
    addressLines.length > 0
      ? `<strong>${addressLines.map((line) => e(line)).join('<br/>')}</strong>`
      : '<strong>—</strong>';

  const telDigits = phone.replace(/[^\d+]/g, '') || phone.trim();

  let cleanerHtml = '';
  if (cleaner.kind === 'manual') {
    cleanerHtml = `<p style="margin:12px 0 0;color:#991b1b;font-size:14px;line-height:1.5;"><strong>Manual cleaner assignment required</strong><br/><span style="color:#7f1d1d;">Customer requested manual assignment. Please assign a cleaner for this booking.</span></p>`;
  } else if (cleaner.kind === 'assigned') {
    cleanerHtml = `<p style="margin:12px 0 0;color:#1e40af;font-size:14px;line-height:1.5;"><strong>Cleaner assigned</strong><br/><span style="color:#1e3a8a;">Cleaner ID: ${e(cleaner.id)}</span></p>`;
  } else {
    cleanerHtml = `<p style="margin:12px 0 0;color:#991b1b;font-size:14px;line-height:1.5;"><strong>No cleaner assigned yet</strong><br/><span style="color:#7f1d1d;">Please assign a cleaner to this booking.</span></p>`;
  }

  const extrasBlock =
    extrasLines.length > 0
      ? rowTwoCol(
          'Additional services',
          `<strong>${extrasLines.map((x) => e(x)).join(', ')}</strong>`,
        )
      : '';

  const notesBlock = notes
    ? rowTwoCol('Special instructions', `<strong>${e(notes)}</strong>`)
    : '';

  const nextStepsHtml = nextStepLines
    .map((line) => `<li style="margin:6px 0;">${e(line)}</li>`)
    .join('');

  const bodyHtml = `
        <p style="margin:0 0 18px;padding:12px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;color:#92400e;font-size:14px;line-height:1.5;">
          <strong>Action required</strong> — confirm the appointment and follow up with the customer.
        </p>

        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;font-weight:700;">
          Customer
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;border-bottom:1px solid #e5e7eb;padding-bottom:16px;">
          ${rowTwoCol('Name', `<strong>${e(customerName)}</strong>`)}
          ${rowTwoCol(
            'Email',
            `<strong><a href="mailto:${encodeURIComponent(email)}" style="color:${LINK};text-decoration:none;">${e(email)}</a></strong>`,
          )}
          ${rowTwoCol(
            'Phone',
            `<strong><a href="tel:${e(telDigits)}" style="color:${LINK};text-decoration:none;">${e(phone)}</a></strong>`,
          )}
        </table>

        <p style="margin:20px 0 8px;font-size:11px;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;font-weight:700;">
          Booking details
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
          ${rowTwoCol('Booking ID', `<strong>${e(bookingId)}</strong>`)}
          ${rowTwoCol('Service', `<strong>${e(serviceLabel)}</strong>`)}
          ${rowTwoCol('Date', `<strong>${e(formattedDate)}</strong>`)}
          ${rowTwoCol('Time', `<strong>${e(formattedTime)}</strong>`)}
          ${rowTwoCol('Address', addressHtml)}
          ${rowTwoCol('Bedrooms', `<strong>${e(String(bedrooms))}</strong>`)}
          ${rowTwoCol('Bathrooms', `<strong>${e(String(bathrooms))}</strong>`)}
          ${extrasBlock}
          ${notesBlock}
        </table>

        <p style="margin:20px 0 8px;font-size:11px;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;font-weight:700;">
          Cleaner assignment
        </p>
        ${cleanerHtml}

        <p style="margin:20px 0 8px;font-size:11px;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;font-weight:700;">
          Pricing
        </p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
          ${rowTwoCol('Total', `<strong>R ${totalPrice.toFixed(2)}</strong>`)}
          ${rowTwoCol('Customer will pay', `<strong>R ${totalPrice.toFixed(2)}</strong>`)}
        </table>

        <p style="margin:20px 0 8px;font-size:11px;letter-spacing:0.08em;color:#9ca3af;text-transform:uppercase;font-weight:700;">
          Next steps
        </p>
        <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;">
          ${nextStepsHtml}
        </ol>

        <p style="margin-top:24px;font-size:14px;">
          <a href="https://wa.me/27871535250" style="color:${LINK};text-decoration:none;font-weight:600;">
             Contact on WhatsApp
          </a>
        </p>

        <p style="margin-top:28px;font-size:12px;color:#9ca3af;line-height:1.6;">
          This is an automated notification from your Shalean Cleaning website.<br/>
          <span style="color:#d1d5db;">${e(receivedAtLabel)}</span>
        </p>
  `;

  return emailBrandedDocument({
    eyebrow: 'Shalean admin',
    title: 'New booking',
    subtitle: 'A new booking has been received and needs your attention.',
    bodyHtml,
  });
}
