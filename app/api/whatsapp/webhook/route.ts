import { NextRequest, NextResponse } from 'next/server';
import { generateReply, getWhatsAppFailsafeReply } from '@/lib/ai/whatsapp-agent';
import { loadConversation, saveConversation } from '@/lib/whatsapp/conversations';
import { parseTwilioWhatsAppE164 } from '@/lib/whatsapp/twilio-phone';
import { sendWhatsApp } from '@/lib/whatsapp/send';
import { createServiceClient } from '@/lib/supabase-server';
import { processWhatsAppBookingMessage } from '@/lib/whatsapp/booking-flow';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function bookingUrl(): string {
  return (
    process.env.WHATSAPP_BOOKING_URL?.trim() ||
    process.env.NEXT_PUBLIC_BOOKING_URL?.trim() ||
    'https://shalean.com/book'
  );
}

function emptyTwiML(): NextResponse {
  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    status: 200,
    headers: { 'Content-Type': 'text/xml; charset=utf-8' },
  });
}

function isWhatsAppBookingAgentEnabled(): boolean {
  return process.env.WHATSAPP_BOOKING_AGENT?.trim().toLowerCase() !== 'false';
}

/**
 * Twilio WhatsApp status callback (no Body) — acknowledge without sending duplicate replies.
 */
function isLikelyStatusOnly(body: FormData): boolean {
  const hasBody = body.has('Body');
  const status = body.get('MessageStatus') ?? body.get('SmsStatus');
  return Boolean(status) && !hasBody;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'whatsapp-webhook',
    bookingAgent: isWhatsAppBookingAgentEnabled(),
    hint: 'Twilio should POST inbound messages to this URL',
  });
}

export async function POST(request: NextRequest) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return emptyTwiML();
  }

  if (isLikelyStatusOnly(form)) {
    return emptyTwiML();
  }

  const fromRaw = form.get('From');
  const from =
    typeof fromRaw === 'string' ? parseTwilioWhatsAppE164(fromRaw) : null;
  const bodyRaw = form.get('Body');
  let text =
    typeof bodyRaw === 'string' ? bodyRaw.trim() : '';
  const numMediaRaw = form.get('NumMedia');
  const numMedia =
    typeof numMediaRaw === 'string' ? parseInt(numMediaRaw, 10) || 0 : 0;

  if (!from) {
    console.warn('[whatsapp-webhook] missing or invalid From');
    return emptyTwiML();
  }

  if (!text && numMedia > 0) {
    text =
      'I sent a photo. I want to book a clean — please guide me.';
  }

  if (!text) {
    return emptyTwiML();
  }

  const url = bookingUrl();

  if (isWhatsAppBookingAgentEnabled()) {
    try {
      const supabase = createServiceClient();
      const result = await processWhatsAppBookingMessage(supabase, from, text);
      const sendResult = await sendWhatsApp({ to: from, message: result.reply });
      if (!sendResult.ok) {
        console.error('[whatsapp-webhook] sendWhatsApp', sendResult.error);
      }
      try {
        await saveConversation(supabase, {
          phoneE164: from,
          lastIntent: 'whatsapp_booking_flow',
          lastMessage: text,
          lastReply: result.reply,
        });
      } catch (e) {
        console.error('[whatsapp-webhook] conversation log', e);
      }
    } catch (e) {
      console.error('[whatsapp-webhook] booking agent', e);
      const fallback = getWhatsAppFailsafeReply(url);
      await sendWhatsApp({ to: from, message: fallback });
    }
    return emptyTwiML();
  }

  let lastIntent: string | null | undefined;
  let lastMessage: string | null | undefined;

  try {
    const supabase = createServiceClient();
    const prev = await loadConversation(supabase, from);
    lastIntent = prev?.last_intent;
    lastMessage = prev?.last_message;
  } catch (e) {
    console.error('[whatsapp-webhook] supabase load', e);
  }

  let result = await generateReply(text, {
    lastIntent,
    lastMessage,
    bookingUrl: url,
  });

  if (!result.reply?.trim()) {
    result = {
      intent: 'other',
      reply: getWhatsAppFailsafeReply(url),
    };
  }

  const sendResult = await sendWhatsApp({ to: from, message: result.reply });
  if (!sendResult.ok) {
    console.error('[whatsapp-webhook] sendWhatsApp', sendResult.error);
  }

  try {
    const supabase = createServiceClient();
    await saveConversation(supabase, {
      phoneE164: from,
      lastIntent: result.intent,
      lastMessage: text,
      lastReply: result.reply,
    });
  } catch (e) {
    console.error('[whatsapp-webhook] supabase save', e);
  }

  return emptyTwiML();
}
