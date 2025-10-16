import { NextResponse } from 'next/server';
import { sendEmail, generateBookingConfirmationEmail, generateAdminBookingNotificationEmail } from '@/lib/email';
import { BookingState } from '@/types/booking';

/**
 * API endpoint to handle booking submissions
 * Currently logs to console - integrate with Paystack/email service later
 */
export async function POST(req: Request) {
  console.log('=== BOOKING API CALLED ===');
  try {
    const body: BookingState = await req.json();
    
    console.log('=== BOOKING SUBMISSION ===');
    console.log(JSON.stringify(body, null, 2));
    console.log('========================');

    // Generate unique booking ID
    const bookingId = `BK-${Date.now()}`;
    
    // TODO: Integrate with:
    // - Database (save booking)
    // - Payment gateway (Paystack)
    // - Calendar system

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping email sending');
      return NextResponse.json({ 
        ok: true,
        bookingId,
        message: 'Booking received successfully. Email service not configured.',
        emailSent: false,
        emailError: 'Email service not configured'
      });
    }

    // Send confirmation emails to customer and admin
    let emailSent = false;
    let emailError = null;

    try {
      console.log('=== EMAIL SENDING ATTEMPT ===');
      console.log('RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);
      console.log('SENDER_EMAIL:', process.env.SENDER_EMAIL || 'onboarding@resend.dev');
      console.log('Customer email:', body.email);
      console.log('Admin email:', process.env.ADMIN_EMAIL || 'admin@shalean.com');
      console.log('Booking ID:', bookingId);

      // Send confirmation email to customer
      console.log('Generating customer email...');
      const customerEmailData = generateBookingConfirmationEmail({
        ...body,
        bookingId
      });
      console.log('Customer email generated successfully');
      
      await sendEmail(customerEmailData);
      console.log('Customer confirmation email sent successfully');
      
      // Send notification email to admin
      console.log('Generating admin email...');
      const adminEmailData = generateAdminBookingNotificationEmail({
        ...body,
        bookingId
      });
      console.log('Admin email generated successfully');
      
      await sendEmail(adminEmailData);
      console.log('Admin notification email sent successfully');
      
      emailSent = true;
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr);
      console.error('Email error details:', {
        message: emailErr instanceof Error ? emailErr.message : 'Unknown error',
        stack: emailErr instanceof Error ? emailErr.stack : undefined,
        name: emailErr instanceof Error ? emailErr.name : undefined
      });
      emailError = emailErr instanceof Error ? emailErr.message : 'Unknown email error';
      // Don't fail the entire request if email fails
      // In production, you might want to queue this for retry
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({ 
      ok: true,
      bookingId,
      message: 'Booking received successfully. Confirmation email sent!',
      emailSent,
      emailError: emailSent ? null : emailError
    });
  } catch (error) {
    console.error('Booking submission error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to process booking' },
      { status: 500 }
    );
  }
}

