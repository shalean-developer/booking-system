import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { BookingState } from '@/types/booking';
import type { ServiceType } from '@/types/booking';
import { findNextAvailableDates } from '@/lib/whatsapp/availability-dates';
import {
  postCreatePricingSnapshot,
  postPendingBooking,
} from '@/lib/whatsapp/submit-whatsapp-booking';
import {
  loadBookingSession,
  upsertBookingSession,
  resetBookingSession,
  type WhatsAppBookingSessionRow,
} from '@/lib/whatsapp/booking-session-db';
import { validatePendingBookingEnv } from '@/lib/env-validation';
import { initializePaystackForWhatsAppBooking } from '@/lib/whatsapp/init-paystack-for-booking';

const WA_SERVICE: ServiceType = 'Standard';

export const BOOKING_FLOW_STEPS = [
  'start',
  'service_type',
  'home_details',
  'date_selection',
  'time_selection',
  'confirmation',
  'payment_pending',
  'completed',
] as const;

export type BookingFlowStep = (typeof BOOKING_FLOW_STEPS)[number];

const WA_TIME_SLOTS = ['09:00', '12:00', '15:00', '16:00'] as const;

const RESET_RE = /^(reset|start over|cancel|stop|menu)$/i;
const BOOK_RE = /^book$/i;

export type BookingFlowResult = {
  reply: string;
  step: string;
  data: Record<string, unknown>;
};

function bookingSiteUrl(): string {
  return (
    process.env.WHATSAPP_BOOKING_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    'https://shalean.com/book'
  );
}

function parseServiceChoice(text: string): 'one-time' | 'weekly' | null {
  const t = text.trim().toLowerCase();
  if (t === '1' || /^once|^one[\s-]?off|^single/.test(t)) return 'one-time';
  if (t === '2' || /^regular|^weekly|^recurring/.test(t)) return 'weekly';
  return null;
}

function parseHomeLine(
  text: string
): { beds: number; baths: number; line1: string; suburb: string; city: string } | null {
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 5) return null;
  const beds = parseInt(parts[0], 10);
  const baths = parseInt(parts[1], 10);
  if (!Number.isFinite(beds) || beds < 1 || beds > 20) return null;
  if (!Number.isFinite(baths) || baths < 0 || baths > 20) return null;
  return {
    beds,
    baths,
    line1: parts[2],
    suburb: parts[3],
    city: parts.slice(4).join(', '),
  };
}

function parseEmailAndName(
  text: string
): { email: string; firstName: string; lastName: string } | null {
  const m = text.match(/[^\s,]+@[^\s,]+\.[^\s,]+/);
  if (!m) return null;
  const email = m[0].toLowerCase();
  const rest = text.replace(m[0], '').replace(/^[\s,]+/, '').trim();
  const nameParts = rest.split(/\s+/).filter(Boolean);
  if (nameParts.length < 1) return null;
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ') || firstName;
  return { email, firstName, lastName };
}

function parseYesNo(text: string): 'yes' | 'no' | null {
  const s = text.trim().toLowerCase();
  if (/^(yes|y|1|ok|confirm|👍)$/.test(s)) return 'yes';
  if (/^(no|n|2)$/.test(s)) return 'no';
  return null;
}

function parseChoiceIndex(text: string, max: number): number | null {
  const n = parseInt(text.trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > max) return null;
  return n;
}

function freqLabel(f: string | undefined): string {
  if (f === 'weekly') return 'Weekly';
  return 'Once-off';
}

function buildSnapshotPayload(data: Record<string, unknown>): Record<string, unknown> {
  return {
    service: WA_SERVICE,
    date: data.selectedDate,
    time: data.selectedTime,
    bedrooms: data.bedrooms,
    bathrooms: data.bathrooms,
    extraRooms: 0,
    extras: [],
    extrasQuantities: {},
    frequency: data.frequency ?? 'one-time',
    tipAmount: 0,
    discountAmount: 0,
    numberOfCleaners: 1,
    teamSize: 1,
    pricingMode: 'premium',
    provideEquipment: true,
    address: {
      suburb: data.suburb,
      city: data.city,
      line1: data.addressLine1 ?? 'Address via WhatsApp',
    },
    customerEmail: data.email,
  };
}

