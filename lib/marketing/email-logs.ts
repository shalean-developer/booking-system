import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type Svc = SupabaseClient<Database>;

export type EmailLogChannel = 'email' | 'whatsapp';

export async function resolveUserIdByEmail(svc: Svc, email: string): Promise<string | null> {
  const { data } = await svc
    .from('customers')
    .select('auth_user_id')
    .ilike('email', email.trim())
    .maybeSingle();
  const uid = data?.auth_user_id;
  return typeof uid === 'string' && uid ? uid : null;
}

export async function createPendingLog(
  svc: Svc,
  params: {
    userId: string | null;
    email: string;
    subject: string;
    campaignId: string | null;
    channel: EmailLogChannel;
  },
): Promise<string | null> {
  const { data, error } = await svc
    .from('email_logs')
    .insert({
      user_id: params.userId,
      email: params.email.trim().toLowerCase(),
      subject: params.subject,
      campaign_id: params.campaignId,
      channel: params.channel,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[email_logs] createPendingLog', error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function markLogSent(svc: Svc, id: string): Promise<void> {
  await svc.from('email_logs').update({ status: 'sent', updated_at: new Date().toISOString() }).eq('id', id);
}

export async function markLogFailed(svc: Svc, id: string): Promise<void> {
  await svc.from('email_logs').update({ status: 'failed', updated_at: new Date().toISOString() }).eq('id', id);
}

export async function markLogOpened(svc: Svc, id: string): Promise<boolean> {
  const { data } = await svc.from('email_logs').select('status').eq('id', id).maybeSingle();
  const st = data?.status;
  if (st !== 'sent') return false;
  const { error } = await svc
    .from('email_logs')
    .update({ status: 'opened', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'sent');
  return !error;
}

export async function markLogClicked(svc: Svc, id: string): Promise<boolean> {
  const { error } = await svc
    .from('email_logs')
    .update({ status: 'clicked', updated_at: new Date().toISOString() })
    .in('id', [id])
    .in('status', ['sent', 'opened']);
  return !error;
}
