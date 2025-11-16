import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { createServiceClient } from '@/lib/supabase-server';
import { sendWhatsAppTemplate } from '@/lib/notifications/whatsapp';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const svc = createServiceClient();
    const cleaner_id = cleanerIdToUuid(session.id);

    const body = await req.json().catch(() => ({}));
    const overridePhone: string | undefined = body.phone;

    const { data: prefs } = await svc
      .from('notification_preferences')
      .select('whatsapp_opt_in, phone')
      .eq('cleaner_id', cleaner_id)
      .maybeSingle();

    const phone = (overridePhone || prefs?.phone || '').trim();
    if (!phone) {
      return NextResponse.json({ ok: false, error: 'No WhatsApp phone set' }, { status: 400 });
    }

    // Use status update template with sample values
    const res = await sendWhatsAppTemplate({
      to: phone,
      template: 'booking_status_update',
      language: 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'TEST-BOOKING' },
            { type: 'text', text: 'accepted' },
            { type: 'text', text: 'Standard clean' },
            { type: 'text', text: new Date().toISOString().slice(0, 10) },
            { type: 'text', text: '10:00 AM' },
            { type: 'text', text: 'Test Address, City' },
            { type: 'text', text: 'https://shalean.co.za/cleaner/dashboard/my-jobs' },
          ],
        },
      ],
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, error: res.error || 'Failed to send test' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, skipped: res.skipped || false });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


