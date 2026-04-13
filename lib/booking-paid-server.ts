/**
 * Finalize paid bookings on the Next.js server (local dev + redirect verify).
 * Mirrors supabase/functions/_shared/booking-paid.ts + Edge verify-payment.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createZohoBooksInvoiceServer } from '@/lib/zoho-books-server';
import { sendBookingPaidConfirmationEmail, validateResendConfig } from '@/lib/email';

export type BookingPaidRow = {
  id: string;
  cleaner_id: string | null;
  booking_date: string | null;
  booking_time: string | null;
  expected_end_time?: string | null;
  service_type: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone?: string | null;
  address_line1?: string | null;
  address_suburb?: string | null;
  address_city?: string | null;
  total_amount: number | null;
  price?: number | null;
  tip_amount?: number | null;
  service_fee?: number | null;
  frequency_discount?: number | null;
  frequency?: string | null;
  surge_pricing_applied?: boolean | null;
  surge_amount?: number | null;
  requires_team?: boolean | null;
  notes?: string | null;
  price_snapshot?: unknown;
  status: string | null;
  payment_reference: string | null;
  paystack_ref: string | null;
  zoho_invoice_id: string | null;
  payment_status?: string | null;
};

const SELECT_COLS =
  'id, cleaner_id, booking_date, booking_time, expected_end_time, service_type, customer_name, customer_email, customer_phone, address_line1, address_suburb, address_city, total_amount, price, tip_amount, service_fee, frequency_discount, frequency, surge_pricing_applied, surge_amount, requires_team, notes, price_snapshot, status, payment_reference, paystack_ref, zoho_invoice_id, payment_status';

export async function paystackVerifyTransaction(
  secretKey: string,
  reference: string,
): Promise<{ ok: boolean; amountKobo: number }> {
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    },
  );
  const data = (await res.json()) as { data?: { status?: string; amount?: number } };
  if (!res.ok || !data?.data) {
    return { ok: false, amountKobo: 0 };
  }
  const d = data.data;
  const ok = d.status === 'success';
  const amountKobo = Number(d.amount);
  return { ok, amountKobo: Number.isFinite(amountKobo) ? amountKobo : 0 };
}

export async function fetchBookingForPaymentVerification(
  supabase: SupabaseClient,
  reference: string,
): Promise<BookingPaidRow | null> {
  if (reference.startsWith('booking-')) {
    const id = reference.slice('booking-'.length);
    const { data: byPref } = await supabase
      .from('bookings')
      .select(SELECT_COLS)
      .eq('id', id)
      .maybeSingle();
    if (byPref) return byPref as BookingPaidRow;
  }

  const { data: byId } = await supabase
    .from('bookings')
    .select(SELECT_COLS)
    .eq('id', reference)
    .maybeSingle();
  if (byId) return byId as BookingPaidRow;

  const { data: byPaystack } = await supabase
    .from('bookings')
    .select(SELECT_COLS)
    .eq('paystack_ref', reference)
    .maybeSingle();
  if (byPaystack) return byPaystack as BookingPaidRow;

  const { data: byLegacy } = await supabase
    .from('bookings')
    .select(SELECT_COLS)
    .eq('payment_reference', reference)
    .maybeSingle();

  return (byLegacy as BookingPaidRow) ?? null;
}

function referenceMatchesBooking(booking: BookingPaidRow, reference: string): boolean {
  if (reference === booking.id || reference === `booking-${booking.id}`) return true;
  if (booking.paystack_ref && reference === booking.paystack_ref) return true;
  if (booking.payment_reference && reference === booking.payment_reference) return true;
  return false;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function sendAdminNewBookingPaidEmail(params: {
  booking: BookingPaidRow;
  amountZar: number;
  paymentReference: string;
  zohoInvoiceId: string | null;
}): Promise<void> {
  const admin = process.env.ADMIN_EMAIL?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const sender = process.env.SENDER_EMAIL?.trim() || 'noreply@shalean.co.za';
  if (!admin || !apiKey) return;
  const bookingId = params.booking.id;
  const customerName = params.booking.customer_name || 'Customer';
  const serviceName = params.booking.service_type || 'Cleaning';
  const dateText = params.booking.booking_date || 'N/A';
  const timeText = params.booking.booking_time || 'N/A';
  const endText = params.booking.expected_end_time || null;
  const frequencyText = params.booking.frequency || 'one-time';
  const cleanerText =
    params.booking.cleaner_id === 'manual'
      ? 'Manual assignment requested'
      : params.booking.cleaner_id || 'Not assigned yet';
  const addressText = [params.booking.address_line1, params.booking.address_suburb, params.booking.address_city]
    .filter(Boolean)
    .join(', ') || 'N/A';

  const snapshot = params.booking.price_snapshot as
    | {
        service?: { bedrooms?: number; bathrooms?: number; numberOfCleaners?: number };
        extras?: string[];
        extras_quantities?: Record<string, number>;
      }
    | undefined;
  const bedrooms = snapshot?.service?.bedrooms;
  const bathrooms = snapshot?.service?.bathrooms;
  const cleaners = snapshot?.service?.numberOfCleaners;
  const extras = Array.isArray(snapshot?.extras) ? snapshot.extras : [];
  const extrasQuantities = snapshot?.extras_quantities || {};
  const extrasHtml = extras.length
    ? extras
        .map((name) => {
          const qty = Number(extrasQuantities[name] ?? 1);
          return `<li style="margin: 4px 0;">${escapeHtml(name)}${qty > 1 ? ` (x${qty})` : ''}</li>`;
        })
        .join('')
    : '<li style="margin: 4px 0;">None</li>';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Shalean Cleaning <${sender}>`,
      to: [admin],
      subject: `Payment received • ${bookingId} • ${customerName}`,
      html: `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden;">
          <tr>
            <td style="padding: 24px; border-bottom: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700;">Shalean Admin Alert</p>
              <h1 style="margin: 0; color: #111827; font-size: 22px;">New Paid Booking</h1>
              <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 14px;">A customer payment has been confirmed.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 22px 24px;">
              <h2 style="margin: 0 0 14px 0; color: #111827; font-size: 16px;">Booking Summary</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Booking ID</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(bookingId)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Customer</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(customerName)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Customer email</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(params.booking.customer_email || 'N/A')}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Customer phone</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(params.booking.customer_phone || 'N/A')}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Service</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(serviceName)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Date</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(dateText)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Time</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(timeText)}${endText ? ` - ${escapeHtml(endText)}` : ''}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Address</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(addressText)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Frequency</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(frequencyText)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Cleaner selection</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(cleanerText)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Amount paid</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 700;">R ${params.amountZar.toFixed(2)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Service fee</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">R ${((params.booking.service_fee || 0) / 100).toFixed(2)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Tip amount</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">R ${((params.booking.tip_amount || 0) / 100).toFixed(2)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Frequency discount</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">R ${((params.booking.frequency_discount || 0) / 100).toFixed(2)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Surge pricing</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${params.booking.surge_pricing_applied ? `Yes (R ${((params.booking.surge_amount || 0) / 100).toFixed(2)})` : 'No'}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Payment reference</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${escapeHtml(params.paymentReference)}</td></tr>
                <tr><td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Invoice ID</td><td style="padding: 10px 0; text-align: right; color: #111827; font-size: 14px; font-weight: 600;">${params.zohoInvoiceId ? escapeHtml(params.zohoInvoiceId) : 'Pending'}</td></tr>
              </table>
              <h2 style="margin: 18px 0 10px 0; color: #111827; font-size: 16px;">Service Details Chosen</h2>
              <p style="margin: 0 0 8px 0; color: #4b5563; font-size: 14px;">Bedrooms: <strong>${bedrooms ?? 'N/A'}</strong> &nbsp;|&nbsp; Bathrooms: <strong>${bathrooms ?? 'N/A'}</strong> &nbsp;|&nbsp; Cleaners: <strong>${cleaners ?? 1}</strong></p>
              <p style="margin: 0; color: #4b5563; font-size: 14px;">Extras selected:</p>
              <ul style="margin: 8px 0 0 18px; padding: 0; color: #111827; font-size: 14px;">
                ${extrasHtml}
              </ul>
              ${
                params.booking.notes?.trim()
                  ? `<h2 style="margin: 18px 0 10px 0; color: #111827; font-size: 16px;">Customer Notes</h2><p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">${escapeHtml(params.booking.notes.trim())}</p>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }),
  });
}

export async function finalizePaidBookingServer(params: {
  supabase: SupabaseClient;
  booking: BookingPaidRow;
  reference: string;
  paystackAmountKobo: number;
}): Promise<{ ok: boolean; duplicate?: boolean; zoho_invoice_id?: string | null; error?: string }> {
  const { supabase, booking, reference, paystackAmountKobo } = params;

  console.log('🔥 PAYMENT SUCCESS FLOW STARTED', {
    bookingId: booking.id,
    status: booking.status,
    payment_status: booking.payment_status,
  });

  const expectedKobo = Math.round(Number(booking.total_amount ?? 0));
  if (!Number.isFinite(paystackAmountKobo) || paystackAmountKobo !== expectedKobo) {
    console.log('❌ finalize: amount mismatch, abort');
    return {
      ok: false,
      error: `Amount mismatch: expected ${expectedKobo} kobo, got ${paystackAmountKobo}`,
    };
  }

  if (booking.status === 'paid') {
    console.log('⚠️ Already processed — continuing for debug');
    if (!booking.zoho_invoice_id) {
      try {
        const amountZar = expectedKobo / 100;
        console.log('🧾 Missing Zoho invoice on paid booking — retrying create...', {
          bookingId: booking.id,
        });
        const created = await createZohoBooksInvoiceServer({
          customerName: booking.customer_name || 'Customer',
          customerEmail: booking.customer_email,
          customerPhone: booking.customer_phone,
          customerAddress: {
            line1: booking.address_line1,
            suburb: booking.address_suburb,
            city: booking.address_city,
          },
          serviceName: booking.service_type || 'Cleaning',
          amountZar,
          bookingId: booking.id,
          paystackReference: reference,
        });
        if (created) {
          await supabase
            .from('bookings')
            .update({
              zoho_invoice_id: created,
              updated_at: new Date().toISOString(),
            })
            .eq('id', booking.id);
          booking.zoho_invoice_id = created;
          console.log('✅ Zoho invoice recovered for paid booking', { zohoId: created });
        }
      } catch (e) {
        console.error('❌ Zoho retry failed for paid booking (continuing):', e);
      }
    }
    if (booking.customer_email?.trim()) {
      try {
        console.log('📨 CALLING EMAIL NOW...');
        const to = booking.customer_email.trim();
        const sendResult = await sendBookingPaidConfirmationEmail({
          to,
          customerName: booking.customer_name || 'Customer',
          serviceName: booking.service_type || 'Cleaning',
          amountZar: expectedKobo / 100,
          bookingId: booking.id,
          zohoInvoiceId: booking.zoho_invoice_id ?? null,
          paymentReference: reference,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          addressLine1: booking.address_line1,
          addressSuburb: booking.address_suburb,
          addressCity: booking.address_city,
        });
        if (!sendResult.ok) {
          throw new Error(sendResult.error || 'Failed to send booking confirmation email');
        }
        console.log('✅ EMAIL CALL FINISHED', { providerId: sendResult.providerId });
      } catch (e) {
        console.error('❌ EMAIL FAILED (duplicate path):', e);
      }
    }
    return { ok: true, duplicate: true, zoho_invoice_id: booking.zoho_invoice_id };
  }

  const unpaid =
    booking.status === 'pending' && !booking.payment_reference && !booking.paystack_ref;

  if (!unpaid) {
    console.log('❌ finalize: booking not awaiting payment', {
      bookingId: booking.id,
      status: booking.status,
      payment_reference: booking.payment_reference,
      paystack_ref: booking.paystack_ref,
    });
    return { ok: false, error: 'Booking is not awaiting payment' };
  }

  let zohoId: string | null = booking.zoho_invoice_id;
  if (!zohoId) {
    try {
      const amountZar = expectedKobo / 100;
      console.log('🧾 Creating Zoho invoice...', { bookingId: booking.id });
      const created = await createZohoBooksInvoiceServer({
        customerName: booking.customer_name || 'Customer',
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        customerAddress: {
          line1: booking.address_line1,
          suburb: booking.address_suburb,
          city: booking.address_city,
        },
        serviceName: booking.service_type || 'Cleaning',
        amountZar,
        bookingId: booking.id,
        paystackReference: reference,
      });
      zohoId = created;
      console.log('✅ Zoho invoice created', { zohoId });
    } catch (e) {
      console.error('Zoho failed but continuing...', e);
      zohoId = null;
    }
  } else {
    console.log('✅ Zoho invoice already on booking, skipping create', { zohoId });
  }

  const amountZar = expectedKobo / 100;

  const { error: upErr } = await supabase
    .from('bookings')
    .update({
      status: 'paid',
      payment_status: 'success',
      paystack_ref: reference,
      payment_reference: reference,
      zoho_invoice_id: zohoId ?? null,
      price: amountZar,
      updated_at: new Date().toISOString(),
    })
    .eq('id', booking.id);

  if (upErr) {
    console.error('[finalizePaidBookingServer] DB update failed', upErr);
    return { ok: false, error: upErr.message };
  }

  console.log('🔥 Payment success reached (DB updated)', { bookingId: booking.id });

  console.log('📨 About to send email...');

  if (booking.customer_email?.trim()) {
    const to = booking.customer_email.trim();
    console.log('📨 About to send email to:', to);

    const cfg = validateResendConfig();
    if (!cfg.ok) {
      console.error('🚨 Resend not configured — email will not send:', cfg.error);
      await supabase.from('email_send_logs').insert({
        booking_id: booking.id,
        template: 'booking_paid',
        recipient: to,
        status: 'failed',
        provider_id: null,
        error_message: cfg.error,
      });
    } else {
      try {
        console.log('📨 CALLING EMAIL NOW...');
        const sendResult = await sendBookingPaidConfirmationEmail({
          to,
          customerName: booking.customer_name || 'Customer',
          serviceName: booking.service_type || 'Cleaning',
          amountZar,
          bookingId: booking.id,
          zohoInvoiceId: zohoId,
          paymentReference: reference,
          bookingDate: booking.booking_date,
          bookingTime: booking.booking_time,
          addressLine1: booking.address_line1,
          addressSuburb: booking.address_suburb,
          addressCity: booking.address_city,
        });
        if (!sendResult.ok) {
          throw new Error(sendResult.error || 'Failed to send booking confirmation email');
        }
        console.log('✅ EMAIL CALL FINISHED', { providerId: sendResult.providerId });
        await supabase.from('email_send_logs').insert({
          booking_id: booking.id,
          template: 'booking_paid',
          recipient: to,
          status: 'sent',
          provider_id: sendResult.providerId ?? null,
          error_message: null,
        });
      } catch (err) {
        console.error('❌ EMAIL FAILED:', err);
        await supabase.from('email_send_logs').insert({
          booking_id: booking.id,
          template: 'booking_paid',
          recipient: to,
          status: 'failed',
          provider_id: null,
          error_message: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } else {
    console.warn('[finalizePaidBookingServer] No customer email — skipping Resend');
  }

  await sendAdminNewBookingPaidEmail({
    booking,
    amountZar,
    paymentReference: reference,
    zohoInvoiceId: zohoId,
  });

  return { ok: true, zoho_invoice_id: zohoId };
}

export async function resolveBookingForVerify(
  supabase: SupabaseClient,
  referenceParam: string,
  bookingIdHint: string | null,
): Promise<{ booking: BookingPaidRow | null; error?: string }> {
  let booking: BookingPaidRow | null = null;

  if (bookingIdHint) {
    const { data, error } = await supabase
      .from('bookings')
      .select(SELECT_COLS)
      .eq('id', bookingIdHint)
      .maybeSingle();
    if (error) {
      return { booking: null, error: error.message };
    }
    booking = data as BookingPaidRow | null;
  }

  if (!booking) {
    booking = await fetchBookingForPaymentVerification(supabase, referenceParam);
  }

  if (!booking) {
    return { booking: null };
  }

  if (!referenceMatchesBooking(booking, referenceParam)) {
    return { booking: null, error: 'reference must match this booking' };
  }

  return { booking };
}
