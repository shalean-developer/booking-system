import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type WhatsAppBookingSessionRow = Database['public']['Tables']['whatsapp_booking_sessions']['Row'];

type Client = SupabaseClient<Database>;

export async function loadBookingSession(
  supabase: Client,
  phoneE164: string
): Promise<WhatsAppBookingSessionRow | null> {
  const { data, error } = await supabase
    .from('whatsapp_booking_sessions')
    .select('*')
    .eq('phone_e164', phoneE164)
    .maybeSingle();

  if (error) {
    console.error('[whatsapp_booking_sessions] load', error);
    return null;
  }
  return data;
}

export async function upsertBookingSession(
  supabase: Client,
  params: {
    phoneE164: string;
    userId?: string | null;
    step: string;
    data: Record<string, unknown>;
  }
): Promise<WhatsAppBookingSessionRow | null> {
  const row = {
    phone_e164: params.phoneE164,
    user_id: params.userId ?? null,
    step: params.step,
    data: params.data,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('whatsapp_booking_sessions')
    .upsert(row, { onConflict: 'phone_e164' })
    .select()
    .single();

  if (error) {
    console.error('[whatsapp_booking_sessions] upsert', error);
    return null;
  }
  return data;
}

export async function resetBookingSession(
  supabase: Client,
  phoneE164: string
): Promise<void> {
  await upsertBookingSession(supabase, {
    phoneE164,
    step: 'start',
    data: {},
  });
}
