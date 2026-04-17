import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { isSafeBookingLookupId } from '@/lib/booking-lookup-id';
import { verifyBookingLookupToken, isBookingLookupTokenConfigured } from '@/lib/booking-lookup-token';
import { SUPPORT_PHONE_DISPLAY } from '@/lib/contact';
import { SITE_SUPPORT_EMAIL } from '@/lib/site-config';

/**
 * GET handler to download booking receipt
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;
    const { searchParams } = new URL(req.url);
    const ct = searchParams.get('ct');

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    if (!isSafeBookingLookupId(id)) {
      return NextResponse.json({ ok: false, error: 'Invalid reference' }, { status: 400 });
    }

    if (isBookingLookupTokenConfigured() && !verifyBookingLookupToken(id, ct)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const r1 = await supabase.from('bookings').select('*').eq('id', id).maybeSingle();
    if (r1.error) {
      return NextResponse.json({ ok: false, error: 'Failed to fetch booking' }, { status: 500 });
    }
    let booking = r1.data;
    if (!booking) {
      const r2 = await supabase.from('bookings').select('*').eq('payment_reference', id).maybeSingle();
      if (r2.error) {
        return NextResponse.json({ ok: false, error: 'Failed to fetch booking' }, { status: 500 });
      }
      booking = r2.data;
    }

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Generate simple receipt HTML
    const receipt = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${booking.payment_reference}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; }
    .header { border-bottom: 2px solid #0C53ED; padding-bottom: 20px; margin-bottom: 20px; }
    .company { font-size: 24px; font-weight: bold; color: #0C53ED; }
    .invoice-title { color: #666; }
    .details { margin: 20px 0; }
    .detail-row { margin: 8px 0; }
    .label { font-weight: bold; display: inline-block; width: 150px; }
    .total { font-size: 24px; font-weight: bold; color: #0C53ED; margin-top: 20px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">Shalean Cleaning Services</div>
    <div class="invoice-title">Booking Receipt</div>
  </div>

  <div class="details">
    <div class="detail-row">
      <span class="label">Booking Reference:</span> ${booking.payment_reference}
    </div>
    <div class="detail-row">
      <span class="label">Service Date:</span> ${booking.booking_date}
    </div>
    <div class="detail-row">
      <span class="label">Service Time:</span> ${booking.booking_time}
    </div>
    <div class="detail-row">
      <span class="label">Service Type:</span> ${booking.service_type}
    </div>
    <div class="detail-row">
      <span class="label">Customer:</span> ${booking.customer_name}
    </div>
    <div class="detail-row">
      <span class="label">Email:</span> ${booking.customer_email}
    </div>
    <div class="detail-row">
      <span class="label">Phone:</span> ${booking.customer_phone || 'N/A'}
    </div>
    <div class="detail-row">
      <span class="label">Address:</span> ${booking.address_line1}, ${booking.address_suburb}, ${booking.address_city}
    </div>
  </div>

  <div class="total">
    Total Amount: R${(booking.total_amount / 100).toFixed(2)}
  </div>

  <div class="footer">
    <p>Thank you for choosing Shalean Cleaning Services!</p>
    <p>For support, contact us at ${SUPPORT_PHONE_DISPLAY} or ${SITE_SUPPORT_EMAIL}</p>
  </div>
</body>
</html>
    `.trim();

    // Return as HTML or PDF
    return new Response(receipt, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="receipt-${id}.html"`,
      },
    });
  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
