import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { applyLoyaltyAndReferralRewards } from './loyalty-rewards.ts';
import { uploadBookingInvoicePdf } from './invoice-pdf-storage.ts';
import { createZohoBooksInvoice, fetchZohoInvoiceNumber, fetchZohoInvoicePdf } from './zoho-books.ts';
import { toZohoInvoiceBookingInput } from './zoho-invoice-payload.ts';
import { sendAdminNewBookingEmail, sendBookingPaidEmail } from './resend-mail.ts';

/** 64-char hex; mirrors Next.js `generateManageToken()`. */
function generateManageToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export type BookingRow = {
  id: string;
  customer_id?: string | null;
  service_type: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone?: string | null;
  total_amount: number | null;
  points_redeemed?: number | null;
  status: string | null;
  payment_reference: string | null;
  paystack_ref: string | null;
  zoho_invoice_id: string | null;
  payment_status?: string | null;
  booking_date?: string | null;
  booking_time?: string | null;
  address_line1?: string | null;
  address_suburb?: string | null;
  address_city?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  extras?: string[] | null;
  notes?: string | null;
  tip_amount?: number | null;
  service_fee?: number | null;
  frequency_discount?: number | null;
  frequency?: string | null;
  surge_amount?: number | null;
  price_snapshot?: unknown;
  equipment_required?: boolean | null;
  equipment_fee?: number | null;
  manage_token?: string | null;
  invoice_url?: string | null;
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

  const expectedKobo = Math.round(Number(booking.total_amount ?? 0));
  const amountDelta = Math.abs(paystackAmountKobo - expectedKobo);
  if (!Number.isFinite(paystackAmountKobo) || amountDelta > 1) {
    return {
      ok: false,
      error: `Amount mismatch: expected ${expectedKobo} minor units, got ${paystackAmountKobo} (Δ ${amountDelta})`,
    };
  }

  // Webhook may finalize before this runs; refs should match but amount+Paystack verify is authoritative.
  if (booking.status === 'paid') {
    return { ok: true, duplicate: true, zoho_invoice_id: booking.zoho_invoice_id };
  }

  const st = (booking.status || '').toLowerCase();
  if (st !== 'pending') {
    return {
      ok: false,
      error: `Booking is not awaiting payment (status: ${booking.status || 'unknown'})`,
    };
  }
  const ref = String(reference).trim();
  const pref = (booking.payment_reference || '').trim();
  const pstack = (booking.paystack_ref || '').trim();
  const conflictingPayment =
    (pref.length > 0 && pref !== ref) || (pstack.length > 0 && pstack !== ref);
  if (conflictingPayment) {
    return {
      ok: false,
      error:
        'This booking already has a different payment reference. Contact support if you were charged.',
    };
  }

  let zohoId: string | null = booking.zoho_invoice_id;
  if (!zohoId) {
    try {
      zohoId = await createZohoBooksInvoice({
        booking: toZohoInvoiceBookingInput(booking),
      });
    } catch (e) {
      // Payment is already verified; do not block confirmation emails or DB update on accounting API failure.
      console.error('[finalizePaidBooking] Zoho error (continuing without invoice)', e);
      zohoId = null;
    }
  }

  let invoiceUrl: string | null = booking.invoice_url ?? null;
  let invoicePdf: Uint8Array | null = null;
  let zohoInvoiceNumber: string | null = null;
  if (zohoId) {
    zohoInvoiceNumber = await fetchZohoInvoiceNumber(zohoId);
    const pdf = await fetchZohoInvoicePdf(zohoId);
    if (pdf) {
      invoicePdf = pdf;
      const url = await uploadBookingInvoicePdf(supabase, booking.id, pdf);
      if (url) invoiceUrl = url;
    }
  }

  const amountZar = expectedKobo / 100;

  const existingTok =
    typeof booking.manage_token === 'string' && booking.manage_token.trim().length >= 64
      ? booking.manage_token.trim()
      : '';
  const manageTokenPersist = existingTok || generateManageToken();

  const paidUpdate = {
    status: 'paid',
    payment_status: 'success',
    paystack_ref: reference,
    payment_reference: reference,
    zoho_invoice_id: zohoId ?? null,
    invoice_url: invoiceUrl ?? null,
    price: amountZar,
    updated_at: new Date().toISOString(),
    manage_token: manageTokenPersist,
  } as const;

  let { error: upErr } = await supabase.from('bookings').update(paidUpdate).eq('id', booking.id);

  let emailManageToken: string | undefined = manageTokenPersist;
  if (upErr && /manage_token/.test(upErr.message) && /does not exist/i.test(upErr.message)) {
    emailManageToken = undefined;
    const retry = await supabase
      .from('bookings')
      .update({
        status: 'paid',
        payment_status: 'success',
        paystack_ref: reference,
        payment_reference: reference,
        zoho_invoice_id: zohoId ?? null,
        invoice_url: invoiceUrl ?? null,
        price: amountZar,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);
    upErr = retry.error;
    console.warn('[finalizePaidBooking] Retried without manage_token — apply bookings.manage_token migration');
  }

  if (upErr) {
    console.error('[finalizePaidBooking] DB update failed', upErr);
    return {
      ok: false,
      error: upErr.message?.trim() || 'Could not save payment confirmation. Please contact support.',
    };
  }

  if (booking.customer_email) {
    const emailResult = await sendBookingPaidEmail({
      to: booking.customer_email,
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
      equipment_required: booking.equipment_required === true,
      equipment_fee:
        typeof booking.equipment_fee === 'number' && Number.isFinite(booking.equipment_fee)
          ? booking.equipment_fee
          : undefined,
      manageToken: emailManageToken,
      invoiceUrl,
      invoicePdf,
      zohoInvoiceNumber,
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

  try {
    await applyLoyaltyAndReferralRewards({
      supabase,
      bookingId: booking.id,
      customerId: booking.customer_id ?? null,
      amountZar,
      pointsRedeemed: Math.max(0, Math.floor(Number(booking.points_redeemed) || 0)),
    });
  } catch (e) {
    console.error('[loyalty] applyLoyaltyAndReferralRewards', e);
  }

  return { ok: true, zoho_invoice_id: zohoId };
}

export async function fetchBookingByPaystackReference(
  supabase: SupabaseClient,
  reference: string,
): Promise<BookingRow | null> {
  const selectCols =
    'id, customer_id, points_redeemed, service_type, customer_name, customer_email, customer_phone, total_amount, status, payment_reference, paystack_ref, zoho_invoice_id, invoice_url, payment_status, booking_date, booking_time, address_line1, address_suburb, address_city, notes, tip_amount, service_fee, frequency_discount, frequency, surge_amount, price_snapshot, equipment_required, equipment_fee, manage_token';

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
