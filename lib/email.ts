import { BookingState, ServiceType } from '@/types/booking';
import { calcTotalSync } from '@/lib/pricing';
import { fetchActivePricing } from '@/lib/pricing-db';
import { Resend } from 'resend';

/**
 * Send via Resend HTTP API (POST only). Do not use resend.emails.get() or GET /emails/:id
 * with non-UUID ids — that caused 422 "id must be a valid UUID" (e.g. /emails/0).
 */
async function postResendEmail(params: {
  from: string;
  to: string[];
  subject: string;
  html: string;
}): Promise<{ id?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
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
  try {
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
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

const resendClient = new Resend(process.env.RESEND_API_KEY);

export async function sendInvoiceEmail(email: string) {
  console.log('📧 EMAIL FUNCTION STARTED');
  console.log('📧 Sending to:', email);
  console.log('📧 API KEY EXISTS:', !!process.env.RESEND_API_KEY?.trim());

  const from = process.env.SENDER_EMAIL?.trim() || 'onboarding@resend.dev';

  const { data, error } = await resendClient.emails.send({
    from,
    to: email,
    subject: 'Booking Confirmed',
    html: '<p>Test email</p>',
  });

  console.log('📧 RESPONSE:', data);

  if (error) {
    console.error('❌ RESEND ERROR:', error);
    throw error;
  }

  console.log('✅ EMAIL SENT SUCCESSFULLY');
  return { id: data?.id };
}

export interface CarpetDetails {
  hasFittedCarpets: boolean;
  hasLooseCarpets: boolean;
  numberOfRooms: number;
  numberOfLooseCarpets: number;
  roomStatus: 'empty' | 'hasProperty';
}

export interface QuoteRequest {
  service: ServiceType | string;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  notes?: string;
  quoteId?: string; // Optional since it's generated on the server
  carpetDetails?: CarpetDetails; // Optional, only for Carpet service
}

// Helper function to generate calendar links
function generateCalendarLinks(booking: {
  date: string | null;
  time: string | null;
  service: ServiceType | null;
  address: { line1: string; suburb: string; city: string };
  bookingId: string;
}) {
  if (!booking.date || !booking.time) return null;

  const bookingDate = new Date(booking.date);
  const [hours, minutes] = booking.time.split(':').map(Number);
  bookingDate.setHours(hours, minutes, 0, 0);
  
  // End time is 3 hours after start (typical cleaning duration)
  const endDate = new Date(bookingDate);
  endDate.setHours(endDate.getHours() + 3);

  // Format dates for calendar (YYYYMMDDTHHmmss)
  const formatCalendarDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const startDateStr = formatCalendarDate(bookingDate);
  const endDateStr = formatCalendarDate(endDate);

  const title = encodeURIComponent(`Cleaning Service - ${booking.service || 'Shalean Cleaning'}`);
  const description = encodeURIComponent(
    `Booking ID: ${booking.bookingId}\n` +
    `Service: ${booking.service || 'Cleaning Service'}\n` +
    `Address: ${booking.address.line1}, ${booking.address.suburb}, ${booking.address.city}`
  );
  const location = encodeURIComponent(
    `${booking.address.line1}, ${booking.address.suburb}, ${booking.address.city}`
  );

  // Generate iCal content
  const icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Shalean Cleaning//Booking Calendar//EN',
    'BEGIN:VEVENT',
    `DTSTART:${startDateStr}`,
    `DTEND:${endDateStr}`,
    `SUMMARY:${decodeURIComponent(title)}`,
    `DESCRIPTION:${decodeURIComponent(description)}`,
    `LOCATION:${decodeURIComponent(location)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  // For iCal, use a data URI that's properly formatted
  const icalDataUri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icalContent)}`;

  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateStr}/${endDateStr}&details=${description}&location=${location}`,
    outlook: `https://outlook.live.com/calendar/0/deeplink/compose?subject=${title}&startdt=${bookingDate.toISOString()}&enddt=${endDate.toISOString()}&body=${description}&location=${location}`,
    ical: icalDataUri
  };
}

// Helper function to calculate next booking dates for recurring bookings
function calculateNextBookingDates(startDate: string, frequency: 'one-time' | 'weekly' | 'bi-weekly' | 'monthly', count: number = 3): string[] {
  if (frequency === 'one-time') return [];
  
  const dates: string[] = [];
  const start = new Date(startDate);
  
  for (let i = 1; i <= count; i++) {
    const nextDate = new Date(start);
    
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(start.getDate() + (7 * i));
        break;
      case 'bi-weekly':
        nextDate.setDate(start.getDate() + (14 * i));
        break;
      case 'monthly':
        nextDate.setMonth(start.getMonth() + i);
        break;
    }
    
    dates.push(nextDate.toISOString().split('T')[0]);
  }
  
  return dates;
}

