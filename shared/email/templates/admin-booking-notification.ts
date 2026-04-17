import { escapeHtml } from '../escape-html';

/** Mirrors `booking-confirmation.ts` layout (table, Arial, same header rhythm). */
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
    <td style="padding:8px 0;color:#666;vertical-align:top;width:140px;">${e(label)}</td>
    <td style="padding:8px 0;">${valueHtml}</td>
  </tr>`;
}

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
    cleanerHtml = `<p style="margin:12px 0 0;color:#991b1b;font-size:14px;line-height:1.5;"><strong>⚠️ MANUAL CLEANER ASSIGNMENT REQUIRED</strong><br/><span style="color:#7f1d1d;">Customer requested manual assignment. Please assign a cleaner for this booking.</span></p>`;
  } else if (cleaner.kind === 'assigned') {
    cleanerHtml = `<p style="margin:12px 0 0;color:#1e40af;font-size:14px;line-height:1.5;"><strong>✅ Cleaner Assigned</strong><br/><span style="color:#1e3a8a;">Cleaner ID: ${e(cleaner.id)}</span></p>`;
  } else {
    cleanerHtml = `<p style="margin:12px 0 0;color:#991b1b;font-size:14px;line-height:1.5;"><strong>⚠️ No Cleaner Assigned Yet</strong><br/><span style="color:#7f1d1d;">Please assign a cleaner to this booking.</span></p>`;
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
    .map(
      (line) =>
        `<li style="margin:6px 0;">${e(line)}</li>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial, sans-serif;color:#111;line-height:1.6;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
    <tr>
      <td>

        <p style="letter-spacing:2px;font-size:12px;color:#888;margin:0 0 8px;">
          SHALEAN CLEANING
        </p>

        <h1 style="margin:0 0 16px;font-size:24px;">
          New booking (admin)
        </h1>

        <p style="margin:0 0 20px;color:#555;">
          A new booking has been received and needs your attention.
        </p>

        <p style="margin:0 0 20px;padding:12px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;color:#92400e;font-size:14px;">
          <strong>Action required</strong> — confirm the appointment and follow up with the customer.
        </p>

        <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.08em;color:#888;text-transform:uppercase;">
          Customer
        </p>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
          ${rowTwoCol('Name', `<strong>${e(customerName)}</strong>`)}
          ${rowTwoCol(
            'Email',
            `<strong><a href="mailto:${encodeURIComponent(email)}" style="color:#4f46e5;text-decoration:none;">${e(email)}</a></strong>`,
          )}
          ${rowTwoCol(
            'Phone',
            `<strong><a href="tel:${e(telDigits)}" style="color:#4f46e5;text-decoration:none;">${e(phone)}</a></strong>`,
          )}
        </table>

        <p style="margin:24px 0 8px;font-size:11px;letter-spacing:0.08em;color:#888;text-transform:uppercase;">
          Booking details
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
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

        <p style="margin:24px 0 8px;font-size:11px;letter-spacing:0.08em;color:#888;text-transform:uppercase;">
          Cleaner assignment
        </p>
        ${cleanerHtml}

        <p style="margin:24px 0 8px;font-size:11px;letter-spacing:0.08em;color:#888;text-transform:uppercase;">
          Pricing
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          ${rowTwoCol('Total', `<strong>R ${totalPrice.toFixed(2)}</strong>`)}
          ${rowTwoCol('Customer will pay', `<strong>R ${totalPrice.toFixed(2)}</strong>`)}
        </table>

        <p style="margin:24px 0 8px;font-size:11px;letter-spacing:0.08em;color:#888;text-transform:uppercase;">
          Next steps
        </p>
        <ol style="margin:0;padding-left:20px;color:#333;">
          ${nextStepsHtml}
        </ol>

        <p style="margin-top:24px;">
          <a href="https://wa.me/27871535250"
             style="color:#4f46e5;text-decoration:none;">
             Contact on WhatsApp
          </a>
        </p>

        <p style="margin-top:32px;font-size:12px;color:#888;line-height:1.6;">
          This is an automated notification from your Shalean Cleaning website.<br/>
          <span style="color:#aaa;">${e(receivedAtLabel)}</span>
        </p>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
