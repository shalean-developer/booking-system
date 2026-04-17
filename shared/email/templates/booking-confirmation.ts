import { escapeHtml } from '../escape-html';
import type { BookingEmailData } from '../types';

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
  } = data;

  const e = escapeHtml;
  const isPaid = status === 'paid';
  /**
   * Prefer customer-facing Zoho invoice number (INV-...).
   * Safety: never render booking/order refs (e.g. SC19961999) as "Invoice".
   */
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

  const base = (siteBaseUrl || 'https://shalean.co.za').replace(/\/$/, '');
  const whenLine = [bookingDate, bookingTime].filter(Boolean).join(' · ');

  const token = manageToken?.trim();
  const rescheduleUrl = token ? `${base}/booking/reschedule?token=${encodeURIComponent(token)}` : '';
  const cancelUrl = token ? `${base}/booking/cancel?token=${encodeURIComponent(token)}` : '';
  const manageUrl = token ? `${base}/booking/manage?token=${encodeURIComponent(token)}` : '';
  const manageLinks =
    token
      ? `
        <div style="margin-top:32px;">
          <p style="font-size:14px;color:#666;margin:0 0 12px;">
            Need to make changes?
          </p>

          <a href="${e(rescheduleUrl)}"
             style="color:#4f46e5;text-decoration:none;font-weight:500;margin-right:16px;">
             Reschedule booking →
          </a>

          <a href="${e(cancelUrl)}"
             style="color:#dc2626;text-decoration:none;font-weight:500;">
             Cancel booking
          </a>

          <p style="margin-top:12px;font-size:13px;color:#888;">
            <a href="${e(manageUrl)}"
               style="color:#4f46e5;text-decoration:none;">Manage booking</a>
          </p>
        </div>
      `
      : '';

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial, sans-serif;color:#111;line-height:1.6;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px;">
    <tr>
      <td>

        <!-- HEADER -->
        <p style="letter-spacing:2px;font-size:12px;color:#888;margin:0 0 8px;">
          SHALEAN CLEANING
        </p>

        <h1 style="margin:0 0 16px;font-size:24px;">
          ${isPaid ? 'Booking confirmed' : 'Booking received'}
        </h1>

        <p style="margin:0 0 20px;color:#555;">
          ${
            isPaid
              ? 'Your booking is confirmed. Here are your details.'
              : 'We’ve received your booking. Please complete payment.'
          }
        </p>

        <!-- GREETING -->
        <p style="margin:0 0 16px;">
          Hi <strong>${e(customerName)}</strong>,
        </p>

        <!-- DETAILS -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
          
          <tr>
            <td style="padding:8px 0;color:#666;">Service</td>
            <td style="padding:8px 0;"><strong>${e(serviceName)}</strong></td>
          </tr>

          <tr>
            <td style="padding:8px 0;color:#666;">Booking ID</td>
            <td style="padding:8px 0;"><strong>#${e(bookingId)}</strong></td>
          </tr>

          ${
            whenLine
              ? `
          <tr>
            <td style="padding:8px 0;color:#666;">When</td>
            <td style="padding:8px 0;"><strong>${e(whenLine)}</strong></td>
          </tr>`
              : ''
          }

          ${
            address
              ? `
          <tr>
            <td style="padding:8px 0;color:#666;">Address</td>
            <td style="padding:8px 0;"><strong>${e(address)}</strong></td>
          </tr>`
              : ''
          }

          ${
            typeof amountZar === 'number' && Number.isFinite(amountZar)
              ? `
          <tr>
            <td style="padding:8px 0;color:#666;">Amount</td>
            <td style="padding:8px 0;"><strong>R ${amountZar.toFixed(2)}</strong></td>
          </tr>`
              : ''
          }

          ${
            invoiceDisplay
              ? `
          <tr>
            <td style="padding:8px 0;color:#666;">Invoice</td>
            <td style="padding:8px 0;"><strong>${e(invoiceDisplay)}</strong></td>
          </tr>`
              : ''
          }

        </table>

        <!-- CTA -->
        <p style="margin-top:24px;">
          <a href="https://wa.me/27871535250"
             style="color:#4f46e5;text-decoration:none;">
             Contact us on WhatsApp
          </a>
        </p>

        ${
          invoiceUrl
            ? `
        <p style="margin-top:16px;">
          Download your invoice:
          <a href="${e(invoiceUrl)}" style="color:#4f46e5;text-decoration:none;font-weight:500;">
            View Invoice
          </a>
        </p>`
            : ''
        }

        ${manageLinks}

        <!-- FOOTER -->
        <p style="margin-top:32px;font-size:12px;color:#888;">
          Shalean Cleaning Services
        </p>

      </td>
    </tr>
  </table>

</body>
</html>
`;
}