function buildPendingBody(
  phoneE164: string,
  data: Record<string, unknown>,
  snap: {
    pricing_snapshot_id: string;
    pricing_hash: string;
    pricing_expires_at: string;
    pricing_version: string;
    price_zar: number;
  },
  idempotencyKey: string
): BookingState {
  const body = {
    step: 4,
    service: WA_SERVICE,
    bedrooms: Number(data.bedrooms),
    bathrooms: Number(data.bathrooms),
    extraRooms: 0,
    extras: [],
    extrasQuantities: {},
    notes: 'Booked via WhatsApp',
    date: String(data.selectedDate),
    time: String(data.selectedTime),
    frequency: (data.frequency as BookingState['frequency']) ?? 'one-time',
    firstName: String(data.firstName),
    lastName: String(data.lastName),
    email: String(data.email),
    phone: phoneE164,
    address: {
      line1: String(data.addressLine1 ?? 'Address via WhatsApp'),
      suburb: String(data.suburb),
      city: String(data.city),
    },
    totalAmount: snap.price_zar,
    pricing_snapshot_id: snap.pricing_snapshot_id,
    pricing_hash: snap.pricing_hash,
    pricing_expires_at: snap.pricing_expires_at,
    pricing_version: snap.pricing_version,
    pricingMode: 'premium',
    numberOfCleaners: 1,
    tipAmount: 0,
    discountAmount: 0,
    idempotency_key: idempotencyKey,
  };
  return body as BookingState;
}

