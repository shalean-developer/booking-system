import 'server-only';

export type SendWhatsAppResult =
  | { ok: true; sid?: string }
  | { ok: false; error: string };

/**
 * Twilio WhatsApp API (REST). Configure:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155238886)
 */
export async function sendWhatsApp(params: { to: string; message: string }): Promise<SendWhatsAppResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_WHATSAPP_FROM?.trim();

  if (!sid || !token || !from) {
    return {
      ok: false,
      error:
        'WhatsApp not configured: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM',
    };
  }

  let to = params.to.trim().replace(/\s/g, '');
  if (!to.startsWith('+')) {
    return { ok: false, error: 'Phone number must be E.164 including country code (e.g. +27821234567)' };
  }
  if (!to.startsWith('whatsapp:')) {
    to = `whatsapp:${to}`;
  }

  const body = new URLSearchParams({
    From: from.startsWith('whatsapp:') ? from : `whatsapp:${from.replace(/^whatsapp:/i, '')}`,
    To: to,
    Body: params.message,
  });

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const json = (await res.json()) as { sid?: string; message?: string; code?: number };
  if (!res.ok) {
    console.error('[whatsapp] Twilio error', res.status, json);
    return { ok: false, error: json.message || `Twilio HTTP ${res.status}` };
  }

  console.log('[whatsapp] sent', { sid: json.sid });
  return { ok: true, sid: json.sid };
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_WHATSAPP_FROM?.trim(),
  );
}
