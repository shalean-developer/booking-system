/**
 * Single source of truth for Paystack success → DB + Zoho + Resend (Next.js / process.env only).
 * Used by /api/payment/verify and /api/payment/webhook.
 *
 * Concurrency: only one request can "win" the transition pending → paid (atomic UPDATE + WHERE status).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { uploadBookingInvoicePdf } from '@/lib/invoice-pdf-storage';
import {
  createZohoBooksInvoiceServer,
  fetchZohoInvoiceNumber,
  fetchZohoInvoicePdfBuffer,
} from '@/lib/zoho-books-server';
import { toZohoInvoiceBookingInput } from '@/supabase/functions/_shared/zoho-invoice-payload';
import { sendBookingPaidConfirmationEmail, validateResendConfig } from '@/lib/email';
import { generateManageToken } from '@/lib/manage-booking-token';
import { resolveAdminNotificationEmail } from '@/lib/admin-email';
import { escapeHtml } from '@/shared/email/escape-html';
import {
  adminPaidBookingNotificationHtml,
  type AdminPaidBookingEmailData,
} from '@/shared/email/templates/admin-paid-booking';
import type { BookingPaidRow } from '@/lib/payments/booking-types';

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

async function sendAdminNewBookingPaidEmail(params: {
  booking: BookingPaidRow;
  amountZar: number;
  paymentReference: string;
  zohoInvoiceId: string | null;
}): Promise<void> {
  const admin = resolveAdminNotificationEmail();
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const sender = process.env.SENDER_EMAIL?.trim() || 'noreply@shalean.co.za';
  if (!apiKey) {
    console.warn(
      '[fulfillPaidBooking] RESEND_API_KEY missing — admin new-booking email skipped',
    );
    return;
  }
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
  const addressText =
    [params.booking.address_line1, params.booking.address_suburb, params.booking.address_city]
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

  const notesHtml = params.booking.notes?.trim()
    ? `<h2 style="margin: 18px 0 10px 0; color: #111827; font-size: 16px;">Customer notes</h2><p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6;">${escapeHtml(params.booking.notes.trim())}</p>`
    : '';

  const payload: AdminPaidBookingEmailData = {
    bookingId,
    customerName,
    customerEmail: params.booking.customer_email || 'N/A',
    customerPhone: params.booking.customer_phone || 'N/A',
    serviceName,
    dateText,
    timeText,
    endText,
    frequencyText,
    cleanerText,
    addressText,
    amountZar: params.amountZar,
    serviceFeeCents: params.booking.service_fee || 0,
    tipCents: params.booking.tip_amount || 0,
    frequencyDiscountCents: params.booking.frequency_discount || 0,
    surgeApplied: params.booking.surge_pricing_applied === true,
    surgeCents: params.booking.surge_amount || 0,
    paymentReference: params.paymentReference,
    zohoInvoiceId: params.zohoInvoiceId,
    bedrooms,
    bathrooms,
    cleaners,
    extrasHtml,
    notesHtml,
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Shalean Cleaning <${sender}>`,
      to: [admin],
      subject: `Payment received • ${bookingId} • ${customerName}`,
      html: adminPaidBookingNotificationHtml(payload),
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.error('[fulfillPaidBooking] admin email Resend HTTP', res.status, errText.slice(0, 500));
  }
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
 */
export async function fulfillPaidBooking(params: {
  supabase: SupabaseClient;
  booking: BookingPaidRow;
  reference: string;
  paystackAmountKobo: number;
}): Promise<FulfillPaidBookingResult> {
  const { supabase, booking, reference, paystackAmountKobo } = params;

  console.log('[fulfillPaidBooking] processing booking', booking.id);

  const expectedKobo = Math.round(Number(booking.total_amount ?? 0));
  const amountDelta = Math.abs(paystackAmountKobo - expectedKobo);
  if (!Number.isFinite(paystackAmountKobo) || amountDelta > 1) {
    console.error('[fulfillPaidBooking] amount mismatch', {
      expectedKobo,
      paystackAmountKobo,
      amountDelta,
    });
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
    console.error('[fulfillPaidBooking] conflicting payment ref', {
      bookingId: booking.id,
      pref,
      pstack,
      ref,
    });
    return {
      ok: false,
      error:
        'This booking already has a different payment reference. Contact support if you were charged.',
    };
  }

  const amountZar = expectedKobo / 100;
  const manageTokenToSave =
    (await fetchManageTokenForEmail(supabase, booking.id)) ?? generateManageToken();

  const baseClaim = {
    status: 'paid' as const,
    payment_status: 'success' as const,
    paystack_ref: reference,
    payment_reference: reference,
    price: amountZar,
    updated_at: new Date().toISOString(),
    manage_token: manageTokenToSave,
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

    console.error('[fulfillPaidBooking] atomic claim matched 0 rows; booking not paid', {
      bookingId: booking.id,
      status: freshRow?.status,
    });
    return {
      ok: false,
      error: `Booking is not awaiting payment (status: ${freshRow?.status || booking.status || 'unknown'})`,
    };
  }

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

  await sendAdminNewBookingPaidEmail({
    booking: wonBooking,
    amountZar,
    paymentReference: reference,
    zohoInvoiceId: zohoId,
  });

  console.log('[fulfillPaidBooking] done', { bookingId: booking.id, zohoId });
  return { ok: true, zoho_invoice_id: zohoId };
}

/** Alias for callers that prefer the name from the spec. */
export const fulfillBooking = fulfillPaidBooking;

/** Backward-compatible name used across the codebase. */
export const finalizePaidBookingServer = fulfillPaidBooking;
