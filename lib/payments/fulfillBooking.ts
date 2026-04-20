/**
 * Single source of truth for Paystack success → DB + Zoho + Resend (Next.js / process.env only).
 * Used by /api/payment/verify and /api/payment/webhook.
 *
 * Concurrency: only one request can "win" the transition pending → paid (atomic UPDATE + WHERE status).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadBookingInvoicePdf } from '@/lib/invoice-pdf-storage';
import {
  buildZohoBooksInvoiceWebUrl,
  createZohoBooksInvoiceServer,
  fetchZohoInvoiceNumber,
  fetchZohoInvoicePdfBuffer,
  getZohoBooksConfigGaps,
} from '@/lib/zoho-books-server';
import { toZohoInvoiceBookingInput } from '@/supabase/functions/_shared/zoho-invoice-payload';
import { sendBookingPaidConfirmationEmail, validateResendConfig } from '@/lib/email';
import { sendAdminBookingPaidEmail } from '@/lib/email/sendAdminBookingPaidEmail';
import { generateManageToken } from '@/lib/manage-booking-token';
import type { BookingPaidRow } from '@/lib/payments/booking-types';
import { logPaymentIntegrity, redactPaymentReference } from '@/lib/payment-integrity-log';
import { recordPaymentValidationFailure } from '@/lib/payment-validation-tracker';
import { applyLoyaltyAndReferralRewardsOnPayment } from '@/lib/loyalty/apply-payment-rewards';

async function fetchManageTokenForEmail(
  supabase: SupabaseClient,
  bookingId: string,
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('bookings')
    .select('manage_token')
    .eq('id', bookingId)
    .maybeSingle();

  if (error) {
    if (/manage_token/.test(error.message) && /does not exist/i.test(error.message)) {
      console.warn(
        '[fulfillPaidBooking] bookings.manage_token missing — run migration 20260416200000_add_manage_token_to_bookings.sql',
      );
      return undefined;
    }
    console.warn('[fulfillPaidBooking] manage_token lookup:', error.message);
    return undefined;
  }

  const row = data as { manage_token?: string | null } | null;
  return row?.manage_token?.trim() || undefined;
}

function isMissingManageTokenColumnError(message: string): boolean {
  return /manage_token/.test(message) && /does not exist/i.test(message);
}

export type FulfillPaidBookingResult = {
  ok: boolean;
  duplicate?: boolean;
  zoho_invoice_id?: string | null;
  error?: string;
};

function mergeBookingRow(base: BookingPaidRow, updated: Record<string, unknown>): BookingPaidRow {
  return { ...base, ...(updated as BookingPaidRow) };
}

/** Customer-facing line when paid confirmation has no PDF attachment (test env vs production parity). */
function buildInvoicePdfMissingNote(params: {
  zohoId: string | null;
  invoicePdf: Buffer | null;
  invoiceUrl: string | null;
}): string | undefined {
  const hasPdf = Boolean(params.invoicePdf && params.invoicePdf.length > 0);
  const hasUrl = Boolean(params.invoiceUrl?.trim());
  if (hasPdf || hasUrl) return undefined;

  const gaps = getZohoBooksConfigGaps();
  if (gaps.length > 0) {
    console.warn('[fulfillPaidBooking] Zoho Books env incomplete — same keys as production needed for PDF invoice', {
      missing: gaps,
    });
    return (
      'Your payment is confirmed. A PDF tax invoice was not attached because automatic invoicing is not configured on this deployment. ' +
      'To match production, add the same Zoho Books variables here (for example Vercel → Environment Variables → Preview / Development). ' +
      'You can also reply to this email if you need a formal invoice.'
    );
  }
  if (!params.zohoId) {
    return (
      'Your payment is confirmed. We could not create an invoice in our accounting system just now. ' +
      'Reply to this email or message us on WhatsApp if you need a formal PDF invoice.'
    );
  }
  return (
    'Your payment is confirmed. The invoice PDF could not be attached to this message. ' +
    'Contact us if you need a copy, or use the invoice line above if shown.'
  );
}

