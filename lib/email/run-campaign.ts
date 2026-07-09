import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import {
  fetchCampaignRecipients,
  type CampaignSegment,
} from '@/lib/email/marketing-segments';
import { deliverSmartMessage, resolveUserIdByEmail } from '@/lib/marketing/delivery';
import { htmlToPlainText } from '@/lib/marketing/html-to-text';

type Svc = SupabaseClient<Database>;

const BATCH = 50;
const DELAY_MS = 750;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function runMarketingCampaign(
  svc: Svc,
  params: { subject: string; html: string; segment: CampaignSegment },
): Promise<{ attempted: number; sent: number; failed: number }> {
  const recipients = await fetchCampaignRecipients(svc, params.segment);

  const { data: campaign, error: cErr } = await svc
    .from('email_campaigns')
    .insert({
      subject: params.subject,
      segment: params.segment,
    })
    .select('id')
    .single();

  if (cErr || !campaign?.id) {
    console.error('[marketing] campaign insert', cErr?.message);
    throw new Error(cErr?.message || 'Failed to create campaign');
  }

  const campaignId = campaign.id;
  let sent = 0;
  let failed = 0;
  const attempted = recipients.length;
  const waBody = htmlToPlainText(params.html).slice(0, 4000);

  console.log('[marketing] campaign start', {
    segment: params.segment,
    attempted,
    campaignId,
  });

  for (let i = 0; i < recipients.length; i += BATCH) {
    const chunk = recipients.slice(i, i + BATCH);
    for (const r of chunk) {
      const userId = await resolveUserIdByEmail(svc, r.email);
      const result = await deliverSmartMessage(svc, {
        userId,
        email: r.email,
        subject: params.subject,
        html: params.html,
        whatsappBody: waBody,
        campaignId,
      });
      if (result.ok) sent += 1;
      else {
        failed += 1;
        if (result.error !== 'unsubscribed') {
          console.warn('[marketing] campaign fail', r.email, result.error);
        }
      }
    }
    if (i + BATCH < recipients.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log('[marketing] campaign done', { attempted, sent, failed, campaignId });
  return { attempted, sent, failed };
}