export async function generateBookingConfirmationEmail(
  booking: BookingState & { bookingId: string; totalAmount?: number; cleanerName?: string }
): Promise<EmailData> {
  // Use the actual totalAmount if provided (from database), otherwise recalculate
  // totalAmount from database is in cents, so divide by 100 to get rands
  let totalPrice: number;
  if (booking.totalAmount !== undefined && booking.totalAmount > 0) {
    // If totalAmount is > 1000, it's likely in cents (e.g., 150000 = R1500.00)
    // Otherwise it might already be in rands
    totalPrice = booking.totalAmount > 1000 ? booking.totalAmount / 100 : booking.totalAmount;
  } else {
    const pricingData = await fetchActivePricing();
    const pricingDetails = calcTotalSync(
      {
        service: booking.service,
        bedrooms: booking.bedrooms || 0,
        bathrooms: booking.bathrooms || 0,
        extras: booking.extras || [],
        extrasQuantities: booking.extrasQuantities,
      },
      booking.frequency || 'one-time',
      pricingData
    );
    totalPrice = pricingDetails.total;
  }

  // Generate calendar links
  const calendarLinks = generateCalendarLinks(booking);
  
  // Calculate next booking dates for recurring bookings
  const nextBookingDates = booking.date && booking.frequency && booking.frequency !== 'one-time'
    ? calculateNextBookingDates(booking.date, booking.frequency)
    : [];

  // Format date and time
  const formattedDate = booking.date 
    ? new Date(booking.date).toLocaleDateString('en-ZA', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Not specified';
  
  const formattedTime = booking.time 
    ? new Date(`2000-01-01T${booking.time}`).toLocaleTimeString('en-ZA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    : 'Not specified';

  // Frequency display text
  const frequencyText = booking.frequency === 'one-time' 
    ? 'One-time booking'
    : booking.frequency === 'weekly'
    ? 'Weekly (every week)'
    : booking.frequency === 'bi-weekly'
    ? 'Bi-weekly (every 2 weeks)'
    : booking.frequency === 'monthly'
    ? 'Monthly (every month)'
    : 'One-time booking';

  // Dashboard URL
  const dashboardUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shalean.co.za';
  const bookingDashboardUrl = `${dashboardUrl}/dashboard`;

  // Site URL for calendar links
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://shalean.co.za';
  
  // Show full ID for SC format (SC + 8 digits), otherwise last 8 for legacy
  const displayBookingId = /^SC\d{8}$/.test(booking.bookingId)
    ? booking.bookingId
    : booking.bookingId.slice(-8);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - Shalean Cleaning</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #111827;
          background-color: #f0f2f5;
          padding: 20px;
          -webkit-font-smoothing: antialiased;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          border: 1px solid #f3f4f6;
        }
        /* Matches booking flow header: white bar, brand kicker, title */
        .header {
          background-color: #ffffff;
          color: #111827;
          padding: 24px 28px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        .header-brand {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #9ca3af;
          margin-bottom: 14px;
        }
        .header-main {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .header-icon-circle {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background-color: #22c55e;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          box-shadow: 0 4px 14px rgba(34, 197, 94, 0.35);
        }
        .header-text-wrap { min-width: 0; }
        .header h1 {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 6px;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .header p {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.5;
        }
        .status-banner {
          background-color: #f5f3ff;
          padding: 14px 28px;
          border-bottom: 1px solid #ede9fe;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .status-banner-content {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6d28d9;
          font-weight: 600;
          font-size: 14px;
        }
        .status-badge {
          font-size: 10px;
          color: #6d28d9;
          background-color: #ffffff;
          padding: 5px 10px;
          border-radius: 9999px;
          border: 1px solid #ddd6fe;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }
        .content {
          padding: 28px;
        }
        .greeting {
          margin-bottom: 28px;
        }
        .greeting h2 {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        .greeting p {
          color: #6b7280;
          line-height: 1.65;
          font-size: 14px;
        }
        .booking-summary-card {
          background-color: #ffffff;
          border-radius: 16px;
          padding: 22px;
          margin-bottom: 24px;
          border: 1px solid #f3f4f6;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .section-header-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }
        .section-icon-box {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background-color: #7c3aed;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .section-heading {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 600;
          margin-bottom: 4px;
          display: block;
        }
        .info-value {
          color: #111827;
          font-weight: 600;
          font-size: 14px;
        }
        .info-value-with-icon {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #111827;
          font-weight: 600;
          font-size: 14px;
        }
        .icon {
          width: 16px;
          height: 16px;
          color: #9ca3af;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          margin-bottom: 32px;
        }
        .service-details {
          flex: 1;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .address-text {
          color: #111827;
          line-height: 1.6;
          margin-top: 4px;
          font-size: 14px;
        }
        .details-row {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }
        .details-item {
          flex: 1;
        }
        .addon-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .addon-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          background-color: #f5f3ff;
          color: #6d28d9;
          border: 1px solid #ddd6fe;
        }
        .cleaner-assignment-card {
          background-color: #fffbeb;
          border-radius: 16px;
          padding: 20px;
          border: 1px solid #fde68a;
          height: fit-content;
        }
        .cleaner-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .cleaner-header .section-icon-box-amber {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background-color: #f59e0b;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .cleaner-header-title {
          font-size: 16px;
          font-weight: 700;
          color: #92400e;
          letter-spacing: -0.02em;
        }
        .cleaner-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .cleaner-icon {
          background-color: #fde68a;
          padding: 8px;
          border-radius: 8px;
          color: #78350f;
          margin-top: 4px;
        }
        .cleaner-text {
          flex: 1;
        }
        .cleaner-title {
          font-weight: 700;
          color: #78350f;
          font-size: 14px;
        }
        .cleaner-description {
          color: #92400e;
          font-size: 12px;
          line-height: 1.75;
          margin-top: 4px;
        }
        .payment-section {
          border-top: 1px solid #f3f4f6;
          padding-top: 28px;
          margin-bottom: 28px;
        }
        .payment-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 16px;
        }
        .payment-header .section-header-row {
          margin-bottom: 0;
        }
        .total-amount {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.02em;
        }
        .payment-info {
          background-color: #fafafa;
          border-radius: 12px;
          padding: 16px;
          font-size: 13px;
          color: #6b7280;
          border: 1px solid #f3f4f6;
        }
        .payment-reference {
          margin-bottom: 4px;
        }
        .payment-ref-value {
          font-family: ui-monospace, monospace;
          color: #374151;
          font-weight: 600;
        }
        .payment-status {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6d28d9;
          font-weight: 600;
          margin-top: 6px;
          font-size: 13px;
        }
        .actions-section {
          margin-bottom: 28px;
        }
        .action-button {
          width: 100%;
          background-color: #7c3aed;
          color: #ffffff;
          font-weight: 700;
          padding: 14px 18px;
          border-radius: 12px;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
          font-size: 15px;
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);
        }
        .action-button:hover {
          background-color: #6d28d9;
        }
        .calendar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          font-size: 14px;
        }
        .calendar-label {
          color: #64748b;
          font-weight: 500;
        }
        .calendar-links {
          display: flex;
          gap: 16px;
        }
        .calendar-link {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #7c3aed;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }
        .calendar-link:hover {
          text-decoration: underline;
          color: #6d28d9;
        }
        .help-section {
          background-color: #ffffff;
          border-radius: 16px;
          padding: 22px;
          border: 1px solid #f3f4f6;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .help-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .help-header .section-icon-box {
          background-color: #7c3aed;
        }
        .help-heading-text {
          font-size: 16px;
          font-weight: 700;
          color: #111827;
        }
        .help-text {
          font-size: 14px;
          color: #6b7280;
          line-height: 1.65;
          margin-bottom: 16px;
        }
        .contact-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .contact-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 14px;
          background-color: #fafafa;
          border: 1px solid #f3f4f6;
          border-radius: 12px;
          text-decoration: none;
          transition: border-color 0.2s;
        }
        .contact-card:hover {
          border-color: #ddd6fe;
        }
        .contact-icon {
          background-color: #f5f3ff;
          padding: 8px;
          border-radius: 12px;
          color: #7c3aed;
          font-size: 16px;
        }
        .contact-info {
          flex: 1;
        }
        .contact-label {
          font-size: 11px;
          color: #9ca3af;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .contact-value {
          font-size: 14px;
          color: #111827;
          font-weight: 600;
        }
        .footer {
          background-color: #fafafa;
          padding: 28px;
          text-align: center;
          color: #374151;
          border-top: 1px solid #f3f4f6;
        }
        .footer-brand {
          font-weight: 700;
          font-size: 17px;
          margin-bottom: 8px;
          color: #111827;
        }
        .footer-text {
          color: #6b7280;
          font-size: 13px;
          line-height: 1.65;
          margin-bottom: 20px;
        }
        .footer-links {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .footer-link {
          color: #7c3aed;
          text-decoration: none;
        }
        .footer-link:hover {
          color: #6d28d9;
          text-decoration: underline;
        }
        .footer-separator {
          color: #d1d5db;
        }
        .footer-footer {
          padding-top: 20px;
          border-top: 1px solid #f3f4f6;
        }
        .footer-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 12px;
          margin-bottom: 8px;
        }
        .footer-booking-id {
          color: #6b7280;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 700;
        }
        .mobile-tip {
          max-width: 600px;
          margin: 20px auto 0;
          padding: 0 16px;
          text-align: center;
        }
        .mobile-tip-content {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 12px;
        }
        @media only screen and (max-width: 600px) {
          body {
            padding: 10px;
          }
          .header {
            padding: 20px 18px;
          }
          .header h1 {
            font-size: 20px;
          }
          .header p {
            font-size: 13px;
          }
          .header-main {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .header-text-wrap {
            text-align: center;
          }
          .status-banner {
            padding: 12px 18px;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .content {
            padding: 22px 18px;
          }
          .info-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .details-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .contact-grid {
            grid-template-columns: 1fr;
          }
          .calendar-links {
            flex-direction: column;
            gap: 8px;
          }
          .payment-header {
            flex-direction: column;
            align-items: flex-start;
          }
          .total-amount {
            align-self: flex-end;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header — matches booking flow (step 4) -->
        <div class="header">
          <p class="header-brand">Shalean Cleaning Services</p>
          <div class="header-main">
            <div class="header-icon-circle" aria-hidden="true">✓</div>
            <div class="header-text-wrap">
              <h1>Booking confirmed</h1>
              <p>Thank you for choosing us — your clean is on the calendar.</p>
            </div>
          </div>
        </div>

        <!-- Status Banner -->
        ${booking.paymentReference ? `
        <div class="status-banner">
          <div class="status-banner-content">
            <span>💳</span>
            <span>Payment Confirmed</span>
          </div>
          <span class="status-badge">Paid</span>
        </div>
        ` : ''}

        <!-- Content Body -->
        <div class="content">
          <div class="greeting">
            <h2>Hi ${booking.firstName} ${booking.lastName},</h2>
            <p>Your cleaning service has been successfully booked! We're excited to help you get your space sparkling clean. Here are all the details for your upcoming service:</p>
          </div>

          <!-- Booking Summary Card -->
          <div class="booking-summary-card">
            <div class="section-header-row">
              <div class="section-icon-box" aria-hidden="true">📅</div>
              <div class="section-heading">Booking summary</div>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Booking ID</span>
                <span class="info-value">${displayBookingId}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Service Type</span>
                <span class="info-value">${booking.service || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Date</span>
                <div class="info-value-with-icon">
                  <span>📅</span>
                  <span>${formattedDate}</span>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Time</span>
                <div class="info-value-with-icon">
                  <span>🕐</span>
                  <span>${formattedTime}</span>
                </div>
              </div>
              <div class="info-item full-width">
                <span class="info-label">Frequency</span>
                <span class="info-value">${frequencyText}</span>
              </div>
            </div>
          </div>

          <div class="details-grid">
            <!-- Service Details -->
            <div class="service-details">
              <div class="section-title">
                <div class="section-icon-box" aria-hidden="true">📍</div>
                <div class="section-heading">Service details</div>
              </div>
              <div>
                <span class="info-label">Address</span>
                <div class="address-text">
                  ${booking.address.line1}<br>
                  ${booking.address.suburb}<br>
                  ${booking.address.city}
                </div>
              </div>
              <div class="details-row">
                <div class="details-item">
                  <span class="info-label">Bedrooms</span>
                  <div class="info-value">${booking.bedrooms}</div>
                </div>
                <div class="details-item">
                  <span class="info-label">Bathrooms</span>
                  <div class="info-value">${booking.bathrooms}</div>
                </div>
              </div>
              ${booking.extras.length > 0 ? `
              <div style="margin-top: 16px;">
                <span class="info-label">Additional Services</span>
                <div class="addon-badges">
                  ${booking.extras.map(extra => `
                    <span class="addon-badge">
                      ${extra === 'Inside Fridge' ? '❄️' : ''}
                      ${extra === 'Inside Oven' ? '🔥' : ''}
                      ${extra}
                    </span>
                  `).join('')}
                </div>
              </div>
              ` : ''}
            </div>

            <!-- Cleaner Assignment -->
            <div class="cleaner-assignment-card">
              <div class="cleaner-header">
                <div class="section-icon-box-amber" aria-hidden="true">👤</div>
                <div class="cleaner-header-title">Cleaner assignment</div>
              </div>
              ${booking.cleanerName ? `
              <div class="cleaner-content">
                <div class="cleaner-icon">✓</div>
                <div class="cleaner-text">
                  <div class="cleaner-title">${booking.cleanerName}</div>
                  <div class="cleaner-description">Professional cleaner assigned to your booking</div>
                </div>
              </div>
              ` : booking.cleaner_id === 'manual' ? `
              <div class="cleaner-content">
                <div class="cleaner-icon">⚠️</div>
                <div class="cleaner-text">
                  <div class="cleaner-title">Manual Assignment Requested</div>
                  <div class="cleaner-description">Our team will assign the best available cleaner for you and contact you within 24 hours to confirm.</div>
                </div>
              </div>
              ` : `
              <div class="cleaner-content">
                <div class="cleaner-icon">🕐</div>
                <div class="cleaner-text">
                  <div class="cleaner-title">Assignment Pending</div>
                  <div class="cleaner-description">A cleaner will be assigned to your booking shortly. You will receive a notification once confirmed.</div>
                </div>
              </div>
              `}
            </div>
          </div>

          <!-- Payment Summary -->
          <div class="payment-section">
            <div class="payment-header">
              <div class="section-header-row">
                <div class="section-icon-box" aria-hidden="true">💳</div>
                <div class="section-heading">Payment summary</div>
              </div>
              <p class="total-amount">R${totalPrice.toFixed(2)}</p>
            </div>
            <div class="payment-info">
              ${booking.paymentReference ? `
              <p class="payment-reference">Payment Reference: <span class="payment-ref-value">${booking.paymentReference}</span></p>
              <div class="payment-status">
                <span>✓</span>
                <span>Payment Confirmed</span>
              </div>
              ` : `
              <div class="payment-status" style="color: #f59e0b;">
                Payment Pending
              </div>
              `}
            </div>
          </div>

          <!-- Actions -->
          <div class="actions-section">
            <a href="${bookingDashboardUrl}" class="action-button">
              <span>🔗</span>
              <span>View Booking in Dashboard</span>
            </a>
            
            ${calendarLinks ? `
            <div class="calendar-section">
              <span class="calendar-label">Add to Calendar:</span>
              <div class="calendar-links">
                <a href="${calendarLinks.google}" class="calendar-link">📅 Google</a>
                <a href="${calendarLinks.outlook}" class="calendar-link">📧 Outlook</a>
                <a href="${calendarLinks.ical}" class="calendar-link">📅 iCal</a>
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Help Section -->
          <div class="help-section">
            <div class="help-header">
              <div class="section-icon-box" aria-hidden="true">❓</div>
              <div class="help-heading-text">Need help?</div>
            </div>
            <p class="help-text">If you have any questions or need to make changes to your booking, please contact us:</p>
            <div class="contact-grid">
              <a href="tel:+27871535250" class="contact-card">
                <div class="contact-icon">📞</div>
                <div class="contact-info">
                  <div class="contact-label">Call Us</div>
                  <div class="contact-value">+27 87 153 5250</div>
                </div>
              </a>
              <a href="mailto:bookings@shalean.com" class="contact-card">
                <div class="contact-icon">✉️</div>
                <div class="contact-info">
                  <div class="contact-label">Email Us</div>
                  <div class="contact-value">bookings@shalean.com</div>
                </div>
              </a>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-brand">Shalean Cleaning Services</div>
          <p class="footer-text">Thank you for choosing us for your cleaning needs!<br>We pride ourselves on reliability and excellence.</p>
          <div class="footer-links">
            <a href="${siteUrl}" class="footer-link">Visit our website</a>
            <span class="footer-separator">|</span>
            <a href="${siteUrl}/dashboard" class="footer-link">My Dashboard</a>
          </div>
          <div class="footer-footer">
            <div class="footer-info">
              <span>ℹ️</span>
              <span>This is an automated email. Please do not reply to this message.</span>
            </div>
            <p class="footer-booking-id">Booking ID: ${displayBookingId}</p>
          </div>
        </div>
      </div>

      <!-- Responsive Tip for Mobile App Viewers -->
      <div class="mobile-tip">
        <div class="mobile-tip-content">
          <span>📱</span>
          <span>Optimized for all devices</span>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: booking.email,
    subject: `Booking Confirmation - ${displayBookingId} | Shalean Cleaning`,
    html,
  };
}

export async function generateAdminBookingNotificationEmail(
  booking: BookingState & { bookingId: string; totalAmount?: number }
): Promise<EmailData> {
  // Use the actual totalAmount if provided (from database), otherwise recalculate
  // totalAmount is in rands (not cents)
  let totalPrice: number;
  if (booking.totalAmount !== undefined && booking.totalAmount > 0) {
    totalPrice = booking.totalAmount;
  } else {
    const pricingData = await fetchActivePricing();
    const pricingDetails = calcTotalSync(
      {
        service: booking.service,
        bedrooms: booking.bedrooms || 0,
        bathrooms: booking.bathrooms || 0,
        extras: booking.extras || [],
        extrasQuantities: booking.extrasQuantities,
      },
      booking.frequency || 'one-time',
      pricingData
    );
    totalPrice = pricingDetails.total;
  }
  
  // Format date and time for admin email
  const formattedDate = booking.date 
    ? new Date(booking.date).toLocaleDateString('en-ZA', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : 'Not specified';
  
  const formattedTime = booking.time 
    ? new Date(`2000-01-01T${booking.time}`).toLocaleTimeString('en-ZA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    : 'Not specified';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Booking Received - Shalean Cleaning</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.6; 
          color: #1e293b; 
          background-color: #f1f5f9;
          padding: 20px;
        }
        .email-container {
          max-width: 672px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .header {
          background-color: #0C53ED;
          color: white;
          padding: 32px;
          text-align: center;
        }
        .header-icon-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 16px;
        }
        .header-icon-circle {
          background-color: rgba(255, 255, 255, 0.2);
          padding: 12px;
          border-radius: 50%;
          backdrop-filter: blur(4px);
        }
        .header-icon {
          width: 48px;
          height: 48px;
          color: white;
        }
        .header h1 {
          font-size: 30px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .header p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 18px;
        }
        .status-banner {
          background-color: #fee2e2;
          padding: 16px 32px;
          border-bottom: 1px solid #fecaca;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .status-banner-content {
          color: #991b1b;
          font-weight: 700;
          text-align: center;
        }
        .content {
          padding: 32px;
        }
        .greeting {
          margin-bottom: 32px;
        }
        .greeting p {
          color: #475569;
          line-height: 1.75;
        }
        .booking-summary-card {
          background-color: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid #e2e8f0;
        }
        .section-header {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0C53ED;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 14px;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 4px;
          display: block;
        }
        .info-value {
          color: #0f172a;
          font-weight: 500;
          font-family: monospace;
        }
        .info-value-with-icon {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0f172a;
          font-weight: 500;
        }
        .full-width {
          grid-column: 1 / -1;
        }
        .contact-card {
          background-color: #fef3c7;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid #fde68a;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #0C53ED;
          font-weight: 700;
          text-transform: uppercase;
          font-size: 14px;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }
        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          margin-bottom: 32px;
        }
        .service-details {
          flex: 1;
        }
        .address-text {
          color: #0f172a;
          line-height: 1.6;
          margin-top: 4px;
        }
        .details-row {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }
        .details-item {
          flex: 1;
        }
        .addon-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .addon-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
          background-color: #dbeafe;
          color: #1e40af;
          border: 1px solid #93c5fd;
        }
        .cleaner-assignment-card {
          background-color: #fee2e2;
          border-radius: 12px;
          padding: 20px;
          border: 1px solid #fecaca;
          border-left: 4px solid #ef4444;
        }
        .cleaner-assignment-card.assigned {
          background-color: #dbeafe;
          border: 1px solid #bfdbfe;
          border-left: 4px solid #0C53ED;
        }
        .payment-section {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          border: 2px solid #0C53ED;
        }
        .payment-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .total-amount {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
        }
        .next-steps {
          background-color: #fef3c7;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid #fde68a;
          border-left: 4px solid #f59e0b;
        }
        .next-steps-title {
          font-weight: 700;
          color: #92400e;
          margin-bottom: 12px;
        }
        .next-steps-list {
          list-style: none;
          padding: 0;
        }
        .next-steps-list li {
          padding: 6px 0;
          color: #78350f;
        }
        .footer {
          background-color: #0f172a;
          padding: 32px;
          text-align: center;
          color: white;
        }
        .footer-text {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.75;
          margin-bottom: 8px;
        }
        .footer-timestamp {
          color: #64748b;
          font-size: 12px;
        }
        @media only screen and (max-width: 600px) {
          body {
            padding: 10px;
          }
          .header {
            padding: 24px 16px;
          }
          .header h1 {
            font-size: 24px;
          }
          .header p {
            font-size: 16px;
          }
          .status-banner {
            padding: 12px 16px;
          }
          .content {
            padding: 24px 16px;
          }
          .info-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .details-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header Section -->
        <div class="header">
          <div class="header-icon-wrapper">
            <div class="header-icon-circle">
              <div class="header-icon">🔔</div>
            </div>
          </div>
          <h1>New Booking Received!</h1>
          <p>Shalean Cleaning Services - Admin Notification</p>
        </div>

        <!-- Status Banner -->
        <div class="status-banner">
          <div class="status-banner-content">
            <strong>⚠️ ACTION REQUIRED</strong> - New booking needs confirmation
          </div>
        </div>

        <!-- Content Body -->
        <div class="content">
          <div class="greeting">
            <p>A new cleaning service has been booked and requires your attention.</p>
          </div>

          <!-- Customer Contact Card -->
          <div class="contact-card">
            <div class="section-title">
              <span>👤</span>
              <span>Customer Contact Information</span>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Name</span>
                <span class="info-value">${booking.firstName} ${booking.lastName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value"><a href="mailto:${booking.email}" style="color: #0C53ED;">${booking.email}</a></span>
              </div>
              <div class="info-item full-width">
                <span class="info-label">Phone</span>
                <span class="info-value"><a href="tel:${booking.phone}" style="color: #0C53ED;">${booking.phone}</a></span>
              </div>
            </div>
          </div>

          <!-- Booking Summary Card -->
          <div class="booking-summary-card">
            <div class="section-header">
              <span>📋</span>
              <span>Booking Details</span>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Booking ID</span>
                <span class="info-value">${booking.bookingId}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Service Type</span>
                <span class="info-value">${booking.service || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Date</span>
                <div class="info-value-with-icon">
                  <span>📅</span>
                  <span>${formattedDate}</span>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">Time</span>
                <div class="info-value-with-icon">
                  <span>🕐</span>
                  <span>${formattedTime}</span>
                </div>
              </div>
            </div>

            <div style="margin-top: 24px;">
              <div class="section-header" style="margin-bottom: 12px;">
                <span>📍</span>
                <span>Service Address</span>
              </div>
              <div class="address-text">
                ${booking.address.line1}<br>
                ${booking.address.suburb}<br>
                ${booking.address.city}
              </div>
            </div>

            <div class="details-row" style="margin-top: 24px;">
              <div class="details-item">
                <span class="info-label">Bedrooms</span>
                <div class="info-value">${booking.bedrooms}</div>
              </div>
              <div class="details-item">
                <span class="info-label">Bathrooms</span>
                <div class="info-value">${booking.bathrooms}</div>
              </div>
            </div>

            ${booking.extras.length > 0 ? `
            <div style="margin-top: 24px;">
              <span class="info-label">Additional Services</span>
              <div class="addon-badges">
                ${booking.extras.map(extra => `<span class="addon-badge">${extra}</span>`).join('')}
              </div>
            </div>
            ` : ''}

            ${booking.notes ? `
            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <span class="info-label">Special Instructions</span>
              <p style="color: #334155; line-height: 1.6; margin-top: 8px;">${booking.notes}</p>
            </div>
            ` : ''}

            <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <span class="info-label">Cleaner Assignment</span>
              ${booking.cleaner_id === 'manual' ? `
              <div class="cleaner-assignment-card">
                <div style="font-weight: 700; color: #991b1b; margin-bottom: 4px;">⚠️ MANUAL CLEANER ASSIGNMENT REQUIRED</div>
                <div style="font-size: 14px; color: #7f1d1d;">Customer requested manual assignment. Please assign a cleaner for this booking.</div>
              </div>
              ` : booking.cleaner_id ? `
              <div class="cleaner-assignment-card assigned" style="margin-top: 12px;">
                <div style="font-weight: 600; color: #1e40af; margin-bottom: 4px;">✅ Cleaner Assigned</div>
                <div style="font-size: 14px; color: #1e3a8a;">Cleaner ID: ${booking.cleaner_id}</div>
              </div>
              ` : `
              <div class="cleaner-assignment-card" style="margin-top: 12px;">
                <div style="font-weight: 600; color: #991b1b; margin-bottom: 4px;">⚠️ No Cleaner Assigned Yet</div>
                <div style="font-size: 14px; color: #7f1d1d;">Please assign a cleaner to this booking.</div>
              </div>
              `}
            </div>
          </div>

          <!-- Payment Summary -->
          <div class="payment-section">
            <div class="payment-header">
              <div class="section-title" style="color: #1e40af;">
                <span>💰</span>
                <span>Pricing Summary</span>
              </div>
              <p class="total-amount">R${totalPrice.toFixed(2)}</p>
            </div>
            <p style="text-align: center; color: #334155; font-weight: 600; margin-top: 8px;">Customer will pay: R${totalPrice.toFixed(2)}</p>
          </div>

          <!-- Next Steps -->
          <div class="next-steps">
            <div class="next-steps-title">Next Steps:</div>
            <ul class="next-steps-list">
              ${booking.cleaner_id === 'manual' ? '<li>⚠️ 1. ASSIGN CLEANER MANUALLY</li>' : ''}
              <li>${booking.cleaner_id === 'manual' ? '2' : '1'}. Contact customer within 24 hours</li>
              <li>${booking.cleaner_id === 'manual' ? '3' : '2'}. Confirm appointment and availability</li>
              <li>${booking.cleaner_id === 'manual' ? '4' : '3'}. ${booking.paymentReference ? 'Payment already received' : 'Send payment link/details'}</li>
              <li>${booking.cleaner_id === 'manual' ? '5' : '4'}. Schedule team assignment</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p class="footer-text">This is an automated notification from your Shalean Cleaning website.</p>
          <p class="footer-timestamp">Booking received at: ${new Date().toLocaleString('en-ZA')}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shalean.co.za';

  return {
    to: adminEmail,
    subject: `🔔 New Booking: ${booking.bookingId} - ${booking.firstName} ${booking.lastName}`,
    html,
  };
}

export function generateQuoteConfirmationEmail(quote: QuoteRequest): EmailData {
  // Build carpet details section if service is Carpet
  const carpetSection = quote.service === 'Carpet' && quote.carpetDetails ? `
    <h4>Carpet Cleaning Details</h4>
    <p><strong>Carpet Type:</strong> ${
      quote.carpetDetails.hasFittedCarpets && quote.carpetDetails.hasLooseCarpets 
        ? 'Fitted Carpets & Loose Carpets/Rugs'
        : quote.carpetDetails.hasFittedCarpets 
        ? 'Fitted Carpets'
        : quote.carpetDetails.hasLooseCarpets 
        ? 'Loose Carpets/Rugs'
        : 'Not specified'
    }</p>
    ${quote.carpetDetails.hasFittedCarpets && quote.carpetDetails.numberOfRooms > 0 ? `
      <p><strong>Rooms with Fitted Carpets:</strong> ${quote.carpetDetails.numberOfRooms} ${quote.carpetDetails.numberOfRooms === 1 ? 'Room' : 'Rooms'}</p>
    ` : ''}
    ${quote.carpetDetails.hasLooseCarpets && quote.carpetDetails.numberOfLooseCarpets > 0 ? `
      <p><strong>Loose Carpets/Rugs:</strong> ${quote.carpetDetails.numberOfLooseCarpets} ${quote.carpetDetails.numberOfLooseCarpets === 1 ? 'Item' : 'Items'}</p>
    ` : ''}
    <p><strong>Room Status:</strong> ${quote.carpetDetails.roomStatus === 'empty' ? 'Empty (Furniture moved)' : 'Has Property (Furniture in place)'}</p>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote Confirmation - Shalean Cleaning</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0C53ED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .quote-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .contact-info { background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .notes { background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .total { font-size: 18px; font-weight: bold; color: #0C53ED; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Quote Confirmed!</h1>
        <p>Thank you for requesting a quote from Shalean Cleaning Services</p>
      </div>
      
      <div class="content">
        <p>Hi ${quote.firstName} ${quote.lastName},</p>
        
        <p>Your quote request has been confirmed! Here are the details:</p>
        
        <div class="quote-details">
          <h3>Quote Details</h3>
          <p><strong>Quote ID:</strong> ${quote.quoteId || 'N/A'}</p>
          <p><strong>Service Type:</strong> ${quote.service}</p>
          
          <h4>Location</h4>
          <p><strong>Address/Location:</strong> ${quote.location || 'Not provided'}</p>
          
          <h4>Home Details</h4>
          <p><strong>Bedrooms:</strong> ${quote.bedrooms}</p>
          <p><strong>Bathrooms:</strong> ${quote.bathrooms}</p>
          
          ${carpetSection}
          
          ${quote.extras.length > 0 ? `
            <h4>Additional Services</h4>
            <ul>
              ${quote.extras.map(extra => `<li>${extra}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
        
        ${quote.notes && quote.notes.trim() ? `
          <div class="notes">
            <h4>Your Notes/Instructions</h4>
            <p>${quote.notes}</p>
          </div>
        ` : ''}
        
        <div class="contact-info">
          <h4>Your Contact Information</h4>
          <p><strong>Name:</strong> ${quote.firstName} ${quote.lastName}</p>
          <p><strong>Email:</strong> ${quote.email}</p>
          <p><strong>Phone:</strong> ${quote.phone}</p>
        </div>
        
        <p>Our team will review your requirements and get back to you within 24 hours with a final quote and available booking slots.</p>
        
        <p>If you have any questions, please contact us at:</p>
        <p>
          <strong>Phone:</strong> +27 87 153 5250<br>
          <strong>Email:</strong> bookings@shalean.com
        </p>
      </div>
      
      <div class="footer">
        <p>Thank you for choosing Shalean Cleaning Services!</p>
        <p>This is an automated email. Please do not reply to this message.</p>
      </div>
    </body>
    </html>
  `;

  return {
    to: quote.email,
    subject: `Quote Confirmation - ${quote.quoteId || 'N/A'} | Shalean Cleaning`,
    html,
  };
}

export async function generateAdminQuoteNotificationEmail(quote: QuoteRequest): Promise<EmailData> {
  const pricingData = await fetchActivePricing();
  const pricingDetails = calcTotalSync(
    {
      service: quote.service as ServiceType,
      bedrooms: quote.bedrooms || 0,
      bathrooms: quote.bathrooms || 0,
      extras: quote.extras || [],
      extrasQuantities: undefined,
    },
    'one-time',
    pricingData
  );
  const totalPrice = pricingDetails.total;
  
  // Build carpet details section if service is Carpet
  const carpetSection = quote.service === 'Carpet' && quote.carpetDetails ? `
    <h4>Carpet Cleaning Details</h4>
    <p><strong>Carpet Type:</strong> ${
      quote.carpetDetails.hasFittedCarpets && quote.carpetDetails.hasLooseCarpets 
        ? 'Fitted Carpets & Loose Carpets/Rugs'
        : quote.carpetDetails.hasFittedCarpets 
        ? 'Fitted Carpets'
        : quote.carpetDetails.hasLooseCarpets 
        ? 'Loose Carpets/Rugs'
        : 'Not specified'
    }</p>
    ${quote.carpetDetails.hasFittedCarpets && quote.carpetDetails.numberOfRooms > 0 ? `
      <p><strong>Rooms with Fitted Carpets:</strong> ${quote.carpetDetails.numberOfRooms} ${quote.carpetDetails.numberOfRooms === 1 ? 'Room' : 'Rooms'}</p>
    ` : ''}
    ${quote.carpetDetails.hasLooseCarpets && quote.carpetDetails.numberOfLooseCarpets > 0 ? `
      <p><strong>Loose Carpets/Rugs:</strong> ${quote.carpetDetails.numberOfLooseCarpets} ${quote.carpetDetails.numberOfLooseCarpets === 1 ? 'Item' : 'Items'}</p>
    ` : ''}
    <p><strong>Room Status:</strong> ${quote.carpetDetails.roomStatus === 'empty' ? 'Empty (Furniture moved)' : 'Has Property (Furniture in place)'}</p>
  ` : '';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Quote Request - Shalean Cleaning</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0C53ED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .quote-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .contact-info { background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .notes { background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .total { font-size: 18px; font-weight: bold; color: #0C53ED; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>New Quote Request</h1>
        <p>Shalean Cleaning Services - Admin Notification</p>
      </div>
      
      <div class="content">
        <p>A new quote request has been submitted and needs your attention.</p>
        
        <div class="quote-details">
          <h3>Quote Details</h3>
          <p><strong>Quote ID:</strong> ${quote.quoteId || 'N/A'}</p>
          <p><strong>Service Type:</strong> ${quote.service}</p>
          
          <h4>Location</h4>
          <p><strong>Address/Location:</strong> ${quote.location || 'Not provided'}</p>
          
          <h4>Home Details</h4>
          <p><strong>Bedrooms:</strong> ${quote.bedrooms}</p>
          <p><strong>Bathrooms:</strong> ${quote.bathrooms}</p>
          
          ${carpetSection}
          
          ${quote.extras.length > 0 ? `
            <h4>Additional Services Requested</h4>
            <ul>
              ${quote.extras.map(extra => `<li>${extra}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
        
        ${quote.notes && quote.notes.trim() ? `
          <div class="notes">
            <h4>Customer Notes/Instructions</h4>
            <p>${quote.notes}</p>
          </div>
        ` : ''}
        
        <div class="contact-info">
          <h3>Customer Contact Information</h3>
          <p><strong>Name:</strong> ${quote.firstName} ${quote.lastName}</p>
          <p><strong>Email:</strong> ${quote.email}</p>
          <p><strong>Phone:</strong> ${quote.phone}</p>
        </div>
        
        <div class="quote-details">
          <h3>Estimated Pricing</h3>
          <p><strong>Estimated Total: R${totalPrice}</strong></p>
          <div class="total">Please review and provide final quote to customer</div>
        </div>
        
        <p><strong>Action Required:</strong> Please contact the customer within 24 hours to provide final quote and available booking slots.</p>
      </div>
      
      <div class="footer">
        <p>This is an automated notification from your Shalean Cleaning website.</p>
      </div>
    </body>
    </html>
  `;

  const adminEmail = process.env.ADMIN_EMAIL || 'bookings@shalean.co.za';

  return {
    to: adminEmail,
    subject: `New Quote Request - ${quote.quoteId || 'N/A'} | ${quote.firstName} ${quote.lastName}`,
    html,
  };
}

// Application Email Templates

export interface ApplicationData {
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location?: string;
  position: string;
  coverLetter: string;
  workExperience?: string;
  certifications?: string;
  availability?: string;
  references?: string;
  resumeUrl?: string;
  transportationDetails?: string;
  languagesSpoken?: string;
  criminalBackgroundConsent: boolean;
}

export function generateApplicationConfirmationEmail(application: ApplicationData): EmailData {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Application Received - Shalean Cleaning</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0C53ED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .application-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .next-steps { background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .success-box { background-color: #d4edda; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>✅ Application Received!</h1>
        <p>Thank you for applying to Shalean Cleaning Services</p>
      </div>
      
      <div class="content">
        <p>Hi ${application.firstName} ${application.lastName},</p>
        
        <div class="success-box">
          <strong>🎉 Your application has been successfully submitted!</strong><br>
          We're excited that you're interested in joining our team.
        </div>
        
        <p>We have received your application for the position of <strong>${application.position}</strong>.</p>
        
        <div class="application-details">
          <h3>Application Details</h3>
          <p><strong>Application ID:</strong> ${application.applicationId}</p>
          <p><strong>Position:</strong> ${application.position}</p>
          ${application.location ? `<p><strong>Location:</strong> ${application.location}</p>` : ''}
          <p><strong>Submitted:</strong> ${new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p><strong>Your Contact:</strong></p>
          <ul>
            <li>Email: ${application.email}</li>
            <li>Phone: ${application.phone}</li>
          </ul>
        </div>
        
        <div class="next-steps">
          <h3>What Happens Next?</h3>
          <ol>
            <li><strong>Application Review (1-3 days):</strong> Our HR team will carefully review your application and qualifications.</li>
            <li><strong>Initial Screening:</strong> If your profile matches our requirements, we'll contact you for a phone screening.</li>
            <li><strong>Interview:</strong> Qualified candidates will be invited for an in-person or virtual interview.</li>
            <li><strong>Background Check:</strong> Final candidates will undergo a background verification process.</li>
            <li><strong>Onboarding:</strong> Successful applicants will receive an offer and join our training program.</li>
          </ol>
        </div>
        
        <p><strong>Timeline:</strong> We aim to respond to all applications within 5 business days. If your application matches our current openings, we'll reach out via email or phone.</p>
        
        <p>In the meantime, feel free to learn more about us:</p>
        <ul>
          <li>Visit our website: <a href="https://shalean.co.za">shalean.co.za</a></li>
          <li>Follow us on Instagram: @shaleancleaning</li>
        </ul>
        
        <p>If you have any questions about your application, please contact us at:</p>
        <p>
          <strong>Email:</strong> careers@shalean.com<br>
          <strong>Phone:</strong> +27 87 153 5250
        </p>
        
        <p>Thank you for your interest in joining Shalean Cleaning Services. We look forward to reviewing your application!</p>
      </div>
      
      <div class="footer">
        <p>Best regards,<br>The Shalean Cleaning HR Team</p>
        <p>This is an automated email. Please do not reply to this message.</p>
      </div>
    </body>
    </html>
  `;

  return {
    to: application.email,
    subject: `Application Received - ${application.position} | Shalean Cleaning`,
    html,
  };
}

export function generateAdminApplicationNotificationEmail(application: ApplicationData): EmailData {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Job Application - Shalean Cleaning</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0C53ED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .application-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .contact-info { background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .urgent { background-color: #ff4444; color: white; padding: 10px; border-radius: 4px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .info-section { margin: 15px 0; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔔 New Job Application</h1>
        <p>Shalean Cleaning Services - HR Notification</p>
      </div>
      
      <div class="content">
        <div class="urgent">
          <strong>⚠️ NEW APPLICATION</strong> - Review Required
        </div>
        
        <p>A new job application has been submitted and requires review.</p>
        
        <div class="contact-info">
          <h3>Applicant Contact Information</h3>
          <p><strong>Name:</strong> ${application.firstName} ${application.lastName}</p>
          <p><strong>Email:</strong> <a href="mailto:${application.email}">${application.email}</a></p>
          <p><strong>Phone:</strong> <a href="tel:${application.phone}">${application.phone}</a></p>
        </div>
        
        <div class="application-details">
          <h3>Application Details</h3>
          <p><strong>Application ID:</strong> ${application.applicationId}</p>
          <p><strong>Position Applied For:</strong> ${application.position}</p>
          ${application.location ? `<p><strong>Location:</strong> ${application.location}</p>` : ''}
          <p><strong>Submitted:</strong> ${new Date().toLocaleString('en-ZA')}</p>
          
          <div class="info-section">
            <h4>Cover Letter / Motivation</h4>
            <p>${application.coverLetter}</p>
          </div>
          
          ${application.workExperience ? `
          <div class="info-section">
            <h4>Work Experience</h4>
            <p>${application.workExperience}</p>
          </div>
          ` : ''}
          
          ${application.certifications ? `
          <div class="info-section">
            <h4>Certifications</h4>
            <p>${application.certifications}</p>
          </div>
          ` : ''}
          
          ${application.availability ? `
          <div class="info-section">
            <h4>Availability</h4>
            <p>${application.availability}</p>
          </div>
          ` : ''}
          
          ${application.languagesSpoken ? `
          <div class="info-section">
            <h4>Languages Spoken</h4>
            <p>${application.languagesSpoken}</p>
          </div>
          ` : ''}
          
          ${application.transportationDetails ? `
          <div class="info-section">
            <h4>Transportation</h4>
            <p>${application.transportationDetails}</p>
          </div>
          ` : ''}
          
          ${application.references ? `
          <div class="info-section">
            <h4>References</h4>
            <p>${application.references}</p>
          </div>
          ` : ''}
          
          ${application.resumeUrl ? `
          <div class="info-section">
            <h4>Resume</h4>
            <p><a href="${application.resumeUrl}">Download Resume</a></p>
          </div>
          ` : '<p><em>No resume uploaded</em></p>'}
          
          <div class="info-section">
            <h4>Background Check Consent</h4>
            <p>${application.criminalBackgroundConsent ? '✅ Applicant has consented to background check' : '❌ No consent provided'}</p>
          </div>
        </div>
        
        <div class="urgent">
          <strong>Next Steps:</strong><br>
          1. Review application and qualifications<br>
          2. Check references if provided<br>
          3. Contact applicant within 5 business days<br>
          4. Schedule initial screening call if qualified<br>
          5. Update application status in database
        </div>
      </div>
      
      <div class="footer">
        <p>This is an automated notification from your Shalean Cleaning website.</p>
        <p>Application received at: ${new Date().toLocaleString('en-ZA')}</p>
      </div>
    </body>
    </html>
  `;

  const adminEmail = process.env.ADMIN_EMAIL || 'careers@shalean.co.za';

  return {
    to: adminEmail,
    subject: `🔔 New Application: ${application.position} - ${application.firstName} ${application.lastName}`,
    html,
  };
}

/**
 * Generate review request email for customers after booking completion
 */
export function generateReviewRequestEmail(data: {
  customerEmail: string;
  customerName: string;
  bookingId: string;
  bookingDate: string;
  bookingTime: string;
  serviceType: string;
  cleanerName?: string;
}): EmailData {
  console.log('🚀 [EMAIL DEBUG] generateReviewRequestEmail() called with:', {
    bookingId: data.bookingId,
    customerEmail: data.customerEmail,
    customerName: data.customerName
  });

  // Use .co.za domain to match sender email
  const dashboardUrl = 'https://shalean.co.za/dashboard';
  
  console.log('🔗 [EMAIL DEBUG] Review email URL:', { 
    envSiteUrl: process.env.NEXT_PUBLIC_SITE_URL, 
    dashboardUrl: dashboardUrl 
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>How Was Your Cleaning Service? - Shalean</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px; 
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header { 
          background: linear-gradient(135deg, #0C53ED 0%, #0842c4 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }
        .content { 
          padding: 40px 30px; 
        }
        .service-details { 
          background-color: #f9fafb; 
          padding: 20px; 
          border-radius: 8px; 
          margin: 25px 0;
          border-left: 4px solid #0C53ED;
        }
        .service-details p {
          margin: 8px 0;
        }
        .cta-button { 
          display: inline-block;
          background-color: #0C53ED; 
          color: white; 
          padding: 16px 40px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: bold;
          font-size: 16px;
          margin: 20px 0;
          text-align: center;
          transition: background-color 0.3s;
        }
        .cta-button:hover {
          background-color: #0842c4;
        }
        .stars {
          font-size: 32px;
          color: #fbbf24;
          text-align: center;
          margin: 20px 0;
        }
        .footer { 
          text-align: center; 
          padding: 30px; 
          color: #666; 
          font-size: 14px;
          background-color: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }
        .highlight {
          color: #0C53ED;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌟 How Was Your Experience?</h1>
          <p>We'd love to hear your feedback!</p>
        </div>
        
        <div class="content">
          <p>Hi ${data.customerName},</p>
          
          <p>Thank you for choosing Shalean Cleaning Services! We hope you're enjoying your sparkling clean space.</p>
          
          <p>Your cleaning service has been completed, and we'd greatly appreciate it if you could take a moment to share your experience.</p>
          
          <div class="service-details">
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <p><strong>Service:</strong> ${data.serviceType}</p>
            <p><strong>Date:</strong> ${new Date(data.bookingDate).toLocaleDateString('en-ZA', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>Time:</strong> ${data.bookingTime}</p>
            ${data.cleanerName ? `<p><strong>Cleaner:</strong> ${data.cleanerName}</p>` : ''}
          </div>

          <div class="stars">
            ⭐ ⭐ ⭐ ⭐ ⭐
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" class="cta-button">
              Leave a Review
            </a>
          </p>
          
          <p>Your feedback helps us:</p>
          <ul>
            <li>Maintain our high standards of service</li>
            <li>Recognize and reward our excellent cleaners</li>
            <li>Continuously improve our offerings</li>
            <li>Help other customers make informed decisions</li>
          </ul>
          
          <p>The review will only take a minute, and your honest feedback is invaluable to us.</p>
          
          <p>Thank you for being a valued customer!</p>
          
          <p>Best regards,<br>
          <strong>The Shalean Team</strong></p>
        </div>
        
        <div class="footer">
          <p>Questions? Contact us anytime</p>
          <p>📧 <a href="mailto:hello@shalean.com" style="color: #0C53ED;">hello@shalean.com</a></p>
          <p style="margin-top: 20px; color: #999; font-size: 12px;">
            This email was sent because your cleaning service was completed.<br>
            Booking ID: ${data.bookingId}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  console.log('📧 [EMAIL DEBUG] Generated HTML contains shalean.co.za:', html.includes('shalean.co.za'));
  console.log('📧 [EMAIL DEBUG] Generated HTML contains shalean.co.za:', html.includes('shalean.co.za/dashboard'));
  console.log('📧 [EMAIL DEBUG] Dashboard URL in HTML:', html.match(/href="([^"]*dashboard[^"]*)"/)?.[1] || 'Not found');

  return {
    to: data.customerEmail,
    subject: `⭐ How was your cleaning service? We'd love your feedback!`,
    html,
  };
}

/** Paid booking confirmation — aligns with Edge `sendBookingPaidEmail` copy. */
export async function sendBookingPaidConfirmationEmail(params: {
  to: string;
  customerName: string;
  serviceName: string;
  amountZar: number;
  bookingId: string;
  zohoInvoiceId: string | null;
}): Promise<{ ok: boolean; providerId?: string; error?: string }> {
  const cfg = validateResendConfig();
  if (!cfg.ok) {
    return { ok: false, error: cfg.error };
  }
  const senderEmail = process.env.SENDER_EMAIL || 'noreply@shalean.co.za';
  const invoiceLine = params.zohoInvoiceId
    ? `<p><strong>Invoice ID:</strong> ${escapeHtmlSimple(params.zohoInvoiceId)}</p>`
    : '';
  const html = `
<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #111;">
  <h1 style="color: #4f46e5;">Booking confirmed</h1>
  <p>Hi ${escapeHtmlSimple(params.customerName)},</p>
  <p>Thank you — your payment was received and your booking is confirmed.</p>
  <ul>
    <li><strong>Service:</strong> ${escapeHtmlSimple(params.serviceName)}</li>
    <li><strong>Amount paid:</strong> R ${params.amountZar.toFixed(2)}</li>
    <li><strong>Booking ID:</strong> ${escapeHtmlSimple(params.bookingId)}</li>
  </ul>
  ${invoiceLine}
  <p style="margin-top: 24px; color: #666; font-size: 14px;">Shalean Cleaning Services</p>
</body>
</html>`;

  try {
    const { id: emailId } = await postResendEmail({
      from: `Shalean Cleaning <${senderEmail}>`,
      to: [params.to],
      subject: 'Booking Confirmed – Shalean Cleaning Services',
      html,
    });
    return { ok: true, providerId: emailId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send failed' };
  }
}

function escapeHtmlSimple(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

