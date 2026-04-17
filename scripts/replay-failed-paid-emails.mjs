/**
 * Lists recent failed booking_paid emails and optionally replays production verify.
 * Note: paid bookings no longer resend customer email on verify (idempotent); use for edge cases.
 *
 * Usage (from repo root):
 *   node scripts/replay-failed-paid-emails.mjs
 *   node scripts/replay-failed-paid-emails.mjs --replay
 */
import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://shalean.co.za').replace(/\/$/, '');

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const h = { apikey: key, Authorization: `Bearer ${key}` };

async function main() {
  const replay = process.argv.includes('--replay');

  const failedRes = await fetch(
    `${url}/rest/v1/email_send_logs?select=booking_id,error_message,created_at&template=eq.booking_paid&status=eq.failed&order=created_at.desc&limit=80`,
    { headers: h },
  );
  const failed = await failedRes.json();
  if (!Array.isArray(failed)) {
    console.error('Failed to load email_send_logs', failed);
    process.exit(1);
  }

  const seen = new Set();
  const uniqueFails = [];
  for (const row of failed) {
    const id = row.booking_id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    uniqueFails.push(row);
  }

  const results = [];
  for (const row of uniqueFails) {
    const id = row.booking_id;
    const bookRes = await fetch(
      `${url}/rest/v1/bookings?select=status&id=eq.${encodeURIComponent(id)}`,
      { headers: h },
    );
    const bookRows = await bookRes.json();
    const bookingStatus =
      Array.isArray(bookRows) && bookRows[0]?.status ? String(bookRows[0].status) : null;

    const sentRes = await fetch(
      `${url}/rest/v1/email_send_logs?select=id&template=eq.booking_paid&booking_id=eq.${encodeURIComponent(id)}&status=eq.sent&limit=1`,
      { headers: h },
    );
    const sent = await sentRes.json();
    const hasSent = Array.isArray(sent) && sent.length > 0;

    let replayHttp = null;
    let replaySnippet = null;
    const canReplay = bookingStatus === 'paid' && !hasSent;
    if (replay && canReplay) {
      const ref = `booking-${id}`;
      const v = await fetch(`${site}/api/payment/verify?reference=${encodeURIComponent(ref)}`);
      replayHttp = v.status;
      replaySnippet = (await v.text()).slice(0, 400);
    }

    results.push({
      booking_id: id,
      booking_status: bookingStatus,
      last_error: row.error_message,
      failed_at: row.created_at,
      already_has_sent_log: hasSent,
      replay_url: canReplay
        ? `${site}/api/payment/verify?reference=${encodeURIComponent(`booking-${id}`)}`
        : null,
      skipped_replay: replay && !canReplay ? (bookingStatus !== 'paid' ? 'not_paid_status' : 'already_sent') : null,
      replay_http: replayHttp,
      replay_snippet: replaySnippet,
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
