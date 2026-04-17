import type { BookingPaidRow } from '@/lib/payments/booking-types';
import { escapeHtml } from '@/shared/email/escape-html';
import { emailBrandedDocument } from '@/shared/email/templates/email-shell';

export type AdminBookingPaidTemplateParams = {
  booking: BookingPaidRow;
  amountZar: number;
  paymentReference: string;
  zohoInvoiceId: string | null;
  zohoInvoiceNumber: string | null;
  /** Browser link to Zoho Books invoice (may be null if org/id missing). */
  zohoBooksWebUrl: string | null;
  /** Public Supabase Storage URL for the PDF, if uploaded. */
  invoiceStorageUrl: string | null;
  /** Whether a PDF is attached to this email. */
  hasPdfAttachment: boolean;
};

function row(label: string, valueHtml: string): string {
  const e = escapeHtml;
  return `<tr>
    <td style="padding:10px 0;color:#6b7280;font-size:14px;vertical-align:top;width:42%;">${e(label)}</td>
    <td style="padding:10px 0;text-align:right;color:#111827;font-size:14px;font-weight:600;">${valueHtml}</td>
  </tr>`;
}

/**
 * Admin alert: paid booking — summary, pricing breakdown, Zoho + storage links, internal ids.
 */
export function adminBookingPaidTemplate(data: AdminBookingPaidTemplateParams): string {
  const e = escapeHtml;
  const b = data.booking;
  const snapshot = b.price_snapshot as
    | {
        service?: { bedrooms?: number; bathrooms?: number; numberOfCleaners?: number };
        extras?: string[];
        extras_quantities?: Record<string, number>;
      }
    | undefined;
  const bedrooms = snapshot?.service?.bedrooms ?? b.bedrooms;
  const bathrooms = snapshot?.service?.bathrooms ?? b.bathrooms;
  const cleaners = snapshot?.service?.numberOfCleaners;
  const extras = Array.isArray(snapshot?.extras) ? snapshot.extras : [];
  const extrasQuantities = snapshot?.extras_quantities || {};
  const extrasHtml = extras.length
    ? extras
        .map((name) => {
          const qty = Number(extrasQuantities[name] ?? 1);
          return `<li style="margin:4px 0;">${e(name)}${qty > 1 ? ` (×${qty})` : ''}</li>`;
        })
        .join('')
    : '<li style="margin:4px 0;">None</li>';

  const timeCell =
    e(b.booking_time || '—') + (b.expected_end_time ? ` – ${e(b.expected_end_time)}` : '');
  const cleanerText =
    b.cleaner_id === 'manual'
      ? 'Manual assignment requested'
      : b.cleaner_id || 'Not assigned yet';

  const displayId = /^SC\d{8}$/i.test(b.id) ? b.id : b.id.slice(-8);

  const pricingRows = [
    row('Service fee', `<strong>R ${((b.service_fee || 0) / 100).toFixed(2)}</strong>`),
    row('Tip', `<strong>R ${((b.tip_amount || 0) / 100).toFixed(2)}</strong>`),
    row('Frequency discount', `<strong>R ${((b.frequency_discount || 0) / 100).toFixed(2)}</strong>`),
    row(
      'Surge pricing',
      `<strong>${
        b.surge_pricing_applied === true
          ? `Yes (R ${((b.surge_amount || 0) / 100).toFixed(2)})`
          : 'No'
      }</strong>`,
    ),
    row('Total paid', `<strong style="font-weight:700;">R ${data.amountZar.toFixed(2)}</strong>`),
  ].join('');

  const invoiceRows: string[] = [];
  if (data.zohoInvoiceNumber?.trim()) {
    invoiceRows.push(row('Invoice #', `<strong>${e(data.zohoInvoiceNumber.trim())}</strong>`));
  }
  if (data.zohoInvoiceId?.trim()) {
    invoiceRows.push(
      row('Zoho invoice ID', `<strong style="font-size:12px;font-weight:600;">${e(data.zohoInvoiceId.trim())}</strong>`),
    );
  }
  if (data.zohoBooksWebUrl?.trim()) {
    const u = data.zohoBooksWebUrl.trim();
    invoiceRows.push(
      row(
        'Zoho Books',
        `<a href="${e(u)}" style="color:#0C53ED;font-weight:600;text-decoration:none;">Open invoice in Zoho</a>`,
      ),
    );
  }
  if (data.invoiceStorageUrl?.trim()) {
    const u = data.invoiceStorageUrl.trim();
    invoiceRows.push(
      row(
        'Invoice PDF (storage)',
        `<a href="${e(u)}" style="color:#0C53ED;font-weight:600;text-decoration:none;">Download PDF</a>`,
      ),
    );
  }
  invoiceRows.push(
    row(
      'PDF attached to this email',
      `<strong>${data.hasPdfAttachment ? 'Yes' : 'No'}</strong>`,
    ),
  );

  const notesBlock = b.notes?.trim()
    ? `<h2 style="margin:18px 0 10px 0;color:#111827;font-size:16px;font-weight:700;">Customer notes</h2>
       <p style="margin:0;color:#4b5563;font-size:14px;line-height:1.6;">${e(b.notes.trim())}</p>`
    : '';

  const noInvoiceBanner =
    !data.zohoInvoiceId && !data.zohoBooksWebUrl
      ? `<p style="margin:0 0 16px 0;padding:12px 14px;background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;font-size:14px;color:#92400e;">
           No Zoho invoice was created for this payment — check server logs and Zoho <code style="font-size:12px;">ZOHO_*</code> configuration.
         </p>`
      : '';

  const body = `
      ${noInvoiceBanner}
      <h2 style="margin:0 0 14px 0;color:#111827;font-size:16px;font-weight:700;">Booking summary</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
        ${row('Booking ref (customer)', `<strong>#${e(displayId)}</strong>`)}
        ${row('Internal booking ID', `<strong style="font-size:11px;font-weight:600;">${e(b.id)}</strong>`)}
        ${row('Customer', `<strong>${e(b.customer_name || '—')}</strong>`)}
        ${row('Email', `<strong>${e(b.customer_email || '—')}</strong>`)}
        ${row('Phone', `<strong>${e(b.customer_phone || '—')}</strong>`)}
        ${row('Service', `<strong>${e(b.service_type || '—')}</strong>`)}
        ${row('Date', `<strong>${e(b.booking_date || '—')}</strong>`)}
        ${row('Time', `<strong>${timeCell}</strong>`)}
        ${row('Address', `<strong>${e([b.address_line1, b.address_suburb, b.address_city].filter(Boolean).join(', ') || '—')}</strong>`)}
        ${row('Frequency', `<strong>${e(b.frequency || 'one-time')}</strong>`)}
        ${row('Cleaner', `<strong>${e(cleanerText)}</strong>`)}
        ${row('Payment reference', `<strong>${e(data.paymentReference)}</strong>`)}
      </table>

      <h2 style="margin:22px 0 12px 0;color:#111827;font-size:16px;font-weight:700;">Pricing breakdown</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
        ${pricingRows}
      </table>

      <h2 style="margin:18px 0 10px 0;color:#111827;font-size:16px;font-weight:700;">Service details</h2>
      <p style="margin:0 0 8px 0;color:#4b5563;font-size:14px;">
        Bedrooms: <strong>${bedrooms ?? 'N/A'}</strong> &nbsp;|&nbsp; Bathrooms: <strong>${bathrooms ?? 'N/A'}</strong> &nbsp;|&nbsp; Cleaners: <strong>${cleaners ?? '—'}</strong>
      </p>
      <p style="margin:0;color:#4b5563;font-size:14px;">Extras:</p>
      <ul style="margin:8px 0 0 18px;padding:0;color:#111827;font-size:14px;">${extrasHtml}</ul>
      ${notesBlock}

      <h2 style="margin:22px 0 12px 0;color:#111827;font-size:16px;font-weight:700;">Invoice &amp; accounting</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
        ${invoiceRows.join('')}
      </table>

      <h2 style="margin:22px 0 10px 0;color:#111827;font-size:16px;font-weight:700;">Internal</h2>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
        Use the full booking UUID in admin and Supabase. Payment was recorded against this booking row.
      </p>
  `;

  return emailBrandedDocument({
    eyebrow: 'Shalean admin',
    title: 'Booking paid',
    subtitle: 'Payment confirmed — review details and Zoho invoice below.',
    bodyHtml: body,
  });
}
