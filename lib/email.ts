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
    const senderEmail = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
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

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@shalean.com';

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

  const adminEmail = process.env.ADMIN_EMAIL || 'bookings@shalean.com';

  return {
    to: adminEmail,
    subject: `New Quote Request - ${quote.quoteId || 'N/A'} | ${quote.firstName} ${quote.lastName}`,
    html,
  };
}

