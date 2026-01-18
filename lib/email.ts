import { Resend } from 'resend';
import { BookingState, ServiceType } from '@/types/booking';
import { calcTotalSync } from '@/lib/pricing';

// Initialize Resend only when needed to avoid errors if API key is not configured
function getResendInstance() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailData) {
  try {
    const resend = getResendInstance();
    
    // Get sender email from environment variable or use default
    const senderEmail = process.env.SENDER_EMAIL || 'noreply@shalean.co.za';
    const senderName = 'Shalean Cleaning';
    const fromAddress = `${senderName} <${senderEmail}>`;

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
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

export function generateBookingConfirmationEmail(
  booking: BookingState & { bookingId: string; totalAmount?: number; cleanerName?: string }
): EmailData {
  // Use the actual totalAmount if provided (from database), otherwise recalculate
  // totalAmount is in rands (not cents)
  let totalPrice: number;
  if (booking.totalAmount !== undefined && booking.totalAmount > 0) {
    totalPrice = booking.totalAmount;
  } else {
    // Fallback to recalculating if totalAmount not provided
    const pricingDetails = calcTotalSync({
      service: booking.service,
      bedrooms: booking.bedrooms || 0,
      bathrooms: booking.bathrooms || 0,
      extras: booking.extras || [],
      extrasQuantities: booking.extrasQuantities
    }, booking.frequency || 'one-time');
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
          color: #1f2937; 
          background-color: #f3f4f6;
          padding: 20px;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #0C53ED 0%, #0842c4 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .header-icon {
          font-size: 48px;
          margin-bottom: 10px;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .header p {
          font-size: 16px;
          opacity: 0.95;
        }
        .payment-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          margin: 20px 30px;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          display: ${booking.paymentReference ? 'block' : 'none'};
        }
        .content {
          padding: 30px;
        }
        .greeting {
          font-size: 18px;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .card {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        .card-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-title-icon {
          font-size: 20px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        .info-row:last-child {
          border-bottom: none;
        }
        .info-label {
          font-weight: 600;
          color: #6b7280;
          font-size: 14px;
        }
        .info-value {
          color: #111827;
          font-weight: 500;
          text-align: right;
        }
        .address-block {
          background-color: #f9fafb;
          padding: 16px;
          border-radius: 8px;
          margin-top: 12px;
          line-height: 1.8;
          color: #374151;
        }
        .extras-list {
          list-style: none;
          padding: 0;
          margin-top: 12px;
        }
        .extras-list li {
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
          color: #374151;
        }
        .extras-list li:last-child {
          border-bottom: none;
        }
        .extras-list li:before {
          content: "✓";
          color: #10b981;
          font-weight: bold;
          margin-right: 8px;
        }
        .cleaner-assignment {
          background-color: #eff6ff;
          border-left: 4px solid #0C53ED;
          padding: 16px;
          border-radius: 8px;
          margin-top: 12px;
        }
        .cleaner-assignment.manual {
          background-color: #fffbeb;
          border-left-color: #f59e0b;
        }
        .cleaner-assignment.pending {
          background-color: #f9fafb;
          border-left-color: #9ca3af;
        }
        .frequency-badge {
          display: inline-block;
          background-color: #dbeafe;
          color: #1e40af;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 8px;
        }
        .next-dates {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
        }
        .next-dates-list {
          list-style: none;
          padding: 0;
          margin-top: 8px;
        }
        .next-dates-list li {
          padding: 6px 0;
          color: #4b5563;
          font-size: 14px;
        }
        .next-dates-list li:before {
          content: "📅";
          margin-right: 8px;
        }
        .payment-summary {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 2px solid #0C53ED;
        }
        .total-amount {
          font-size: 24px;
          font-weight: 700;
          color: #0C53ED;
          text-align: center;
          margin-top: 12px;
        }
        .payment-reference {
          font-size: 12px;
          color: #6b7280;
          margin-top: 8px;
          text-align: center;
        }
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 24px;
        }
        .btn {
          display: inline-block;
          padding: 14px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          text-align: center;
          font-size: 15px;
          transition: all 0.2s;
        }
        .btn-primary {
          background-color: #0C53ED;
          color: white;
        }
        .btn-primary:hover {
          background-color: #0842c4;
        }
        .btn-secondary {
          background-color: #ffffff;
          color: #0C53ED;
          border: 2px solid #0C53ED;
        }
        .btn-secondary:hover {
          background-color: #eff6ff;
        }
        .calendar-links {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .calendar-link {
          flex: 1;
          min-width: 120px;
          padding: 10px 16px;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          text-decoration: none;
          color: #374151;
          font-size: 13px;
          text-align: center;
          font-weight: 500;
        }
        .calendar-link:hover {
          background-color: #f3f4f6;
          border-color: #d1d5db;
        }
        .contact-info {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          margin-top: 24px;
          text-align: center;
        }
        .contact-info p {
          margin: 8px 0;
          color: #4b5563;
          font-size: 14px;
        }
        .contact-info a {
          color: #0C53ED;
          text-decoration: none;
        }
        .contact-info a:hover {
          text-decoration: underline;
        }
        .footer {
          background-color: #f9fafb;
          padding: 24px 30px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          color: #6b7280;
          font-size: 13px;
          margin: 4px 0;
        }
        .footer a {
          color: #0C53ED;
          text-decoration: none;
        }
        @media only screen and (max-width: 600px) {
          .content {
            padding: 20px;
          }
          .header {
            padding: 30px 20px;
          }
          .header h1 {
            font-size: 24px;
          }
          .calendar-links {
            flex-direction: column;
          }
          .calendar-link {
            width: 100%;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="header-icon">✅</div>
          <h1>Booking Confirmed!</h1>
          <p>Thank you for choosing Shalean Cleaning Services</p>
        </div>

        ${booking.paymentReference ? `
        <div class="payment-badge">
          💳 Payment Confirmed
        </div>
        ` : ''}

        <div class="content">
          <p class="greeting">Hi ${booking.firstName} ${booking.lastName},</p>
          
          <p style="margin-bottom: 24px; color: #4b5563;">Your cleaning service has been successfully booked! Here are all the details:</p>

          <!-- Booking Summary Card -->
          <div class="card">
            <h3 class="card-title">
              <span class="card-title-icon">📋</span>
              Booking Summary
            </h3>
            <div class="info-row">
              <span class="info-label">Booking ID</span>
              <span class="info-value">${booking.bookingId}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Service Type</span>
              <span class="info-value">${booking.service || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Date</span>
              <span class="info-value">${formattedDate}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Time</span>
              <span class="info-value">${formattedTime}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Frequency</span>
              <span class="info-value">
                <span class="frequency-badge">${frequencyText}</span>
              </span>
            </div>
          </div>

          <!-- Service Details Card -->
          <div class="card">
            <h3 class="card-title">
              <span class="card-title-icon">🏠</span>
              Service Details
            </h3>
            <div class="info-row">
              <span class="info-label">Address</span>
            </div>
            <div class="address-block">
              ${booking.address.line1}<br>
              ${booking.address.suburb}<br>
              ${booking.address.city}
            </div>
            <div class="info-row" style="margin-top: 16px;">
              <span class="info-label">Bedrooms</span>
              <span class="info-value">${booking.bedrooms}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Bathrooms</span>
              <span class="info-value">${booking.bathrooms}</span>
            </div>
            ${booking.extras.length > 0 ? `
            <div style="margin-top: 16px;">
              <div class="info-label" style="margin-bottom: 8px;">Additional Services</div>
              <ul class="extras-list">
                ${booking.extras.map(extra => `<li>${extra}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            ${booking.notes ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <div class="info-label" style="margin-bottom: 8px;">Special Instructions</div>
              <p style="color: #374151; line-height: 1.6;">${booking.notes}</p>
            </div>
            ` : ''}
          </div>

          <!-- Cleaner Assignment Card -->
          <div class="card">
            <h3 class="card-title">
              <span class="card-title-icon">👤</span>
              Cleaner Assignment
            </h3>
            ${booking.cleanerName ? `
            <div class="cleaner-assignment">
              <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">✅ ${booking.cleanerName}</div>
              <div style="font-size: 14px; color: #4b5563;">Professional cleaner assigned to your booking</div>
            </div>
            ` : booking.cleaner_id === 'manual' ? `
            <div class="cleaner-assignment manual">
              <div style="font-weight: 600; color: #92400e; margin-bottom: 4px;">⚠️ Manual Assignment Requested</div>
              <div style="font-size: 14px; color: #78350f;">Our team will assign the best available cleaner for you and contact you within 24 hours to confirm.</div>
            </div>
            ` : booking.cleaner_id ? `
            <div class="cleaner-assignment">
              <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">✅ Professional Cleaner Assigned</div>
              <div style="font-size: 14px; color: #4b5563;">A professional cleaner has been assigned to your booking</div>
            </div>
            ` : `
            <div class="cleaner-assignment pending">
              <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">⏳ Assignment Pending</div>
              <div style="font-size: 14px; color: #4b5563;">A cleaner will be assigned to your booking shortly</div>
            </div>
            `}
          </div>

          <!-- Frequency Card (for recurring bookings) -->
          ${booking.frequency && booking.frequency !== 'one-time' && nextBookingDates.length > 0 ? `
          <div class="card">
            <h3 class="card-title">
              <span class="card-title-icon">🔄</span>
              Recurring Schedule
            </h3>
            <p style="color: #4b5563; margin-bottom: 12px;">Your next scheduled cleanings:</p>
            <div class="next-dates">
              <ul class="next-dates-list">
                ${nextBookingDates.map(date => {
                  const formatted = new Date(date).toLocaleDateString('en-ZA', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  });
                  return `<li>${formatted}</li>`;
                }).join('')}
              </ul>
            </div>
          </div>
          ` : ''}

          <!-- Payment Summary Card -->
          <div class="card payment-summary">
            <h3 class="card-title">
              <span class="card-title-icon">💰</span>
              Payment Summary
            </h3>
            <div class="total-amount">R${totalPrice.toFixed(2)}</div>
            ${booking.paymentReference ? `
            <div class="payment-reference">
              Payment Reference: ${booking.paymentReference}<br>
              <span style="color: #10b981; font-weight: 600;">✓ Payment Confirmed</span>
            </div>
            ` : `
            <div class="payment-reference" style="color: #f59e0b;">
              Payment pending
            </div>
            `}
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <a href="${bookingDashboardUrl}" class="btn btn-primary">
              View Booking in Dashboard
            </a>
            ${calendarLinks ? `
            <div style="margin-top: 8px;">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px; text-align: center;">Add to Calendar:</div>
              <div class="calendar-links">
                <a href="${calendarLinks.google}" class="calendar-link" target="_blank">📅 Google</a>
                <a href="${calendarLinks.outlook}" class="calendar-link" target="_blank">📧 Outlook</a>
                <a href="${calendarLinks.ical}" class="calendar-link" download="booking.ics">📥 iCal</a>
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Contact Information -->
          <div class="contact-info">
            <p style="font-weight: 600; color: #111827; margin-bottom: 12px;">Need Help?</p>
            <p>If you have any questions or need to make changes to your booking, please contact us:</p>
            <p>
              📞 <a href="tel:+27871535250">+27 87 153 5250</a><br>
              ✉️ <a href="mailto:bookings@shalean.com">bookings@shalean.com</a>
            </p>
          </div>
        </div>

        <div class="footer">
          <p><strong>Shalean Cleaning Services</strong></p>
          <p>Thank you for choosing us for your cleaning needs!</p>
          <p style="margin-top: 16px;">
            <a href="${siteUrl}">Visit our website</a> | 
            <a href="${siteUrl}/dashboard">My Dashboard</a>
          </p>
          <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
            This is an automated email. Please do not reply to this message.<br>
            Booking ID: ${booking.bookingId}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return {
    to: booking.email,
    subject: `Booking Confirmation - ${booking.bookingId} | Shalean Cleaning`,
    html,
  };
}

export function generateAdminBookingNotificationEmail(booking: BookingState & { bookingId: string; totalAmount?: number }): EmailData {
  // Use the actual totalAmount if provided (from database), otherwise recalculate
  // totalAmount is in rands (not cents)
  let totalPrice: number;
  if (booking.totalAmount !== undefined && booking.totalAmount > 0) {
    totalPrice = booking.totalAmount;
  } else {
    // Fallback to recalculating if totalAmount not provided
    const pricingDetails = calcTotalSync({
      service: booking.service,
      bedrooms: booking.bedrooms || 0,
      bathrooms: booking.bathrooms || 0,
      extras: booking.extras || [],
      extrasQuantities: booking.extrasQuantities
    }, booking.frequency || 'one-time');
    totalPrice = pricingDetails.total;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Booking Received - Shalean Cleaning</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0C53ED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .contact-info { background-color: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .order-summary { background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .total { font-size: 18px; font-weight: bold; color: #0C53ED; }
        .urgent { background-color: #ff4444; color: white; padding: 10px; border-radius: 4px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🔔 New Booking Received!</h1>
        <p>Shalean Cleaning Services - Admin Notification</p>
      </div>
      
      <div class="content">
        <div class="urgent">
          <strong>⚠️ ACTION REQUIRED</strong> - New booking needs confirmation
        </div>
        
        <p>A new cleaning service has been booked and requires your attention.</p>
        
        <div class="contact-info">
          <h3>Customer Contact Information</h3>
          <p><strong>Name:</strong> ${booking.firstName} ${booking.lastName}</p>
          <p><strong>Email:</strong> <a href="mailto:${booking.email}">${booking.email}</a></p>
          <p><strong>Phone:</strong> <a href="tel:${booking.phone}">${booking.phone}</a></p>
        </div>
        
        <div class="booking-details">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p><strong>Service Type:</strong> ${booking.service}</p>
          <p><strong>Date:</strong> ${booking.date ? new Date(booking.date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}</p>
          <p><strong>Time:</strong> ${booking.time || 'Not specified'}</p>
          
          <h4>Service Address</h4>
          <p>
            ${booking.address.line1}<br>
            ${booking.address.suburb}<br>
            ${booking.address.city}
          </p>
          
          <h4>Home Details</h4>
          <p><strong>Bedrooms:</strong> ${booking.bedrooms}</p>
          <p><strong>Bathrooms:</strong> ${booking.bathrooms}</p>
          
          ${booking.extras.length > 0 ? `
            <h4>Additional Services</h4>
            <ul>
              ${booking.extras.map(extra => `<li>${extra}</li>`).join('')}
            </ul>
          ` : ''}
          
          ${booking.notes ? `<h4>Special Instructions</h4><p>${booking.notes}</p>` : ''}

          <h4>Cleaner Assignment</h4>
          ${booking.cleaner_id === 'manual' ? `
            <div style="background-color: #ffebee; padding: 10px; border-radius: 4px; border-left: 4px solid #f44336;">
              <p style="margin: 0;"><strong>⚠️ MANUAL CLEANER ASSIGNMENT REQUIRED</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Customer requested manual assignment. Please assign a cleaner for this booking.</p>
            </div>
          ` : booking.cleaner_id ? `
            <p>✅ Cleaner ID: ${booking.cleaner_id}</p>
          ` : `
            <p>⚠️ No cleaner assigned yet</p>
          `}
        </div>
        
        <div class="order-summary">
          <h3>Pricing Summary</h3>
          <p><strong>Total Amount: R${totalPrice.toFixed(2)}</strong></p>
          <div class="total">Customer will pay: R${totalPrice.toFixed(2)}</div>
        </div>
        
        <div class="urgent">
          <strong>Next Steps:</strong><br>
          ${booking.cleaner_id === 'manual' ? '⚠️ 1. ASSIGN CLEANER MANUALLY<br>' : ''}
          ${booking.cleaner_id === 'manual' ? '2' : '1'}. Contact customer within 24 hours<br>
          ${booking.cleaner_id === 'manual' ? '3' : '2'}. Confirm appointment and availability<br>
          ${booking.cleaner_id === 'manual' ? '4' : '3'}. ${booking.paymentReference ? 'Payment already received' : 'Send payment link/details'}<br>
          ${booking.cleaner_id === 'manual' ? '5' : '4'}. Schedule team assignment
        </div>
      </div>
      
      <div class="footer">
        <p>This is an automated notification from your Shalean Cleaning website.</p>
        <p>Booking received at: ${new Date().toLocaleString('en-ZA')}</p>
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

export function generateAdminQuoteNotificationEmail(quote: QuoteRequest): EmailData {
  const pricingDetails = calcTotalSync({
    service: quote.service as ServiceType,
    bedrooms: quote.bedrooms || 0,
    bathrooms: quote.bathrooms || 0,
    extras: quote.extras || [],
    extrasQuantities: undefined // Quotes don't have quantities
  }, 'one-time');
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

