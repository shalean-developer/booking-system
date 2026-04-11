/**
 * Finalize paid bookings on the Next.js server (local dev + redirect verify).
 * Mirrors supabase/functions/_shared/booking-paid.ts + Edge verify-payment.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createZohoBooksInvoiceServer } from '@/lib/zoho-books-server';
import { sendInvoiceEmail, validateResendConfig } from '@/lib/email';

export type BookingPaidRow = {
  id: string;
  service_type: string | null;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: number | null;
  status: string | null;
  payment_reference: string | null;
  paystack_ref: string | null;
  zoho_invoice_id: string | null;
  payment_status?: string | null;
};

const SELECT_COLS =
  'id, service_type, customer_name, customer_email, total_amount, status, payment_reference, paystack_ref, zoho_invoice_id, payment_status';

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

async function sendAdminNewBookingPaidEmail(params: {
  bookingId: string;
  customerName: string;
  serviceName: string;
  amountZar: number;
}): Promise<void> {
  const admin = process.env.ADMIN_EMAIL?.trim();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const sender = process.env.SENDER_EMAIL?.trim() || 'noreply@shalean.co.za';
  if (!admin || !apiKey) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Shalean Cleaning <${sender}>`,
      to: [admin],
      subject: `[New paid booking] ${params.bookingId}`,
      html: `<p><strong>${params.customerName}</strong> paid R ${params.amountZar.toFixed(
        2,
      )} for ${params.serviceName} — ${params.bookingId}</p>`,
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
    if (booking.customer_email?.trim()) {
      try {
        console.log('📨 CALLING EMAIL NOW...');
        await sendInvoiceEmail(booking.customer_email.trim());
        console.log('✅ EMAIL CALL FINISHED');
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
        const data = await sendInvoiceEmail(to);
        console.log('✅ EMAIL CALL FINISHED', { providerId: (data as { id?: string })?.id });
        await supabase.from('email_send_logs').insert({
          booking_id: booking.id,
          template: 'booking_paid',
          recipient: to,
          status: 'sent',
          provider_id: (data as { id?: string } | undefined)?.id ?? null,
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
    bookingId: booking.id,
    customerName: booking.customer_name || 'Customer',
    serviceName: booking.service_type || 'Cleaning',
    amountZar,
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
