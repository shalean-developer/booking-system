import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail, generateBookingConfirmationEmail } from '@/lib/email';

/**
 * POST handler to resend booking confirmation email
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    console.log('Resending booking confirmation email for ID:', id);

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .or(`payment_reference.eq.${id},id.eq.${id}`)
      .maybeSingle();

    if (bookingError || !booking) {
      console.error('Booking not found for ID:', id);
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Generate and send confirmation email
    try {
      const extrasQuantities = (
        booking.price_snapshot?.extras_quantities ??
        booking.extras_quantities ??
        {}
      ) as Record<string, number>;

      const emailData = generateBookingConfirmationEmail({
        service: booking.service_type as any,
        bedrooms: booking.bedrooms || 0,
        bathrooms: booking.bathrooms || 0,
        extras: (booking.extras as string[]) || [],
        extrasQuantities,
        date: booking.booking_date,
        time: booking.booking_time,
        firstName: booking.customer_name.split(' ')[0] || '',
        lastName: booking.customer_name.split(' ')[1] || '',
        email: booking.customer_email,
        phone: booking.customer_phone || '',
        address: {
          line1: booking.address_line1,
          suburb: booking.address_suburb,
          city: booking.address_city,
        },
        cleaner_id: booking.cleaner_id || 'manual',
        notes: booking.notes || '',
        step: 6,
        frequency: (booking.frequency as any) || 'one-time',
        bookingId: booking.id,
      });

      await sendEmail(emailData);
      
      console.log('Confirmation email resent successfully');
      
      return NextResponse.json({
        ok: true,
        message: 'Confirmation email sent successfully',
      });
    } catch (emailError) {
      console.error('Failed to resend email:', emailError);
      return NextResponse.json(
        { ok: false, error: 'Failed to resend email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error resending booking email:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

