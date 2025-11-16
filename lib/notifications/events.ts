import { createServiceClient } from '@/lib/supabase-server';
import { sendWhatsAppTemplate } from './whatsapp';
import { logNotification } from './log';

interface AssignedCleanerPayload {
  bookingId: string;
  cleanerId: string | null;
  cleanerName: string | null;
  date: string;
  time: string;
  addressLine1?: string | null;
  addressSuburb?: string | null;
  addressCity?: string | null;
  customerName?: string | null;
}

function formatAddress(line1?: string | null, suburb?: string | null, city?: string | null) {
  return [line1, suburb, city].filter(Boolean).join(', ');
}

export async function notifyCleanerAssignment(payload: AssignedCleanerPayload) {
  try {
    if (!payload.cleanerId) return;

    const supabase = createServiceClient();

    // Check cleaner preferences and phone
    const { data: cleaner, error: cleanerErr } = await supabase
      .from('cleaners')
      .select('id, name, phone')
      .eq('id', payload.cleanerId)
      .maybeSingle();
    if (cleanerErr || !cleaner) return;

    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('whatsapp_opt_in, phone')
      .eq('cleaner_id', payload.cleanerId)
      .maybeSingle();

    const phone = (prefs?.phone || cleaner.phone || '').trim();
    const whatsappEnabled = prefs?.whatsapp_opt_in === true;
    if (!whatsappEnabled || !phone) return;

    const addr = formatAddress(payload.addressLine1, payload.addressSuburb, payload.addressCity);
    // Use the cleaner template defined earlier
    const waPayload = {
      to: phone,
      template: 'booking_assigned_cleaner',
      language: 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: payload.cleanerName || cleaner.name || '' }, // {{1}} cleanerName
            { type: 'text', text: 'Cleaning' }, // {{2}} serviceType (fallback)
            { type: 'text', text: payload.date }, // {{3}} date
            { type: 'text', text: payload.time }, // {{4}} time
            { type: 'text', text: addr }, // {{5}} address
            { type: 'text', text: `https://shalean.co.za/cleaner/dashboard/my-jobs?ref=${payload.bookingId}` }, // {{6}} manageLink
          ],
        },
      ],
    };
    const res = await sendWhatsAppTemplate(waPayload as any);
    await logNotification({
      channel: 'whatsapp',
      template: 'booking_assigned_cleaner',
      recipient_type: 'cleaner',
      recipient_phone: phone,
      booking_id: payload.bookingId,
      payload: waPayload,
      ok: res.ok,
      status: res.status ?? null,
      error: res.error ?? null,
    });
  } catch {
    // Silent fail - notifications are best-effort
  }
}

export async function notifyCustomerAssignment(payload: {
  bookingId: string;
  customerName: string;
  date: string;
  time: string;
  addressLine1?: string | null;
  addressSuburb?: string | null;
  addressCity?: string | null;
  customerPhone?: string | null;
  customerId?: string | null;
}) {
  try {
    const supabase = createServiceClient();
    // Check customer opt-in if customerId provided
    if (payload.customerId) {
      const { data: cp } = await supabase
        .from('customer_notification_preferences')
        .select('whatsapp_opt_in')
        .eq('customer_id', payload.customerId)
        .maybeSingle();
      if (!cp?.whatsapp_opt_in) return;
    }
    const phone = (payload.customerPhone || '').trim();
    if (!phone) return;
    const addr = formatAddress(payload.addressLine1, payload.addressSuburb, payload.addressCity);
    // Template variant with header name and body bookingId.. adjust if needed
    const waPayload = {
      to: phone,
      template: 'booking_assigned_customer',
      language: 'en',
      components: [
        // If your template has header with name:
        // { type: 'header', parameters: [{ type: 'text', text: payload.customerName }] },
        {
          type: 'body',
          parameters: [
            { type: 'text', text: payload.customerName },       // {{1}} customerName
            { type: 'text', text: 'Cleaning' },                 // {{2}} serviceType
            { type: 'text', text: payload.date },               // {{3}} date
            { type: 'text', text: payload.time },               // {{4}} time
            { type: 'text', text: '' },                         // {{5}} cleanerName (optional blank)
            { type: 'text', text: addr },                       // {{6}} address
            { type: 'text', text: `https://shalean.co.za/bookings/${payload.bookingId}` }, // {{7}} link
          ],
        },
      ],
    } as const;
    const res = await sendWhatsAppTemplate(waPayload as any);
    await logNotification({
      channel: 'whatsapp',
      template: 'booking_assigned_customer',
      recipient_type: 'customer',
      recipient_phone: phone,
      booking_id: payload.bookingId,
      payload: waPayload,
      ok: res.ok,
      status: res.status ?? null,
      error: res.error ?? null,
    });
  } catch {
    // best-effort
  }
}


