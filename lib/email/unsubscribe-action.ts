import 'server-only';

import { createServiceClientForSchema } from '@/lib/supabase-server';
import { setSubscriberUnsubscribed } from '@/lib/email/marketing-events';

export async function unsubscribeByEmailParam(email: string): Promise<{ ok: boolean; error?: string }> {
  const svc = createServiceClientForSchema();
  return setSubscriberUnsubscribed(svc, email);
}
