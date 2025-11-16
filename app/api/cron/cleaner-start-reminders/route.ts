import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { sendWhatsAppTemplate } from '@/lib/notifications/whatsapp';
import { logNotification } from '@/lib/notifications/log';

export const dynamic = 'force-dynamic';

function toIsoFromDateAndTime(dateStr: string, timeStr: string): string | null {
  try {
    // Expect time like "08:30" or "08:30 AM"; handle both
    let hours = 0;
    let minutes = 0;
    const parts = timeStr.trim().split(' ');
    const hm = parts[0];
    const ampm = (parts[1] || '').toUpperCase();
    const [h, m] = hm.split(':').map((v) => parseInt(v, 10));
    if (isNaN(h) || isNaN(m)) return null;
    hours = h;
    minutes = m;
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    const d = new Date(dateStr);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const svc = createServiceClient();

    // 1) Find bookings starting within next 60 minutes, not yet reminded, acceptable statuses
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

    // Pull candidates broadly and filter in code to avoid SQL time parsing differences
    const { data: rows, error } = await svc
      .from('bookings')
      .select('*')
      .in('status', ['accepted', 'on_my_way'])
      .eq('cleaner_start_reminder_sent', false)
      .limit(500);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const due = (rows || []).filter((b) => {
      const iso = toIsoFromDateAndTime(b.booking_date, b.booking_time);
      if (!iso) return false;
      const start = new Date(iso);
      return start >= now && start <= inOneHour;
    });

    let sentCount = 0;

    for (const b of due) {
      try {
        // Check cleaner preferences
        if (!b.cleaner_id) continue;
        const { data: prefs } = await svc
          .from('notification_preferences')
          .select('whatsapp_opt_in, phone')
          .eq('cleaner_id', b.cleaner_id)
          .maybeSingle();
        const phone = (prefs?.phone || b.customer_phone || '').trim();
        const optIn = prefs?.whatsapp_opt_in === true;
        if (!optIn || !phone) continue;

        const address = [b.address_line1, b.address_suburb, b.address_city].filter(Boolean).join(', ');

        const waPayload = {
          to: phone,
          template: 'cleaner_start_reminder',
          language: 'en',
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: b.service_type || 'Cleaning' }, // {{1}} serviceType
                { type: 'text', text: b.booking_time },               // {{2}} time
                { type: 'text', text: b.booking_date },               // {{3}} date
                { type: 'text', text: address },                      // {{4}} address
                { type: 'text', text: `https://shalean.co.za/cleaner/dashboard/my-jobs?ref=${b.id}` }, // {{5}} link
              ],
            },
          ],
        };
        const res = await sendWhatsAppTemplate(waPayload as any);
        await logNotification({
          channel: 'whatsapp',
          template: 'cleaner_start_reminder',
          recipient_type: 'cleaner',
          recipient_phone: phone,
          booking_id: b.id,
          payload: waPayload,
          ok: res.ok,
          status: res.status ?? null,
          error: res.error ?? null,
        });

        // Mark as sent
        await svc
          .from('bookings')
          .update({ cleaner_start_reminder_sent: true })
          .eq('id', b.id);

        sentCount += 1;
      } catch {
        // continue
      }
    }

    return NextResponse.json({ ok: true, checked: rows?.length || 0, sent: sentCount });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