/** Zoho + invoice_url backfill when row is already paid — no emails. */
async function backfillZohoIfMissing(
  supabase: SupabaseClient,
  booking: BookingPaidRow,
  reference: string,
): Promise<string | null> {
  let zohoId = booking.zoho_invoice_id ?? null;
  if (zohoId) return zohoId;
  try {
    const created = await createZohoBooksInvoiceServer({
      booking: toZohoInvoiceBookingInput(booking),
      paystackReference: reference,
    });
    if (created) {
      await supabase
        .from('bookings')
        .update({ zoho_invoice_id: created, updated_at: new Date().toISOString() })
        .eq('id', booking.id);
      zohoId = created;
    }
  } catch (e) {
    console.error('[fulfillPaidBooking ERROR] Zoho backfill failed', e);
  }
  if (zohoId && !booking.invoice_url) {
    try {
      const pdf = await fetchZohoInvoicePdfBuffer(zohoId);
      if (pdf) {
        const url = await uploadBookingInvoicePdf(supabase, booking.id, pdf);
        if (url) {
          await supabase
            .from('bookings')
            .update({ invoice_url: url, updated_at: new Date().toISOString() })
            .eq('id', booking.id);
        }
      }
    } catch (e) {
      console.warn('[fulfillPaidBooking] invoice PDF backfill', e);
    }
  }
  return zohoId;
}

/**
 * Confirm a verified Paystack charge: atomic pending→paid claim, then Zoho + emails (winner only).
 * Row-level serialization: a single `UPDATE ... WHERE id = ? AND status = 'pending'` acts as the claim
 * (PostgreSQL serializes concurrent updates; second caller gets 0 rows). Session `SELECT FOR UPDATE` is
 * not used here because Supabase poolers typically commit per statement — same-transaction locks would not span the TS steps.
 */
