import { NextResponse } from 'next/server';
import { sendEmail, generateBookingConfirmationEmail, generateAdminBookingNotificationEmail } from '@/lib/email';
import { BookingState } from '@/types/booking';

/**
 * API endpoint to handle booking submissions
 * Currently logs to console - integrate with Paystack/email service later
 */
export async function POST(req: Request) {
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

    // Send confirmation emails to customer and admin
    try {
      // Send confirmation email to customer
      const customerEmailData = generateBookingConfirmationEmail({
        ...body,
        bookingId
      });
      
      await sendEmail(customerEmailData);
      console.log('Customer confirmation email sent successfully');
      
      // Send notification email to admin
      const adminEmailData = generateAdminBookingNotificationEmail({
        ...body,
        bookingId
      });
      
      await sendEmail(adminEmailData);
      console.log('Admin notification email sent successfully');
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the entire request if email fails
      // In production, you might want to queue this for retry
    }

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({ 
      ok: true,
      bookingId,
      message: 'Booking received successfully. Confirmation email sent!'
    });
  } catch (error) {
    console.error('Booking submission error:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to process booking' },
      { status: 500 }
    );
  }
}

