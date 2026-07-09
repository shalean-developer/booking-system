import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { assertAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CAMPAIGN_TYPES = ['promo', 'discount', 'reminder'] as const;

export async function POST(req: NextRequest) {
  const denied = await assertAdmin();
  if (denied) return denied;

  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { ok: false, error: 'OPENAI_API_KEY is not configured' },
      { status: 500 },
    );
  }

  let body: { campaign_type?: string; audience?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const campaignType =
    typeof body.campaign_type === 'string' ? body.campaign_type.trim().toLowerCase() : '';
  const audience = typeof body.audience === 'string' ? body.audience.trim() : '';

  if (!CAMPAIGN_TYPES.includes(campaignType as (typeof CAMPAIGN_TYPES)[number])) {
    return NextResponse.json(
      { ok: false, error: 'campaign_type must be promo, discount, or reminder' },
      { status: 400 },
    );
  }
  if (!audience) {
    return NextResponse.json({ ok: false, error: 'audience is required' }, { status: 400 });
  }

  const client = new OpenAI({ apiKey: key });

  const system = `You are an expert email marketer for Shalean, a home cleaning service in South Africa.
Return ONLY valid JSON with keys "subject" (string) and "html" (string).
The html must be a single marketing email: responsive-friendly HTML using inline styles, a clear headline, trust cues (vetted cleaners, insured, local), urgency where appropriate, and one primary CTA button linking to https://shalean.com/book
Include a small footer line with an unsubscribe link to https://shalean.com/unsubscribe?email={{email}}
Do not include markdown code fences.`;

  const user = `Write a high-converting marketing email.
Campaign style: ${campaignType}
Target audience: ${audience}
Tone: professional, warm, South African English. Currency ZAR when mentioning price.`;

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MARKETING_MODEL?.trim() || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      return NextResponse.json({ ok: false, error: 'Empty model response' }, { status: 502 });
    }

    const parsed = JSON.parse(raw) as { subject?: string; html?: string };
    const subject = typeof parsed.subject === 'string' ? parsed.subject.trim() : '';
    const html = typeof parsed.html === 'string' ? parsed.html.trim() : '';
    if (!subject || !html) {
      return NextResponse.json({ ok: false, error: 'Invalid JSON shape from model' }, { status: 502 });
    }

    return NextResponse.json({ ok: true, subject, html });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'OpenAI error';
    console.error('[generate-email]', msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