export async function fulfillPaidBooking(params: {
  supabase: SupabaseClient;
  booking: BookingPaidRow;
  reference: string;
  paystackAmountKobo: number;
  /** ISO currency from Paystack verify API (stored on successful finalize). */
  paidCurrency?: string;
}): Promise<FulfillPaidBookingResult> {
  const { supabase, booking, reference, paystackAmountKobo, paidCurrency } = params;

  console.log('[fulfillPaidBooking] processing booking', booking.id);

  const statusEarly = (booking.status || '').toLowerCase();
  if (statusEarly !== 'pending' && statusEarly !== 'paid') {
    logPaymentIntegrity({
      event_type: 'finalize_skipped_invalid_state',
      booking_id: booking.id,
      reason: 'invalid_booking_status',
      status: booking.status,
    });
    return {
      ok: false,
      error: `Booking is not awaiting payment (status: ${booking.status || 'unknown'})`,
    };
  }

  const expectedKobo = Math.round(Number(booking.total_amount ?? 0));
  const amountDelta = Math.abs(paystackAmountKobo - expectedKobo);
  if (!Number.isFinite(paystackAmountKobo) || amountDelta > 1) {
    logPaymentIntegrity({
      event_type: 'payment_amount_mismatch',
      booking_id: booking.id,
      reference_redacted: redactPaymentReference(String(reference)),
      expected_amount: expectedKobo,
      amount_paid: paystackAmountKobo,
      unit: 'minor',
      source: 'finalizeBookingPayment',
    });
    await recordPaymentValidationFailure(supabase, String(reference), 'payment_amount_mismatch');
    return {
      ok: false,
      error: `Amount mismatch: expected ${expectedKobo} minor units, got ${paystackAmountKobo} (Δ ${amountDelta})`,
    };
  }

  const ref = String(reference).trim();
  const pref = (booking.payment_reference || '').trim();
  const pstack = (booking.paystack_ref || '').trim();
  const conflictingPayment =
    (pref.length > 0 && pref !== ref) || (pstack.length > 0 && pstack !== ref);
  if (conflictingPayment) {
    logPaymentIntegrity({
      event_type: 'finalize_skipped_invalid_state',
      booking_id: booking.id,
      reason: 'conflicting_payment_reference',
    });
    await recordPaymentValidationFailure(supabase, String(reference), 'payment_reference_mismatch');
    return {
      ok: false,
      error:
        'This booking already has a different payment reference. Contact support if you were charged.',
    };
  }

  const amountZar = expectedKobo / 100;
  const manageTokenToSave =
    (await fetchManageTokenForEmail(supabase, booking.id)) ?? generateManageToken();

  const currencyNorm = String(paidCurrency ?? 'ZAR').trim().toUpperCase() || 'ZAR';
  const paystackVerifiedAt = new Date().toISOString();

  const baseClaim = {
    status: 'paid' as const,
    payment_status: 'success' as const,
    paystack_ref: reference,
    payment_reference: reference,
    price: amountZar,
    updated_at: paystackVerifiedAt,
    manage_token: manageTokenToSave,
    paid_amount_minor: paystackAmountKobo,
    paid_currency: currencyNorm,
    paystack_verified_at: paystackVerifiedAt,
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
    if (error && isMissingManageTokenColumnError(error.message || '')) {
      const second = await tryClaim(false);
      claimedRow = (second.data as Record<string, unknown> | null) ?? null;
      claimErr = second.error;
    } else {
      claimedRow = (data as Record<string, unknown> | null) ?? null;
      claimErr = error;
    }
  }

  if (claimErr && !claimedRow) {
    console.error('[fulfillPaidBooking ERROR] atomic claim failed', claimErr);
    return {
      ok: false,
      error: claimErr.message?.trim() || 'Could not confirm payment. Please contact support.',
    };
  }

  if (!claimedRow) {
    const { data: fresh } = await supabase.from('bookings').select('*').eq('id', booking.id).maybeSingle();
    const freshRow = fresh as BookingPaidRow | null;
    const st = (freshRow?.status || '').toLowerCase();

    if (st === 'paid') {
      console.log('[fulfillPaidBooking] lost race or already paid — duplicate (no emails)', {
        bookingId: booking.id,
      });
      const merged = freshRow ? mergeBookingRow(booking, fresh as Record<string, unknown>) : booking;
      const zohoAfter = await backfillZohoIfMissing(supabase, merged, reference);
      return {
        ok: true,
        duplicate: true,
        zoho_invoice_id: zohoAfter ?? freshRow?.zoho_invoice_id ?? null,
      };
    }

    logPaymentIntegrity({
      event_type: 'finalize_skipped_invalid_state',
      booking_id: booking.id,
      reason: 'atomic_claim_no_rows',
      status: freshRow?.status ?? booking.status,
    });
    console.error('[fulfillPaidBooking] atomic claim matched 0 rows; booking not paid', {
      bookingId: booking.id,
      status: freshRow?.status,
    });
    return {
      ok: false,
      error: `Booking is not awaiting payment (status: ${freshRow?.status || booking.status || 'unknown'})`,
    };
  }

  logPaymentIntegrity({
    event_type: 'booking_lock_acquired',
    booking_id: booking.id,
    mechanism: 'atomic_update_where_pending',
  });

  console.log('[fulfillPaidBooking] won execution — proceeding with Zoho + emails', {
    bookingId: booking.id,
  });

  let wonBooking = mergeBookingRow(booking, claimedRow);
  const emailManageToken =
    typeof claimedRow.manage_token === 'string' && claimedRow.manage_token.trim().length >= 64
      ? claimedRow.manage_token.trim()
      : manageTokenToSave;

  let zohoId: string | null = wonBooking.zoho_invoice_id ?? null;
  if (!zohoId) {
    try {
      console.log('[fulfillPaidBooking] creating Zoho invoice', { bookingId: booking.id });
      const created = await createZohoBooksInvoiceServer({
        booking: toZohoInvoiceBookingInput(wonBooking),
        paystackReference: reference,
      });
      zohoId = created;
      console.log('[fulfillPaidBooking] Zoho invoice created', { zohoId });
    } catch (e) {
      console.error('[fulfillPaidBooking ERROR] Zoho failed (continuing without invoice)', e);
      zohoId = null;
    }
  }

  let invoiceUrl: string | null = wonBooking.invoice_url ?? null;
  let invoicePdf: Buffer | null = null;
  let zohoInvoiceNumber: string | null = null;
  if (zohoId) {
    zohoInvoiceNumber = await fetchZohoInvoiceNumber(zohoId);
    const pdf = await fetchZohoInvoicePdfBuffer(zohoId);
    if (pdf) {
      invoicePdf = pdf;
      const url = await uploadBookingInvoicePdf(supabase, booking.id, pdf);
      if (url) invoiceUrl = url;
    }
  }

  if (zohoId || invoiceUrl !== wonBooking.invoice_url) {
    const { data: patched } = await supabase
      .from('bookings')
      .update({
        zoho_invoice_id: zohoId ?? null,
        invoice_url: invoiceUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id)
      .select()
      .maybeSingle();
    if (patched) {
      wonBooking = mergeBookingRow(wonBooking, patched as Record<string, unknown>);
    }
  }

  const invoicePdfMissingNote = buildInvoicePdfMissingNote({
    zohoId,
    invoicePdf,
    invoiceUrl,
  });

  if (wonBooking.customer_email?.trim()) {
    const to = wonBooking.customer_email.trim();
    const cfg = validateResendConfig();
    if (!cfg.ok) {
      console.error('[fulfillPaidBooking ERROR] Resend not configured', cfg.error);
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
        const sendResult = await sendBookingPaidConfirmationEmail({
          to,
          customerName: wonBooking.customer_name || 'Customer',
          serviceName: wonBooking.service_type || 'Cleaning',
          amountZar,
          bookingId: wonBooking.id,
          zohoInvoiceId: zohoId,
          paymentReference: reference,
          bookingDate: wonBooking.booking_date,
          bookingTime: wonBooking.booking_time,
          addressLine1: wonBooking.address_line1,
          addressSuburb: wonBooking.address_suburb,
          addressCity: wonBooking.address_city,
          equipment_required: wonBooking.equipment_required === true,
          equipment_fee:
            typeof wonBooking.equipment_fee === 'number' && Number.isFinite(wonBooking.equipment_fee)
              ? wonBooking.equipment_fee
              : undefined,
          manageToken: emailManageToken,
          invoiceUrl,
          invoicePdf,
          zohoInvoiceNumber,
          invoicePdfMissingNote,
        });
        if (!sendResult.ok) {
          throw new Error(sendResult.error || 'Failed to send booking confirmation email');
        }
        await supabase.from('email_send_logs').insert({
          booking_id: booking.id,
          template: 'booking_paid',
          recipient: to,
          status: 'sent',
          provider_id: sendResult.providerId ?? null,
          error_message: null,
        });
      } catch (err) {
        console.error('[fulfillPaidBooking ERROR] customer email failed', err);
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
    console.warn('[fulfillPaidBooking] no customer email — skipping Resend');
  }

  const zohoWebUrl = buildZohoBooksInvoiceWebUrl(zohoId);
  await sendAdminBookingPaidEmail({
    booking: wonBooking,
    amountZar,
    paymentReference: reference,
    zohoInvoiceId: zohoId,
    zohoInvoiceNumber,
    zohoBooksWebUrl: zohoWebUrl,
    invoiceStorageUrl: invoiceUrl,
    hasPdfAttachment: Boolean(invoicePdf && invoicePdf.length > 0),
    invoicePdf,
  });

  console.log('[fulfillPaidBooking] done', { bookingId: booking.id, zohoId });

  try {
    await applyLoyaltyAndReferralRewardsOnPayment({
      supabase,
      bookingId: wonBooking.id,
      customerId: wonBooking.customer_id ?? null,
      amountZar,
      pointsRedeemed: Math.max(0, Math.floor(Number(wonBooking.points_redeemed) || 0)),
      bookingDateYmd: String(wonBooking.booking_date ?? '').slice(0, 10) || undefined,
    });
  } catch (e) {
    console.error('[loyalty] applyLoyaltyAndReferralRewardsOnPayment', e);
  }

  return { ok: true, zoho_invoice_id: zohoId };
}

/** Alias for callers that prefer the name from the spec. */
export const fulfillBooking = fulfillPaidBooking;

/** Backward-compatible name used across the codebase. */
export const finalizePaidBookingServer = fulfillPaidBooking;

/** Canonical name: all Paystack charge success finalization goes through this (webhook + verify). */
export const finalizeBookingPayment = fulfillPaidBooking;
