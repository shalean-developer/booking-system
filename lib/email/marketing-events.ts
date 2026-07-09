import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { repeatCustomerEmail, welcomeEmail } from '@/emails/templates';
import {
  bookingConfirmedWhatsAppMessage,
  deliverSmartMessage,
  repeatCustomerWhatsAppMessage,
  welcomeWhatsAppMessage,
} from '@/lib/marketing/delivery';

type Svc = SupabaseClient<Database>;

export const MARKETING_EVENT = {
  signup: 'signup',
  bookingCreated: 'booking_created',
  bookingCompleted: 'booking_completed',
  marketingWelcomeSent: 'marketing_welcome_sent',
  marketingNudgeSent: 'marketing_nudge_sent',
  marketingReengagementSent: 'marketing_reengagement_sent',
  marketingRepeatSent: 'marketing_repeat_sent',
} as const;

export async function resolveAuthUserIdForMarketing(
  svc: Svc,
  params: { authUserId?: string | null; customerId?: string | null },
): Promise<string | null> {
  if (params.authUserId) return params.authUserId;
  if (!params.customerId) return null;
  const { data } = await svc
    .from('customers')
    .select('auth_user_id')
    .eq('id', params.customerId)
    .maybeSingle();
  const uid = data?.auth_user_id;
  return typeof uid === 'string' && uid ? uid : null;
}

export async function upsertSubscriber(
  svc: Svc,
  params: { email: string; name: string | null },
): Promise<void> {
  const email = params.email.trim().toLowerCase();
  if (!email) return;
  const { error } = await svc.from('email_subscribers').upsert(
    {
      email,
      name: params.name?.trim() || null,
      subscribed: true,
    },
    { onConflict: 'email' },
  );
  if (error) {
    console.warn('[marketing] upsertSubscriber', error.message);
  }
}

export async function recordEmailEvent(
  svc: Svc,
  userId: string,
  eventType: string,
): Promise<boolean> {
  const { error } = await svc.from('email_events').insert({
    user_id: userId,
    event_type: eventType,
  });
  if (!error) return true;
  if (error.code === '23505') {
    return false;
  }
  console.warn('[marketing] recordEmailEvent', eventType, error.message);
  return false;
}

export async function hasEvent(svc: Svc, userId: string, eventType: string): Promise<boolean> {
  const { data, error } = await svc
    .from('email_events')
    .select('id')
    .eq('user_id', userId)
    .eq('event_type', eventType)
    .maybeSingle();
  if (error) {
    console.warn('[marketing] hasEvent', error.message);
    return false;
  }
  return Boolean(data?.id);
}

async function sendWelcomeIfNeeded(
  svc: Svc,
  params: { authUserId: string; email: string; displayName: string },
): Promise<void> {
  if (await hasEvent(svc, params.authUserId, MARKETING_EVENT.marketingWelcomeSent)) {
    return;
  }
  const html = welcomeEmail(params.displayName, params.email);
  const subject = 'Welcome to Shalean';
  const r = await deliverSmartMessage(svc, {
    userId: params.authUserId,
    email: params.email,
    subject,
    html,
    whatsappBody: welcomeWhatsAppMessage(params.displayName),
  });
  if (r.ok) {
    await recordEmailEvent(svc, params.authUserId, MARKETING_EVENT.marketingWelcomeSent);
  } else {
    console.warn('[marketing] welcome delivery failed', r.error);
  }
}

export async function onCustomerSignup(svc: Svc, params: {
  authUserId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
}): Promise<void> {
  const name = [params.firstName, params.lastName].filter(Boolean).join(' ').trim() || null;
  const displayName = name || 'there';
  await upsertSubscriber(svc, { email: params.email, name });

  const insertedSignup = await recordEmailEvent(svc, params.authUserId, MARKETING_EVENT.signup);
  if (!insertedSignup) {
    await sendWelcomeIfNeeded(svc, {
      authUserId: params.authUserId,
      email: params.email,
      displayName,
    });
    return;
  }

  await sendWelcomeIfNeeded(svc, {
    authUserId: params.authUserId,
    email: params.email,
    displayName,
  });
}

export async function onBookingCreated(
  svc: Svc,
  userId: string,
  opts?: { bookingDate?: string; bookingTime?: string },
): Promise<void> {
  await recordEmailEvent(svc, userId, MARKETING_EVENT.bookingCreated);

  const { data: cust } = await svc
    .from('customers')
    .select('email')
    .eq('auth_user_id', userId)
    .maybeSingle();
  const email = cust?.email?.trim();
  if (!email) return;

  const dateStr = opts?.bookingDate?.trim() || 'your scheduled date';
  const timeStr = opts?.bookingTime?.trim();
  const line = bookingConfirmedWhatsAppMessage(dateStr, timeStr);
  const safe = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `<p style="margin:0;font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;">${safe}</p>`;

  await deliverSmartMessage(svc, {
    userId,
    email,
    subject: 'Your cleaning is confirmed',
    html,
    whatsappBody: line,
  });
}

export async function onBookingCompleted(svc: Svc, params: {
  userId: string;
  customerEmail: string;
  customerName: string | null;
}): Promise<void> {
  await recordEmailEvent(svc, params.userId, MARKETING_EVENT.bookingCompleted);

  if (await hasEvent(svc, params.userId, MARKETING_EVENT.marketingRepeatSent)) {
    return;
  }

  const html = repeatCustomerEmail(params.customerName || 'there', params.customerEmail);
  const r = await deliverSmartMessage(svc, {
    userId: params.userId,
    email: params.customerEmail,
    subject: 'Thanks for booking with Shalean',
    html,
    whatsappBody: repeatCustomerWhatsAppMessage(params.customerName || 'there'),
  });
  if (!r.ok) {
    console.warn('[marketing] repeat customer delivery failed', r.error);
    return;
  }

  await recordEmailEvent(svc, params.userId, MARKETING_EVENT.marketingRepeatSent);
}

export async function setSubscriberUnsubscribed(svc: Svc, email: string): Promise<{ ok: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, error: 'Email is required' };
  }
  const { error } = await svc
    .from('email_subscribers')
    .update({ subscribed: false })
    .eq('email', normalized);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
