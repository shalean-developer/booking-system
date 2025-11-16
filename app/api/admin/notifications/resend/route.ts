import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { sendWhatsAppTemplate } from '@/lib/notifications/whatsapp';
import { logNotification } from '@/lib/notifications/log';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 });
    }
    const svc = createServiceClient();
    const { data, error } = await svc
      .from('notification_logs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) {
      return NextResponse.json({ ok: false, error: 'Log not found' }, { status: 404 });
    }

    // Only WhatsApp resend supported for now
    if (data.channel !== 'whatsapp') {
      return NextResponse.json({ ok: false, error: 'Only WhatsApp resend supported' }, { status: 400 });
    }

    const payload = data.payload || {};
    const res = await sendWhatsAppTemplate(payload);
    await logNotification({
      channel: 'whatsapp',
      template: data.template || undefined,
      recipient_type: data.recipient_type || undefined,
      recipient_phone: data.recipient_phone || undefined,
      booking_id: data.booking_id || undefined,
      payload,
      ok: res.ok,
      status: res.status ?? null,
      error: res.error ?? null,
    });

    return NextResponse.json({ ok: res.ok, status: res.status ?? null, error: res.error ?? null });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


