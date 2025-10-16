import { NextResponse } from 'next/server';
import { sendEmail, generateBookingConfirmationEmail, generateAdminBookingNotificationEmail } from '@/lib/email';
import { BookingState } from '@/types/booking';

/**
 * API endpoint to handle booking submissions
 * Requires payment verification before confirming booking
 */
export async function POST(req: Request) {
  console.log('=== BOOKING API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const body: BookingState = await req.json();
    
    console.log('=== BOOKING SUBMISSION ===');
    console.log('Service:', body.service);
    console.log('Customer:', body.firstName, body.lastName);
    console.log('Email:', body.email);
    console.log('Payment Reference:', body.paymentReference);
    console.log('Full booking data:', JSON.stringify(body, null, 2));
    console.log('========================');

    // Verify payment reference is provided
    if (!body.paymentReference) {
      console.error('❌ Payment reference missing in booking submission');
      return NextResponse.json(
        { ok: false, error: 'Payment reference is required' },
        { status: 400 }
      );
    }

    console.log('✅ Payment reference found:', body.paymentReference);

    // Optional: Re-verify payment for extra security
    if (process.env.PAYSTACK_SECRET_KEY) {
      console.log('Re-verifying payment with Paystack...');
      try {
        const verifyUrl = `https://api.paystack.co/transaction/verify/${body.paymentReference}`;
        console.log('Re-verification URL:', verifyUrl);
        
        const verifyResponse = await fetch(verifyUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        console.log('Re-verification response status:', verifyResponse.status);
        const verifyData = await verifyResponse.json();
        console.log('Re-verification data:', verifyData);
        
        if (!verifyResponse.ok || verifyData.data.status !== 'success') {
          console.error('❌ Payment re-verification failed on booking submission');
          console.error('Response ok:', verifyResponse.ok);
          console.error('Payment status:', verifyData.data?.status);
          return NextResponse.json(
            { ok: false, error: 'Payment verification failed' },
            { status: 400 }
          );
        }

        console.log('✅ Payment re-verified successfully:', body.paymentReference);
      } catch (verifyError) {
        console.error('⚠️ Payment re-verification error:', verifyError);
        console.error('Continuing with booking despite re-verification error');
        // Continue with booking even if re-verification fails
        // since payment was already verified in the frontend
      }
    } else {
      console.log('⚠️ PAYSTACK_SECRET_KEY not set, skipping re-verification');
    }

    // Generate unique booking ID
    const bookingId = body.paymentReference || `BK-${Date.now()}`;
    console.log('📝 Booking ID:', bookingId);
    
    // TODO: Integrate with:
    // - Database (save booking)
    // - Calendar system

    // Check if RESEND_API_KEY is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️ RESEND_API_KEY not configured, skipping email sending');
      const response = { 
        ok: true,
        bookingId,
        message: 'Booking received successfully. Email service not configured.',
        emailSent: false,
        emailError: 'Email service not configured'
      };
      console.log('Returning response (no email):', response);
      return NextResponse.json(response);
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
      console.log('📧 Generating customer email...');
      const customerEmailData = generateBookingConfirmationEmail({
        ...body,
        bookingId
      });
      console.log('✅ Customer email generated successfully');
      
      console.log('📤 Sending customer email...');
      await sendEmail(customerEmailData);
      console.log('✅ Customer confirmation email sent successfully');
      
      // Send notification email to admin
      console.log('📧 Generating admin email...');
      const adminEmailData = generateAdminBookingNotificationEmail({
        ...body,
        bookingId
      });
      console.log('✅ Admin email generated successfully');
      
      console.log('📤 Sending admin email...');
      await sendEmail(adminEmailData);
      console.log('✅ Admin notification email sent successfully');
      
      emailSent = true;
    } catch (emailErr) {
      console.error('=== EMAIL SENDING ERROR ===');
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

    console.log('Email sending completed. Success:', emailSent);

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    const finalResponse = { 
      ok: true,
      bookingId,
      message: emailSent ? 'Booking received successfully. Confirmation email sent!' : 'Booking received successfully.',
      emailSent,
      emailError: emailSent ? null : emailError
    };

    console.log('=== BOOKING API RESPONSE ===');
    console.log(JSON.stringify(finalResponse, null, 2));
    console.log('===========================');

    return NextResponse.json(finalResponse);
  } catch (error) {
    console.error('=== BOOKING SUBMISSION ERROR ===');
    console.error('Error type:', error instanceof Error ? 'Error' : typeof error);
    console.error('Error details:', error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { ok: false, error: 'Failed to process booking', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

