import { createServiceClient } from '@/lib/supabase-server';

export async function logNotification(entry: {
  channel: 'whatsapp' | 'email' | 'system';
  template?: string;
  recipient_type?: 'cleaner' | 'customer' | 'admin';
  recipient_phone?: string | null;
  recipient_email?: string | null;
  booking_id?: string | null;
  payload?: unknown;
  ok: boolean;
  status?: number | null;
  error?: string | null;
}) {
  try {
    const supabase = createServiceClient();
    const payloadValue =
      entry.payload === undefined || entry.payload === null
        ? null
        : typeof entry.payload === 'string'
          ? entry.payload
          : (entry.payload as Record<string, unknown>);
    await supabase.from('notification_logs').insert({
      channel: entry.channel,
      template: entry.template ?? null,
      recipient_type: entry.recipient_type ?? null,
      recipient_phone: entry.recipient_phone ?? null,
      recipient_email: entry.recipient_email ?? null,
      booking_id: entry.booking_id ?? null,
      payload: payloadValue,
      ok: entry.ok,
      status: entry.status ?? null,
      error: entry.error ?? null,
    });
  } catch {
    // swallow logging errors
  }
}


