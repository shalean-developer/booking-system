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

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

/** Winner may persist `paid` before `zoho_invoice_id`; losers poll to avoid duplicate Zoho creates. */
async function pollZohoInvoiceId(
  supabase: SupabaseClient,
  bookingId: string,
  maxAttempts = 15,
  delayMs = 150,
): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await supabase
      .from('bookings')
      .select('zoho_invoice_id')
      .eq('id', bookingId)
      .maybeSingle();
    const z =
      typeof data?.zoho_invoice_id === 'string' && data.zoho_invoice_id.trim()
        ? data.zoho_invoice_id.trim()
        : null;
    if (z) return z;
    if (i < maxAttempts - 1) await sleep(delayMs);
  }
  return null;
}

const BOOKING_SELECT_FULL =
  'id, customer_id, points_redeemed, service_type, customer_name, customer_email, customer_phone, total_amount, status, payment_reference, paystack_ref, zoho_invoice_id, invoice_url, payment_status, booking_date, booking_time, address_line1, address_suburb, address_city, notes, tip_amount, service_fee, frequency_discount, frequency, surge_amount, price_snapshot, equipment_required, equipment_fee, manage_token';

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
 *
 * Uses the same atomic `pending` claim as Next.js `fulfillPaidBooking` so webhook + Edge verify
 * cannot each create a Zoho invoice for one payment.
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

  const amountZar = expectedKobo / 100;

  if ((booking.status || '').toLowerCase() === 'paid') {
    let zid = booking.zoho_invoice_id;
    if (!zid) zid = await pollZohoInvoiceId(supabase, booking.id);
    return { ok: true, duplicate: true, zoho_invoice_id: zid };
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

  const existingTok =
    typeof booking.manage_token === 'string' && booking.manage_token.trim().length >= 64
      ? booking.manage_token.trim()
      : '';
  const manageTokenPersist = existingTok || generateManageToken();

  const baseClaim = {
    status: 'paid' as const,
    payment_status: 'success' as const,
    paystack_ref: reference,
    payment_reference: reference,
    price: amountZar,
    updated_at: new Date().toISOString(),
    manage_token: manageTokenPersist,
  };

  let claimedRow: Record<string, unknown> | null = null;
  let claimErr: { message?: string } | null = null;

  const tryClaim = async (includeManageToken: boolean) => {
    const payload = includeManageToken
      ? baseClaim
      : (() => {
          const { manage_token: _m, ...rest } = baseClaim;
          return rest;
        })();
    return supabase
      .from('bookings')
      .update(payload)
      .eq('id', booking.id)
      .eq('status', 'pending')
      .select()
      .maybeSingle();
  };

  {
    const { data, error } = await tryClaim(true);
    if (error && /manage_token/.test(error.message || '') && /does not exist/i.test(error.message || '')) {
      const second = await tryClaim(false);
      claimedRow = (second.data as Record<string, unknown> | null) ?? null;
      claimErr = second.error;
    } else {
      claimedRow = (data as Record<string, unknown> | null) ?? null;
      claimErr = error;
    }
  }

  if (claimErr && !claimedRow) {
    console.error('[finalizePaidBooking] atomic claim failed', claimErr);
    return {
      ok: false,
      error: claimErr.message?.trim() || 'Could not confirm payment. Please contact support.',
    };
  }

  if (!claimedRow) {
    const { data: fresh } = await supabase
      .from('bookings')
      .select(BOOKING_SELECT_FULL)
      .eq('id', booking.id)
      .maybeSingle();
    const freshRow = fresh as BookingRow | null;
    const fst = (freshRow?.status || '').toLowerCase();
    if (fst === 'paid') {
      let zid = freshRow?.zoho_invoice_id ?? null;
      if (!zid) zid = await pollZohoInvoiceId(supabase, booking.id);
      return { ok: true, duplicate: true, zoho_invoice_id: zid };
    }
    return {
      ok: false,
      error: `Booking is not awaiting payment (status: ${freshRow?.status || booking.status || 'unknown'})`,
    };
  }

  let working = { ...booking, ...claimedRow } as BookingRow;

  let zohoId: string | null = working.zoho_invoice_id;
  if (!zohoId) {
    try {
      zohoId = await createZohoBooksInvoice({
        booking: toZohoInvoiceBookingInput(working),
      });
    } catch (e) {
      console.error('[finalizePaidBooking] Zoho error (continuing without invoice)', e);
      zohoId = null;
    }
  }

  let invoiceUrl: string | null = working.invoice_url ?? null;
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

  const zohoPatch = {
    zoho_invoice_id: zohoId ?? null,
    invoice_url: invoiceUrl ?? null,
    updated_at: new Date().toISOString(),
  };
  let { error: upErr } = await supabase.from('bookings').update(zohoPatch).eq('id', booking.id);

  let emailManageToken: string | undefined = manageTokenPersist;
  if (upErr && /manage_token/.test(upErr.message || '') && /does not exist/i.test(upErr.message || '')) {
    emailManageToken = undefined;
  }
  if (upErr) {
    console.error('[finalizePaidBooking] Zoho/invoice_url patch failed', upErr);
  } else {
    working = { ...working, ...zohoPatch } as BookingRow;
  }

  if (working.customer_email) {
    const emailResult = await sendBookingPaidEmail({
      to: working.customer_email,
      customerName: working.customer_name || 'Customer',
      serviceName: working.service_type || 'Cleaning',
      amountZar,
      bookingId: working.id,
      zohoInvoiceId: zohoId,
      paymentReference: reference,
      bookingDate: working.booking_date,
      bookingTime: working.booking_time,
      addressLine1: working.address_line1,
      addressSuburb: working.address_suburb,
      addressCity: working.address_city,
      equipment_required: working.equipment_required === true,
      equipment_fee:
        typeof working.equipment_fee === 'number' && Number.isFinite(working.equipment_fee)
          ? working.equipment_fee
          : undefined,
      manageToken: emailManageToken,
      invoiceUrl,
      invoicePdf,
      zohoInvoiceNumber,
    });

    await supabase.from('email_send_logs').insert({
      booking_id: working.id,
      template: 'booking_paid',
      recipient: working.customer_email,
      status: emailResult.ok ? 'sent' : 'failed',
      provider_id: emailResult.providerId ?? null,
      error_message: emailResult.ok ? null : (emailResult.error ?? 'unknown'),
    });
  } else {
    console.warn('[finalizePaidBooking] No customer email — skipping Resend');
  }

  await sendAdminNewBookingEmail({
    bookingId: working.id,
    customerName: working.customer_name || 'Customer',
    serviceName: working.service_type || 'Cleaning',
    amountZar,
  });

  try {
    await applyLoyaltyAndReferralRewards({
      supabase,
      bookingId: working.id,
      customerId: working.customer_id ?? null,
      amountZar,
      pointsRedeemed: Math.max(0, Math.floor(Number(working.points_redeemed) || 0)),
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
