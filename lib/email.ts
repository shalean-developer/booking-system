import { BookingState, ServiceType } from '@/types/booking';
import { calcTotalSync } from '@/lib/pricing';
import { fetchActivePricing } from '@/lib/pricing-db';
import { Resend } from 'resend';
import {
  sendEmail,
  validateResendConfig,
  sendBookingEmailWithData,
  type EmailData,
} from '@/lib/email/send';
import { buildBookingEmailDataFromBookingState } from '@/lib/email/booking-data';
import type { BookingEmailData } from '@/shared/email/types';
import { formatBookingDateDisplay, formatBookingTimeDisplay } from '@/shared/email/datetime';
import { bookingConfirmationSubject, renderBookingEmail } from '@/shared/email/renderer';
import { publicSiteBaseUrl } from '@/lib/booking-manage';
import { SUPPORT_PHONE_DISPLAY, supportWhatsAppUrlWithText } from '@/lib/contact';
import { SITE_SUPPORT_EMAIL } from '@/lib/site-config';
import { resolveAdminNotificationEmail } from '@/lib/admin-email';
import { adminBookingNotificationTemplate } from '@/shared/email/templates/admin-booking-notification';

export { sendEmail, validateResendConfig };

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

export async function generateBookingConfirmationEmail(
  booking: BookingState & {
    bookingId: string;
    totalAmount?: number;
    cleanerName?: string;
    equipment_required?: boolean;
    equipment_fee?: number;
    inferredPaid?: boolean;
    manageToken?: string;
  }
): Promise<EmailData> {
  const data = await buildBookingEmailDataFromBookingState(booking);
  return {
    to: booking.email,
    subject: bookingConfirmationSubject(data),
    html: renderBookingEmail(data),
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

  const serviceLabel = booking.service || 'N/A';
  const addressLines = [
    booking.address.line1,
    booking.address.suburb,
    booking.address.city,
  ].filter((s) => String(s || '').trim().length > 0);

  const extrasLines = [...booking.extras];

  const manual = booking.cleaner_id === 'manual';
  const nextStepLines: string[] = [];
  if (manual) nextStepLines.push('⚠️ 1. ASSIGN CLEANER MANUALLY');
  nextStepLines.push(`${manual ? '2' : '1'}. Contact customer within 24 hours`);
  nextStepLines.push(`${manual ? '3' : '2'}. Confirm appointment and availability`);
  nextStepLines.push(
    `${manual ? '4' : '3'}. ${booking.paymentReference ? 'Payment already received' : 'Send payment link/details'}`,
  );
  nextStepLines.push(`${manual ? '5' : '4'}. Schedule team assignment`);

  let cleaner:
    | { kind: 'manual' }
    | { kind: 'assigned'; id: string }
    | { kind: 'none' };
  if (booking.cleaner_id === 'manual') cleaner = { kind: 'manual' };
  else if (booking.cleaner_id) cleaner = { kind: 'assigned', id: String(booking.cleaner_id) };
  else cleaner = { kind: 'none' };

  const notesTrimmed = booking.notes?.trim();
  const notes = notesTrimmed ? notesTrimmed : null;

  const html = adminBookingNotificationTemplate({
    bookingId: booking.bookingId,
    customerName: `${booking.firstName} ${booking.lastName}`.trim(),
    email: booking.email,
    phone: booking.phone,
    serviceLabel,
    formattedDate,
    formattedTime,
    addressLines,
    bedrooms: booking.bedrooms,
    bathrooms: booking.bathrooms,
    extrasLines,
    notes,
    cleaner,
    totalPrice,
    nextStepLines,
    receivedAtLabel: `Booking received at: ${new Date().toLocaleString('en-ZA')}`,
  });

  const adminEmail = resolveAdminNotificationEmail();

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
          <strong>Phone:</strong> ${SUPPORT_PHONE_DISPLAY}<br>
          <strong>Email:</strong> ${SITE_SUPPORT_EMAIL}
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

  const adminEmail = resolveAdminNotificationEmail();

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
          <li>Visit our website: <a href="${publicSiteBaseUrl()}">${publicSiteBaseUrl().replace(/^https?:\/\//, '')}</a></li>
          <li>Follow us on Instagram: @shaleancleaning</li>
        </ul>
        
        <p>If you have any questions about your application, please contact us at:</p>
        <p>
          <strong>Email:</strong> ${process.env.CAREERS_PUBLIC_EMAIL?.trim() || 'careers@shalean.co.za'}<br>
          <strong>Phone:</strong> ${SUPPORT_PHONE_DISPLAY}
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

  const adminEmail =
    process.env.CAREERS_ADMIN_EMAIL?.trim() ||
    process.env.ADMIN_EMAIL?.trim() ||
    'careers@shalean.co.za';

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

  const dashboardUrl = `${publicSiteBaseUrl()}/dashboard`;
  
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
          <p>📧 <a href="mailto:${SITE_SUPPORT_EMAIL}" style="color: #0C53ED;">${SITE_SUPPORT_EMAIL}</a></p>
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

/** Paid booking confirmation — same template as Edge / customer flow. */
export async function sendBookingPaidConfirmationEmail(params: {
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
  provideEquipment?: boolean;
  equipment_fee?: number;
  equipmentCharge?: number;
  manageToken?: string | null;
  invoiceUrl?: string | null;
  invoicePdf?: Buffer | null;
  /** Same as on Zoho PDF (e.g. INV-00001). */
  zohoInvoiceNumber?: string | null;
  /** Shown in email when no PDF could be attached (optional). */
  invoicePdfMissingNote?: string | null;
}): Promise<{ ok: boolean; providerId?: string; error?: string }> {
  const cfg = validateResendConfig();
  if (!cfg.ok) {
    return { ok: false, error: cfg.error };
  }

  const displayId = /^SC\d{8}$/.test(params.bookingId) ? params.bookingId : params.bookingId.slice(-8);
  const address =
    [params.addressLine1, params.addressSuburb, params.addressCity].filter(Boolean).join(', ') ||
    undefined;

  const equipmentRequired =
    params.equipment_required === true || params.provideEquipment === true;
  const equipmentFeeZar =
    typeof params.equipment_fee === 'number'
      ? params.equipment_fee
      : typeof params.equipmentCharge === 'number'
        ? params.equipmentCharge
        : 0;

  const siteUrl = publicSiteBaseUrl();

  const bookingDateLabel = params.bookingDate
    ? formatBookingDateDisplay(params.bookingDate)
    : undefined;
  const bookingTimeLabel = params.bookingTime
    ? formatBookingTimeDisplay(params.bookingTime)
    : undefined;

  const data: BookingEmailData = {
    customerName: params.customerName,
    serviceName: params.serviceName,
    bookingId: displayId,
    amountZar: params.amountZar,
    status: 'paid',
    invoiceId: params.zohoInvoiceId ?? undefined,
    invoiceNumber: params.zohoInvoiceNumber?.trim() || undefined,
    bookingDate: bookingDateLabel,
    bookingTime: bookingTimeLabel,
    address,
    paymentReference: params.paymentReference ?? undefined,
    equipmentRequired,
    equipmentFeeZar,
    cleanerSummary: 'We will assign a cleaner and notify you shortly.',
    manageBookingUrl: `${siteUrl}/dashboard`,
    trackingUrl: `${siteUrl}/dashboard`,
    siteBaseUrl: siteUrl,
    manageToken: params.manageToken ?? undefined,
    invoiceUrl: params.invoiceUrl?.trim() || undefined,
    invoicePdfMissingNote: params.invoicePdfMissingNote?.trim() || undefined,
    whatsappUrl: supportWhatsAppUrlWithText(`Hi Shalean, regarding booking #${displayId}`),
  };

  try {
    const result = await sendBookingEmailWithData(params.to.trim(), data, {
      invoicePdf: params.invoicePdf ?? undefined,
      invoiceAttachmentFilename:
        params.invoicePdf && params.invoicePdf.length > 0
          ? `Invoice-${displayId}.pdf`
          : undefined,
    });
    return { ok: true, providerId: result.messageId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'send failed' };
  }
}
