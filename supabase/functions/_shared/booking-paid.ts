import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { createZohoBooksInvoice } from './zoho-books.ts';
import { sendAdminNewBookingEmail, sendBookingPaidEmail } from './resend-mail.ts';

export type BookingRow = {
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

/**
 * Pay-later flow only: booking starts as pending with no Paystack reference.
 * Idempotent when already paid with the same reference.
 */
export async function finalizePaidBooking(params: {
  supabase: SupabaseClient;
  booking: BookingRow;
  reference: string;
  paystackAmountKobo: number;
}): Promise<{ ok: boolean; duplicate?: boolean; zoho_invoice_id?: string | null; error?: string }> {
  const { supabase, booking, reference, paystackAmountKobo } = params;

  if (
    booking.status === 'paid' &&
    (booking.paystack_ref === reference || booking.payment_reference === reference)
  ) {
    return { ok: true, duplicate: true, zoho_invoice_id: booking.zoho_invoice_id };
  }

  const expectedKobo = Math.round(Number(booking.total_amount ?? 0));
  if (!Number.isFinite(paystackAmountKobo) || paystackAmountKobo !== expectedKobo) {
    return {
      ok: false,
      error: `Amount mismatch: expected ${expectedKobo} kobo, got ${paystackAmountKobo}`,
    };
  }

  const unpaid =
    booking.status === 'pending' && !booking.payment_reference && !booking.paystack_ref;

  if (!unpaid) {
    return { ok: false, error: 'Booking is not awaiting payment' };
  }

  let zohoId: string | null = booking.zoho_invoice_id;
  if (!zohoId) {
    try {
      zohoId = await createZohoBooksInvoice({
        customerName: booking.customer_name || 'Customer',
        customerEmail: booking.customer_email,
        serviceName: booking.service_type || 'Cleaning',
        amountZar: expectedKobo / 100,
        bookingId: booking.id,
      });
    } catch (e) {
      console.error('[finalizePaidBooking] Zoho error', e);
      return { ok: false, error: e instanceof Error ? e.message : 'Zoho invoice failed' };
    }
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
    console.error('[finalizePaidBooking] DB update failed', upErr);
    return { ok: false, error: upErr.message };
  }

  if (booking.customer_email) {
    const emailResult = await sendBookingPaidEmail({
      to: booking.customer_email,
      customerName: booking.customer_name || 'Customer',
      serviceName: booking.service_type || 'Cleaning',
      amountZar,
      bookingId: booking.id,
      zohoInvoiceId: zohoId,
    });

    await supabase.from('email_send_logs').insert({
      booking_id: booking.id,
      template: 'booking_paid',
      recipient: booking.customer_email,
      status: emailResult.ok ? 'sent' : 'failed',
      provider_id: emailResult.providerId ?? null,
      error_message: emailResult.ok ? null : (emailResult.error ?? 'unknown'),
    });
  } else {
    console.warn('[finalizePaidBooking] No customer email — skipping Resend');
  }

  await sendAdminNewBookingEmail({
    bookingId: booking.id,
    customerName: booking.customer_name || 'Customer',
    serviceName: booking.service_type || 'Cleaning',
    amountZar,
  });

  return { ok: true, zoho_invoice_id: zohoId };
}

export async function fetchBookingByPaystackReference(
  supabase: SupabaseClient,
  reference: string,
): Promise<BookingRow | null> {
  const selectCols =
    'id, service_type, customer_name, customer_email, total_amount, status, payment_reference, paystack_ref, zoho_invoice_id, payment_status';

  if (reference.startsWith('booking-')) {
    const id = reference.slice('booking-'.length);
    const { data: byPref } = await supabase.from('bookings').select(selectCols).eq('id', id).maybeSingle();
    if (byPref) return byPref as BookingRow;
  }

  const { data: byId } = await supabase
    .from('bookings')
    .select(selectCols)
    .eq('id', reference)
    .maybeSingle();
  if (byId) return byId as BookingRow;

  const { data: byPaystack } = await supabase
    .from('bookings')
    .select(selectCols)
    .eq('paystack_ref', reference)
    .maybeSingle();
  if (byPaystack) return byPaystack as BookingRow;

  const { data: byLegacy } = await supabase
    .from('bookings')
    .select(selectCols)
    .eq('payment_reference', reference)
    .maybeSingle();

  return (byLegacy as BookingRow) ?? null;
}
