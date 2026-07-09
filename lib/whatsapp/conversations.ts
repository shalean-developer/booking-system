import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type Client = SupabaseClient<Database>;

export async function loadConversation(
  supabase: Client,
  phoneE164: string
): Promise<{ last_intent: string | null; last_message: string | null } | null> {
  const { data, error } = await supabase
    .from('whatsapp_conversations')
    .select('last_intent, last_message')
    .eq('phone_e164', phoneE164)
    .maybeSingle();

  if (error) {
    console.error('[whatsapp_conversations] load', error);
    return null;
  }
  return data;
}

export async function saveConversation(
  supabase: Client,
  params: {
    phoneE164: string;
    lastIntent: string;
    lastMessage: string;
    lastReply: string;
  }
): Promise<void> {
  const { error } = await supabase.from('whatsapp_conversations').upsert(
    {
      phone_e164: params.phoneE164,
      last_intent: params.lastIntent,
      last_message: params.lastMessage,
      last_reply: params.lastReply,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'phone_e164' }
  );

  if (error) {
    console.error('[whatsapp_conversations] upsert', error);
  }
}