async function runStep(
  supabase: SupabaseClient<Database>,
  phoneE164: string,
  text: string,
  row: WhatsAppBookingSessionRow
): Promise<BookingFlowResult> {
  const step = row.step as BookingFlowStep;
  let data = { ...(row.data as Record<string, unknown>) };

  if (RESET_RE.test(text)) {
    await resetBookingSession(supabase, phoneE164);
    return {
      reply: `Starting fresh.\n1 — Once-off\n2 — Regular / weekly\n\nReply with 1 or 2.`,
      step: 'start',
      data: {},
    };
  }

  if (step === 'completed') {
    if (BOOK_RE.test(text.trim())) {
      return {
        reply: `Shalean booking\n1 — Once-off\n2 — Regular / weekly`,
        step: 'start',
        data: {},
      };
    }
    return {
      reply: `You're all set. Type BOOK anytime to make another reservation.`,
      step: 'completed',
      data,
    };
  }

  if (step === 'payment_pending') {
    if (RESET_RE.test(text)) {
      await resetBookingSession(supabase, phoneE164);
      return {
        reply: `Starting fresh.\n1 — Once-off\n2 — Regular / weekly`,
        step: 'start',
        data: {},
      };
    }
    if (BOOK_RE.test(text.trim())) {
      return {
        reply: `Shalean booking\n1 — Once-off\n2 — Regular / weekly`,
        step: 'start',
        data: {},
      };
    }
    return {
      reply: `Payment still pending. Open the Paystack link we sent, or pay from your dashboard.\nType RESET to cancel this session.`,
      step: 'payment_pending',
      data,
    };
  }

  if (step === 'start') {
    const freq = parseServiceChoice(text);
    if (!freq) {
      return {
        reply: `Hi! Book a clean in a few taps.\n1 — Once-off\n2 — Regular (weekly)\n\nReply 1 or 2. (Reset: type RESET)`,
        step: 'start',
        data: {},
      };
    }
    const frequency = freq === 'weekly' ? 'weekly' : 'one-time';
    data = { ...data, frequency };
    return {
      reply: `Great — ${freqLabel(frequency)} Standard clean.\n\nSend your home details in ONE line:\nbeds, baths, street, suburb, city\nExample: 2, 1, 12 Oak Rd, Claremont, Cape Town`,
      step: 'home_details',
      data,
    };
  }

  if (step === 'home_details') {
    const parsed = parseHomeLine(text);
    if (!parsed) {
      return {
        reply: `Please use: beds, baths, street, suburb, city\nExample: 2, 1, 12 Oak Rd, Claremont, Cape Town`,
        step: 'home_details',
        data,
      };
    }
    data = {
      ...data,
      bedrooms: parsed.beds,
      bathrooms: parsed.baths,
      addressLine1: parsed.line1,
      suburb: parsed.suburb,
      city: parsed.city,
    };

    const dates = await findNextAvailableDates(supabase, {
      serviceType: WA_SERVICE,
      count: 3,
      maxDays: 28,
    });

    if (dates.length === 0) {
      return {
        reply: `No open days found in the next few weeks. Try again later or book online: ${bookingSiteUrl()}`,
        step: 'start',
        data: {},
      };
    }

    data.dateOptions = dates;
    const lines = dates.map((d, i) => `${i + 1} — ${d}`).join('\n');
    return {
      reply: `Pick a date:\n${lines}\n\nReply 1–${dates.length}`,
      step: 'date_selection',
      data,
    };
  }

  if (step === 'date_selection') {
    const opts = (data.dateOptions as string[]) || [];
    const idx = parseChoiceIndex(text, opts.length);
    if (idx == null) {
      return {
        reply: `Reply with 1, 2, or 3 to choose a date.`,
        step: 'date_selection',
        data,
      };
    }
    const selectedDate = opts[idx - 1];
    data.selectedDate = selectedDate;
    data.timeOptions = [...WA_TIME_SLOTS];
    const tl = WA_TIME_SLOTS.map((t, i) => `${i + 1} — ${t}`).join('\n');
    return {
      reply: `Date ${selectedDate}. Pick a start time:\n${tl}\n\nReply 1–4`,
      step: 'time_selection',
      data,
    };
  }

  if (step === 'time_selection') {
    const opts = (data.timeOptions as string[]) || [...WA_TIME_SLOTS];
    const idx = parseChoiceIndex(text, opts.length);
    if (idx == null) {
      return {
        reply: `Reply 1–4 to pick a time slot.`,
        step: 'time_selection',
        data,
      };
    }
    data.selectedTime = opts[idx - 1];
    data.confirmationSubstep = 'contact';
    return {
      reply: `Almost there. Send your email and first name:\nExample: you@email.com, Thandi`,
      step: 'confirmation',
      data,
    };
  }

  if (step === 'confirmation') {
    const sub = (data.confirmationSubstep as string) || 'contact';

    if (sub === 'contact') {
      const contact = parseEmailAndName(text);
      if (!contact) {
        return {
          reply: `Need a valid email and name.\nExample: you@email.com, Thandi Nkosi`,
          step: 'confirmation',
          data,
        };
      }
      data.email = contact.email;
      data.firstName = contact.firstName;
      data.lastName = contact.lastName;

      const env = validatePendingBookingEnv();
      if (!env.valid) {
        await resetBookingSession(supabase, phoneE164);
        return {
          reply: `Booking is temporarily unavailable. Please complete online: ${bookingSiteUrl()}`,
          step: 'start',
          data: {},
        };
      }

      const snapRes = await postCreatePricingSnapshot(buildSnapshotPayload(data));
      if (!snapRes.ok) {
        return {
          reply: `Couldn't price that just now. Adjust details or try ${bookingSiteUrl()}\nError: ${snapRes.error}`,
          step: 'confirmation',
          data: { ...data, confirmationSubstep: 'contact' },
        };
      }

      data.pricing_snapshot_id = snapRes.pricing_snapshot_id;
      data.pricing_hash = snapRes.pricing_hash;
      data.pricing_expires_at = snapRes.pricing_expires_at;
      data.pricing_version = snapRes.pricing_version;
      data.price_zar = snapRes.price_zar;
      data.confirmationSubstep = 'priced';

      const summary = [
        `Summary`,
        `Service: Standard (${freqLabel(data.frequency as string)})`,
        `Rooms: ${data.bedrooms} bed, ${data.bathrooms} bath`,
        `When: ${data.selectedDate} ${data.selectedTime}`,
        `Total: R${Number(snapRes.price_zar).toFixed(2)}`,
        ``,
        `Confirm? Reply YES or NO`,
      ].join('\n');

      return {
        reply: summary,
        step: 'confirmation',
        data,
      };
    }

    if (sub === 'priced') {
      const yn = parseYesNo(text);
      if (!yn) {
        return {
          reply: `Reply YES to book or NO to cancel.`,
          step: 'confirmation',
          data,
        };
      }
      if (yn === 'no') {
        await resetBookingSession(supabase, phoneE164);
        return {
          reply: `Cancelled. When you're ready: ${bookingSiteUrl()}\n\nType RESET to start again.`,
          step: 'start',
          data: {},
        };
      }

      const idempotencyKey = `whatsapp_${row.id}`;
      const pending = buildPendingBody(
        phoneE164,
        data,
        {
          pricing_snapshot_id: String(data.pricing_snapshot_id),
          pricing_hash: String(data.pricing_hash),
          pricing_expires_at: String(data.pricing_expires_at),
          pricing_version: String(data.pricing_version),
          price_zar: Number(data.price_zar),
        },
        idempotencyKey
      );

      const res = await postPendingBooking(pending);
      if (!res.ok) {
        await resetBookingSession(supabase, phoneE164);
        return {
          reply: `We couldn't finalize: ${res.error || 'Unknown error'}\nStart again (RESET) or book online: ${bookingSiteUrl()}`,
          step: 'start',
          data: {},
        };
      }

      const pay = await initializePaystackForWhatsAppBooking({
        bookingId: res.bookingId,
        phoneE164,
      });

      const sentAt = new Date().toISOString();
      const baseData = {
        lastBookingId: res.bookingId,
        payment_link_sent_at: sentAt,
        payment_reminder_sent: false,
      };

      if (pay.ok) {
        return {
          reply: [
            `Booking ${res.bookingId} — total R${Number(data.price_zar).toFixed(2)}.`,
            `Pay now (secure link):`,
            pay.authorization_url,
            ``,
            `We WhatsApp you when payment clears.`,
          ].join('\n'),
          step: 'payment_pending',
          data: baseData,
        };
      }

      return {
        reply: [
          `Booking ${res.bookingId} created.`,
          `We couldn't open Paystack: ${pay.error}`,
          `Pay online: ${bookingSiteUrl()} or your email receipt.`,
        ].join('\n'),
        step: 'payment_pending',
        data: { ...baseData, pay_init_failed: true },
      };
    }
  }

  await resetBookingSession(supabase, phoneE164);
  return {
    reply: `Something went wrong — starting over.\n1 — Once-off\n2 — Regular`,
    step: 'start',
    data: {},
  };
}

/**
 * Main WhatsApp booking state machine. Loads session by phone, runs one transition, persists state.
 */
export async function processWhatsAppBookingMessage(
  supabase: SupabaseClient<Database>,
  phoneE164: string,
  text: string
): Promise<BookingFlowResult> {
  let row = await loadBookingSession(supabase, phoneE164);
  if (!row) {
    row = await upsertBookingSession(supabase, {
      phoneE164,
      step: 'start',
      data: {},
    });
  }
  if (!row) {
    return {
      reply: `Please try again in a moment or book online: ${bookingSiteUrl()}`,
      step: 'start',
      data: {},
    };
  }

  try {
    const out = await runStep(supabase, phoneE164, text, row);
    await upsertBookingSession(supabase, {
      phoneE164,
      step: out.step,
      data: out.data,
    });
    return out;
  } catch (e) {
    console.error('[whatsapp booking-flow]', e);
    await resetBookingSession(supabase, phoneE164);
    return {
      reply: `That didn't work — starting fresh.\n1 — Once-off\n2 — Regular`,
      step: 'start',
      data: {},
    };
  }
}
