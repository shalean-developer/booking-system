import { Resend } from 'resend';
import { BookingState, ServiceType } from '@/types/booking';
import { calcTotal } from '@/lib/pricing';

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

export interface QuoteRequest {
  service: ServiceType | string;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  quoteId?: string; // Optional since it's generated on the server
}

export function generateBookingConfirmationEmail(booking: BookingState & { bookingId: string }): EmailData {
  const totalPrice = calcTotal({
    service: booking.service,
    bedrooms: booking.bedrooms,
    bathrooms: booking.bathrooms,
    extras: booking.extras
  });
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation - Shalean Cleaning</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0C53ED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-summary { background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .total { font-size: 18px; font-weight: bold; color: #0C53ED; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Booking Confirmed!</h1>
        <p>Thank you for choosing Shalean Cleaning Services</p>
      </div>
      
      <div class="content">
        <p>Hi ${booking.firstName} ${booking.lastName},</p>
        
        <p>Your cleaning service has been successfully booked! Here are the details:</p>
        
        <div class="booking-details">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${booking.bookingId}</p>
          <p><strong>Service Type:</strong> ${booking.service}</p>
          <p><strong>Date:</strong> ${booking.date ? new Date(booking.date).toLocaleDateString() : 'Not specified'}</p>
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
            <div style="background-color: #fff3cd; padding: 10px; border-radius: 4px; border-left: 4px solid #ffc107;">
              <p style="margin: 0;"><strong>⚠️ Manual Assignment Requested</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Our team will assign the best available cleaner for you and contact you within 24 hours to confirm.</p>
            </div>
          ` : booking.cleaner_id ? `
            <p>✅ Professional cleaner has been assigned to your booking</p>
          ` : `
            <p>Cleaner will be assigned shortly</p>
          `}
        </div>
        
        <div class="order-summary">
          <h3>Order Summary</h3>
          <p><strong>Total Price: R${totalPrice}</strong></p>
          <div class="total">Amount Due: R${totalPrice}</div>
        </div>
        
        <p>${booking.cleaner_id === 'manual' ? 'Our team will contact you within 24 hours to confirm your cleaner assignment and appointment details.' : 'Our team will contact you soon to confirm the appointment.'}</p>
        
        <p>If you have any questions or need to make changes to your booking, please contact us at:</p>
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
    to: booking.email,
    subject: `Booking Confirmation - ${booking.bookingId} | Shalean Cleaning`,
    html,
  };
}

export function generateAdminBookingNotificationEmail(booking: BookingState & { bookingId: string }): EmailData {
  const totalPrice = calcTotal({
    service: booking.service,
    bedrooms: booking.bedrooms,
    bathrooms: booking.bathrooms,
    extras: booking.extras
  });
  
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
          <p><strong>Total Amount: R${totalPrice}</strong></p>
          <div class="total">Customer will pay: R${totalPrice}</div>
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
        .order-summary { background-color: #e8f4fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
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
          
          <h4>Home Details</h4>
          <p><strong>Bedrooms:</strong> ${quote.bedrooms}</p>
          <p><strong>Bathrooms:</strong> ${quote.bathrooms}</p>
          
          ${quote.extras.length > 0 ? `
            <h4>Additional Services</h4>
            <ul>
              ${quote.extras.map(extra => `<li>${extra}</li>`).join('')}
            </ul>
          ` : ''}
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
  const totalPrice = calcTotal({
    service: quote.service as ServiceType,
    bedrooms: quote.bedrooms,
    bathrooms: quote.bathrooms,
    extras: quote.extras
  });
  
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
          
          <h4>Home Details</h4>
          <p><strong>Bedrooms:</strong> ${quote.bedrooms}</p>
          <p><strong>Bathrooms:</strong> ${quote.bathrooms}</p>
          
          ${quote.extras.length > 0 ? `
            <h4>Additional Services Requested</h4>
            <ul>
              ${quote.extras.map(extra => `<li>${extra}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
        
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

