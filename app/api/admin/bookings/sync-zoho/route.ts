import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/supabase-server';
import { createServiceClient } from '@/lib/supabase-server';
import {
  createZohoBooksInvoiceServer,
  isZohoBooksConfigured,
} from '@/lib/zoho-books-server';
import { sendBookingPaidConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

type BookingRow = {
  id: string;
  service_type: string | null;
  customer_name: string | null;
  customer_email: string | null;
  total_amount: number | null;
  status: string | null;
  payment_reference: string | null;
  paystack_ref: string | null;
  zoho_invoice_id: string | null;
};

/**
 * GET: diagnostics (admin) — env readiness + how many paid rows lack a Zoho invoice id.
 * POST: backfill Zoho invoice ids + optional Resend confirmation for those rows.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY on the server for updates + email_send_logs.
 * Zoho/Resend use the same vars as .env.local (see .env.example).
 */
export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    let pendingCount = 0;
    try {
      const supabase = createServiceClient();
      const { count, error } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .is('zoho_invoice_id', null)
        .or('status.eq.paid,payment_reference.not.is.null,paystack_ref.not.is.null');
      if (!error && typeof count === 'number') pendingCount = count;
    } catch {
      // service role missing — count unavailable
    }

    return NextResponse.json({
      ok: true,
      zohoBooksConfigured: isZohoBooksConfigured(),
      zohoOrgIdSet: Boolean(process.env.ZOHO_BOOKS_ORGANIZATION_ID?.trim()),
      zohoTokenConfigured: Boolean(
        process.env.ZOHO_ACCESS_TOKEN?.trim() ||
          (process.env.ZOHO_REFRESH_TOKEN?.trim() &&
            process.env.ZOHO_CLIENT_ID?.trim() &&
            process.env.ZOHO_CLIENT_SECRET?.trim()),
      ),
      resendConfigured: Boolean(process.env.RESEND_API_KEY?.trim()),
      senderEmailSet: Boolean(process.env.SENDER_EMAIL?.trim()),
      serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
      pendingInvoiceBackfillApprox: pendingCount,
      hint:
        'Copy ZOHO_* and RESEND_* from .env.local into Supabase → Edge Functions → Secrets so webhooks create invoices. Use POST /api/admin/bookings/sync-zoho to backfill from this server.',
    });
  } catch (e) {
    console.error('[sync-zoho GET]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    let supabase;
    try {
      supabase = createServiceClient();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error:
            'SUPABASE_SERVICE_ROLE_KEY is required for this endpoint (updates bookings + email_send_logs). Add it to .env.local.',
        },
        { status: 503 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      bookingId?: string;
      sendEmails?: boolean;
      limit?: number;
    };

    const sendEmails = body.sendEmails !== false;
    const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 100);

    let query = supabase
      .from('bookings')
      .select(
        'id, service_type, customer_name, customer_email, total_amount, status, payment_reference, paystack_ref, zoho_invoice_id',
      )
      .is('zoho_invoice_id', null);

    if (body.bookingId?.trim()) {
      query = query.eq('id', body.bookingId.trim());
    } else {
      query = query.or('status.eq.paid,payment_reference.not.is.null,paystack_ref.not.is.null');
    }

    const { data: rows, error: fetchError } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (fetchError) {
      return NextResponse.json({ ok: false, error: fetchError.message }, { status: 500 });
    }

    const bookings = (rows || []) as BookingRow[];
    if (!isZohoBooksConfigured()) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'Zoho Books is not fully configured: set ZOHO_BOOKS_ORGANIZATION_ID plus either ZOHO_ACCESS_TOKEN or (ZOHO_REFRESH_TOKEN + ZOHO_CLIENT_ID + ZOHO_CLIENT_SECRET). Match ZOHO_ACCOUNTS_HOST / ZOHO_BOOKS_API_HOST to your Zoho data center. Add the same vars to Supabase Edge secrets for webhooks.',
          candidates: bookings.length,
        },
        { status: 400 },
      );
    }

    const results: Array<{
      bookingId: string;
      ok: boolean;
      zoho_invoice_id?: string | null;
      error?: string;
      email?: 'sent' | 'failed' | 'skipped';
      email_error?: string | null;
    }> = [];

    for (const booking of bookings) {
      const amountZar = Math.round(Number(booking.total_amount ?? 0)) / 100;
      if (!Number.isFinite(amountZar) || amountZar <= 0) {
        results.push({
          bookingId: booking.id,
          ok: false,
          error: 'Invalid total_amount',
        });
        continue;
      }

      let zohoId: string | null = null;
      try {
        zohoId = await createZohoBooksInvoiceServer({
          customerName: booking.customer_name || 'Customer',
          customerEmail: booking.customer_email,
          serviceName: booking.service_type || 'Cleaning',
          amountZar,
          bookingId: booking.id,
        });
      } catch (e) {
        results.push({
          bookingId: booking.id,
          ok: false,
          error: e instanceof Error ? e.message : 'Zoho error',
        });
        continue;
      }

      if (!zohoId) {
        results.push({
          bookingId: booking.id,
          ok: false,
          error: 'Zoho returned no invoice id',
        });
        continue;
      }

      const { error: upErr } = await supabase
        .from('bookings')
        .update({
          zoho_invoice_id: zohoId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (upErr) {
        results.push({ bookingId: booking.id, ok: false, error: upErr.message });
        continue;
      }

      let emailStatus: 'sent' | 'failed' | 'skipped' = 'skipped';
      let emailErr: string | null = null;
      if (sendEmails && booking.customer_email) {
        const emailResult = await sendBookingPaidConfirmationEmail({
          to: booking.customer_email.trim(),
          customerName: booking.customer_name || 'Customer',
          serviceName: booking.service_type || 'Cleaning',
          amountZar,
          bookingId: booking.id,
          zohoInvoiceId: zohoId,
        });
        emailStatus = emailResult.ok ? 'sent' : 'failed';
        emailErr = emailResult.ok ? null : (emailResult.error ?? 'unknown');
        await supabase.from('email_send_logs').insert({
          booking_id: booking.id,
          template: 'booking_paid',
          recipient: booking.customer_email.trim(),
          status: emailResult.ok ? 'sent' : 'failed',
          provider_id: emailResult.providerId ?? null,
          error_message: emailErr,
        });
      }

      results.push({
        bookingId: booking.id,
        ok: true,
        zoho_invoice_id: zohoId,
        email: emailStatus,
        ...(emailErr ? { email_error: emailErr } : {}),
      });
    }

    return NextResponse.json({
      ok: true,
      processed: results.length,
      results,
    });
  } catch (e) {
    console.error('[sync-zoho POST]', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed' },
      { status: 500 },
    );
  }
}
