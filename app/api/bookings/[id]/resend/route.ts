import { NextResponse } from 'next/server';
import { supabase as supabaseAnon } from '@/lib/supabase';
import { createServiceClient } from '@/lib/supabase-server';
import { sendEmail, generateBookingConfirmationEmail } from '@/lib/email';
import { generateManageToken } from '@/lib/manage-booking-token';

function getSupabaseForResend() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return createServiceClient();
  }
  return supabaseAnon;
}

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

    const supabase = getSupabaseForResend();

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
      
      // Extract bedrooms and bathrooms from price_snapshot (they're not stored as separate columns)
      const priceSnapshot = booking.price_snapshot as any;
      const bedrooms = priceSnapshot?.bedrooms || priceSnapshot?.service?.bedroom || 0;
      const bathrooms = priceSnapshot?.bathrooms || priceSnapshot?.service?.bathroom || 0;

      // Convert total_amount from cents to rands for email
      const totalAmountRands = booking.total_amount ? booking.total_amount / 100 : undefined;
      
      // Fetch cleaner name if cleaner_id exists
      let cleanerName: string | undefined;
      if (booking.cleaner_id && booking.cleaner_id !== 'manual') {
        try {
          const { data: cleaner } = await supabase
            .from('cleaners')
            .select('name')
            .eq('id', booking.cleaner_id)
            .maybeSingle();
          cleanerName = cleaner?.name;
        } catch (error) {
          console.error('Failed to fetch cleaner name:', error);
        }
      }
      
      const fullName = (booking.customer_name ?? '').trim() || 'Customer';
      const nameParts = fullName.split(/\s+/);

      let manageToken = (booking as { manage_token?: string | null }).manage_token;
      if (!manageToken || String(manageToken).length < 32) {
        manageToken = generateManageToken();
        await supabase
          .from('bookings')
          .update({ manage_token: manageToken, updated_at: new Date().toISOString() })
          .eq('id', booking.id);
      }

      const emailData = await generateBookingConfirmationEmail({
        service: booking.service_type as any,
        bedrooms,
        bathrooms,
        extras: (booking.extras as string[]) || [],
        extrasQuantities,
        date: booking.booking_date,
        time: booking.booking_time,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
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
        totalAmount: totalAmountRands, // Pass actual total amount from database (converted from cents to rands)
        cleanerName,
        paymentReference:
          (booking.payment_reference as string | null) ||
          (booking.paystack_ref as string | null) ||
          undefined,
        inferredPaid: booking.status === 'paid',
        equipment_required: (booking as { equipment_required?: boolean }).equipment_required,
        equipment_fee: (booking as { equipment_fee?: number }).equipment_fee,
        manageToken,
      });

      if (!process.env.RESEND_API_KEY?.trim()) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'RESEND_API_KEY is not set on the server. Add it to .env.local (and Vercel/hosting env) and restart.',
          },
          { status: 503 },
        );
      }

      await sendEmail(emailData);

      console.log('Confirmation email resent successfully');

      return NextResponse.json({
        ok: true,
        message: 'Confirmation email sent successfully',
      });
    } catch (emailError) {
      console.error('Failed to resend email:', emailError);
      const detail = emailError instanceof Error ? emailError.message : 'Failed to resend email';
      return NextResponse.json({ ok: false, error: detail }, { status: 500 });
    }
  } catch (error) {
    console.error('Error resending booking email:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

