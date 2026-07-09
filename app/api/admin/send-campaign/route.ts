import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { assertAdmin, createServiceClientForSchema } from '@/lib/supabase-server';
import { runMarketingCampaign } from '@/lib/email/run-campaign';
import type { CampaignSegment } from '@/lib/email/marketing-segments';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const SEGMENTS: CampaignSegment[] = [
  'all_users',
  'no_bookings',
  'active_users',
  'inactive_users',
];

function isSegment(s: string): s is CampaignSegment {
  return (SEGMENTS as string[]).includes(s);
}

export async function POST(req: NextRequest) {
  const denied = await assertAdmin();
  if (denied) return denied;

  let body: { subject?: string; html?: string; segment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const html = typeof body.html === 'string' ? body.html.trim() : '';
  const segmentRaw = typeof body.segment === 'string' ? body.segment.trim() : '';

  if (!subject || !html || !segmentRaw || !isSegment(segmentRaw)) {
    return NextResponse.json(
      { ok: false, error: 'subject, html, and a valid segment are required' },
      { status: 400 },
    );
  }

  const payload = { subject, html, segment: segmentRaw };

  after(async () => {
    try {
      const svc = createServiceClientForSchema();
      await runMarketingCampaign(svc, payload);
    } catch (e) {
      console.error('[admin] send-campaign background', e);
    }
  });

  return NextResponse.json({
    ok: true,
    queued: true,
    message: 'Campaign queued for background delivery',
    segment: segmentRaw,
  });
}
