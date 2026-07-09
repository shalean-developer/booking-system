import 'server-only';

import OpenAI from 'openai';

export const WHATSAPP_INTENTS = [
  'once_off',
  'regular',
  'pricing',
  'booking_ready',
  'question',
  'other',
] as const;

export type WhatsAppIntent = (typeof WHATSAPP_INTENTS)[number];

export type WhatsAppAgentContext = {
  /** Previous intent from DB */
  lastIntent?: string | null;
  /** Previous user message (short) */
  lastMessage?: string | null;
  /** Canonical booking URL for CTAs */
  bookingUrl: string;
};

export type WhatsAppAgentResult = {
  intent: WhatsAppIntent;
  reply: string;
};

function isWhatsAppIntent(v: string): v is WhatsAppIntent {
  return (WHATSAPP_INTENTS as readonly string[]).includes(v);
}

/** Default when OpenAI is down or returns bad JSON */
export function getWhatsAppFailsafeReply(bookingUrl: string): string {
  return `Got you 👍 You can book here 👉 ${bookingUrl}`;
}

function defaultBookingUrl(): string {
  return (
    process.env.WHATSAPP_BOOKING_URL?.trim() ||
    process.env.NEXT_PUBLIC_BOOKING_URL?.trim() ||
    'https://shalean.com/book'
  );
}

function clampLines(text: string, maxLines: number): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines.slice(0, maxLines).join('\n').trim();
}

const LINK_INTENTS: WhatsAppIntent[] = [
  'once_off',
  'regular',
  'pricing',
  'booking_ready',
];

function replyAlreadyHasBookingLink(reply: string, bookingUrl: string): boolean {
  const u = bookingUrl.replace(/^https?:\/\//, '');
  return (
    reply.includes(bookingUrl) ||
    reply.includes(u) ||
    /shalean\.com\/book/i.test(reply)
  );
}

function ensureHighIntentBookingLink(
  reply: string,
  intent: WhatsAppIntent,
  bookingUrl: string
): string {
  if (!LINK_INTENTS.includes(intent)) return reply;
  if (replyAlreadyHasBookingLink(reply, bookingUrl)) return reply;
  return `${reply}\n👉 ${bookingUrl}`;
}

/**
 * OpenAI-powered WhatsApp sales replies for Shalean cleaning.
 * Enforces short, conversion-focused copy and intent classification.
 */
export async function generateReply(
  message: string,
  context: WhatsAppAgentContext
): Promise<WhatsAppAgentResult> {
  const bookingUrl = context.bookingUrl || defaultBookingUrl();
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return {
      intent: 'other',
      reply: getWhatsAppFailsafeReply(bookingUrl),
    };
  }

  const client = new OpenAI({ apiKey: key });
  const model = process.env.OPENAI_WHATSAPP_MODEL?.trim() || 'gpt-4o-mini';

  const system = `You are Shalean's WhatsApp sales assistant for a professional home cleaning service in South Africa (English; warm, concise).

Classify the user's latest message into exactly one intent:
- once_off: one-time / deep clean / single visit
- regular: recurring / weekly / fortnightly / subscription
- pricing: cost, quote, how much, rates
- booking_ready: wants to book now, send link, schedule, "let's do it"
- question: general how-it-works, what's included, trust/safety
- other: greetings, off-topic, unclear

Output rules (STRICT):
1) Return ONLY valid JSON with keys "intent" and "reply" (no markdown fences).
2) "intent" must be one of: once_off, regular, pricing, booking_ready, question, other
3) "reply" must be at most 3 short lines (use line breaks). No bullet lists. Plain text. Optional tasteful emoji is OK (e.g. 👍 or ✨), not spammy.
4) Always steer toward booking at Shalean when relevant. Be helpful on pricing without inventing exact ZAR numbers—point to the booking flow for a tailored quote if needed.
5) If the user is unsure or vague, ask ONE clear follow-up question in the reply.
6) For strong purchase intents (once_off, regular, pricing, booking_ready), naturally include this booking link in the reply: ${bookingUrl}
7) Do not claim discounts unless the user asked about promos; stay factual.

Context for continuity (may be empty):
- previous_intent: ${context.lastIntent ?? 'none'}
- previous_user_message: ${context.lastMessage ? context.lastMessage.slice(0, 500) : 'none'}`;

  const user = message.trim().slice(0, 4000);

  try {
    const completion = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.55,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user || '(empty message)' },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return { intent: 'other', reply: getWhatsAppFailsafeReply(bookingUrl) };
    }

    const parsed = JSON.parse(raw) as { intent?: string; reply?: string };
    let intentStr = typeof parsed.intent === 'string' ? parsed.intent.trim().toLowerCase() : 'other';
    if (!isWhatsAppIntent(intentStr)) {
      intentStr = 'other';
    }
    const intent = intentStr as WhatsAppIntent;

    let reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : '';
    if (!reply) {
      return { intent, reply: getWhatsAppFailsafeReply(bookingUrl) };
    }

    reply = clampLines(reply, 3);
    reply = ensureHighIntentBookingLink(reply, intent, bookingUrl);

    return { intent, reply };
  } catch (e) {
    console.error('[whatsapp-agent]', e);
    return {
      intent: 'other',
      reply: getWhatsAppFailsafeReply(bookingUrl),
    };
  }
}
