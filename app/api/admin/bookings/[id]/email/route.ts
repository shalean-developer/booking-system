import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Fetch booking details
    const { data: booking } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Send email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0C53ED; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .booking-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${body.subject || 'Booking Update'}</h1>
        </div>
        <div class="content">
          <p>Hello ${booking.customer_name},</p>
          <div class="booking-details">
            <p><strong>Booking ID:</strong> ${booking.id}</p>
            <p><strong>Service:</strong> ${booking.service_type}</p>
            <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString('en-ZA')}</p>
            <p><strong>Time:</strong> ${booking.booking_time}</p>
          </div>
          <div style="margin-top: 20px;">
            ${body.message || ''}
          </div>
          <p>If you have any questions, please contact us.</p>
          <p>Best regards,<br>Shalean Cleaning Services</p>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to: booking.customer_email,
      subject: body.subject || `Update on Booking ${booking.id}`,
      html: emailHtml,
    });

    return NextResponse.json({
      ok: true,
      message: 'Email sent successfully',
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

