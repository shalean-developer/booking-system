import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Admin Booking Email API
 * POST: Send custom email to customer
 */
export async function POST(req: Request) {
  console.log('=== ADMIN BOOKING EMAIL POST ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { to, subject, html, template, bookingData } = body;
    
    if (!to || (!subject && !template)) {
      return NextResponse.json(
        { ok: false, error: 'Recipient and subject/template required' },
        { status: 400 }
      );
    }
    
    let emailSubject = subject;
    let emailHtml = html;
    
    // Generate email from template if specified
    if (template && bookingData) {
      switch (template) {
        case 'confirmation':
          emailSubject = `Booking Confirmation - ${bookingData.id}`;
          emailHtml = generateConfirmationEmail(bookingData);
          break;
        case 'update':
          emailSubject = `Booking Update - ${bookingData.id}`;
          emailHtml = generateUpdateEmail(bookingData);
          break;
        case 'reminder':
          emailSubject = `Booking Reminder - ${bookingData.id}`;
          emailHtml = generateReminderEmail(bookingData);
          break;
        default:
          break;
      }
    }
    
    // Send email
    await sendEmail({
      to,
      subject: emailSubject,
      html: emailHtml,
    });
    
    console.log(`✅ Sent email to ${to}`);
    
    return NextResponse.json({
      ok: true,
      message: 'Email sent successfully',
    });
    
  } catch (error) {
    console.error('=== ADMIN BOOKING EMAIL POST ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Email template generators
function generateConfirmationEmail(booking: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Booking Confirmation</h2>
      <p>Dear ${booking.customer_name},</p>
      <p>Your booking has been confirmed!</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Booking Details</h3>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Service:</strong> ${booking.service_type}</p>
        <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.booking_time}</p>
        <p><strong>Address:</strong> ${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}</p>
        ${booking.cleaner_name ? `<p><strong>Cleaner:</strong> ${booking.cleaner_name}</p>` : ''}
      </div>
      
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>Shalean Cleaning Services</p>
    </div>
  `;
}

function generateUpdateEmail(booking: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Booking Update</h2>
      <p>Dear ${booking.customer_name},</p>
      <p>Your booking has been updated.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Updated Booking Details</h3>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Service:</strong> ${booking.service_type}</p>
        <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.booking_time}</p>
        <p><strong>Status:</strong> ${booking.status}</p>
        ${booking.cleaner_name ? `<p><strong>Cleaner:</strong> ${booking.cleaner_name}</p>` : ''}
      </div>
      
      <p>If you have any questions about this update, please contact us.</p>
      <p>Best regards,<br>Shalean Cleaning Services</p>
    </div>
  `;
}

function generateReminderEmail(booking: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Booking Reminder</h2>
      <p>Dear ${booking.customer_name},</p>
      <p>This is a friendly reminder about your upcoming cleaning service.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Booking Details</h3>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
        <p><strong>Service:</strong> ${booking.service_type}</p>
        <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</p>
        <p><strong>Time:</strong> ${booking.booking_time}</p>
        <p><strong>Address:</strong> ${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}</p>
        ${booking.cleaner_name ? `<p><strong>Cleaner:</strong> ${booking.cleaner_name}</p>` : ''}
      </div>
      
      <p>We look forward to serving you!</p>
      <p>Best regards,<br>Shalean Cleaning Services</p>
    </div>
  `;
}

