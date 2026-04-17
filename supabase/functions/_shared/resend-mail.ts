import { formatBookingDateDisplay, formatBookingTimeDisplay } from '../../../shared/email/datetime.ts';
import type { BookingEmailData } from '../../../shared/email/types.ts';
import { resolveAdminNotificationEmail } from './admin-email.ts';
import { resendSendEmail, sendBookingEmailDeno } from './send-email.ts';

function supportWhatsAppUrlWithTextEdge(prefill: string): string {
  const e164 =
    (Deno.env.get('NEXT_PUBLIC_SUPPORT_WHATSAPP_E164') || '27825915525').replace(/\D/g, '') ||
    '27825915525';
  return `https://wa.me/${e164}?text=${encodeURIComponent(prefill)}`;
}

function normalizePublicSiteBase(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, '');
  let t = trimmed.replace(/^https?:\/\/shalean\.com(?=\/|$)/i, 'https://shalean.co.za');
  if (t.length > 0 && !/^https?:\/\//i.test(t)) {
    t = `https://${t.replace(/^\/+/, '')}`;
  }
  return t;
}

export async function sendBookingPaidEmail(params: {
  to: string;
  customerName: string;
  serviceName: string;
  amountZar: number;
  bookingId: string;
  zohoInvoiceId: string | null;
  paymentReference?: string | null;
  bookingDate?: string | null;
  bookingTime?: string | null;
  addressLine1?: string | null;
  addressSuburb?: string | null;
  addressCity?: string | null;
  equipment_required?: boolean;
  equipment_fee?: number;
  manageToken?: string | null;
  invoiceUrl?: string | null;
  invoicePdf?: Uint8Array | null;
  /** Same # as on the Zoho PDF (e.g. INV-00001), not the internal invoice_id. */
  zohoInvoiceNumber?: string | null;
}): Promise<{ ok: boolean; providerId?: string; error?: string }> {
  const displayId = /^SC\d{8}$/.test(params.bookingId) ? params.bookingId : params.bookingId.slice(-8);
  const address =
    [params.addressLine1, params.addressSuburb, params.addressCity].filter(Boolean).join(', ') ||
    undefined;

  const siteUrl =
    normalizePublicSiteBase(Deno.env.get('NEXT_PUBLIC_SITE_URL') || '') ||
    'https://shalean.co.za';

  const equipmentFeeZar =
    typeof params.equipment_fee === 'number' && Number.isFinite(params.equipment_fee)
      ? params.equipment_fee
      : 0;

  const emailData: BookingEmailData = {
    customerName: params.customerName,
    serviceName: params.serviceName,
    bookingId: displayId,
    amountZar: params.amountZar,
    status: 'paid',
    invoiceId: params.zohoInvoiceId ?? undefined,
    invoiceNumber: params.zohoInvoiceNumber?.trim() || undefined,
    bookingDate: params.bookingDate ? formatBookingDateDisplay(params.bookingDate) : undefined,
    bookingTime: params.bookingTime ? formatBookingTimeDisplay(params.bookingTime) : undefined,
    address,
    paymentReference: params.paymentReference ?? undefined,
    equipmentRequired: params.equipment_required === true,
    equipmentFeeZar,
    cleanerSummary: 'We will assign a cleaner and notify you shortly.',
    manageBookingUrl: `${siteUrl}/dashboard`,
    trackingUrl: `${siteUrl}/dashboard`,
    siteBaseUrl: siteUrl,
    manageToken: params.manageToken ?? undefined,
    invoiceUrl: params.invoiceUrl?.trim() || undefined,
    whatsappUrl: supportWhatsAppUrlWithTextEdge(`Hi Shalean, regarding booking #${displayId}`),
  };

  const pdf = params.invoicePdf;
  return sendBookingEmailDeno(params.to, emailData, {
    invoicePdf: pdf && pdf.byteLength > 0 ? pdf : undefined,
    invoiceAttachmentFilename:
      pdf && pdf.byteLength > 0 ? `Invoice-${displayId}.pdf` : undefined,
  });
}

export async function sendAdminNewBookingEmail(params: {
  bookingId: string;
  customerName: string;
  serviceName: string;
  amountZar: number;
}): Promise<void> {
  const admin = resolveAdminNotificationEmail();

  const apiKey = Deno.env.get('RESEND_API_KEY')?.trim();
  if (!apiKey) return;

  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const r = await resendSendEmail({
    to: admin,
    subject: `[New paid booking] ${params.bookingId}`,
    html: `<p><strong>${escape(params.customerName)}</strong> paid R ${params.amountZar.toFixed(
      2,
    )} for ${escape(params.serviceName)} — ${escape(params.bookingId)}</p>`,
  });
  if (!r.ok) {
    console.warn('[sendAdminNewBookingEmail]', r.error);
  }
}
