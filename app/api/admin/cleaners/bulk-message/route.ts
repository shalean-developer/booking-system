import { NextRequest, NextResponse } from 'next/server';
import { isAdmin, createServiceClient } from '@/lib/supabase-server';
import { sendWhatsAppTemplate } from '@/lib/notifications/whatsapp';
import { logNotification } from '@/lib/notifications/log';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/cleaners/bulk-message
 * Send bulk messages to multiple cleaners
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { cleanerIds, message, channel = 'whatsapp' } = body;

    if (!cleanerIds || !Array.isArray(cleanerIds) || cleanerIds.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'cleanerIds array is required' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { ok: false, error: 'message is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch cleaner phone numbers
    const { data: cleaners, error: cleanersError } = await supabase
      .from('cleaners')
      .select('id, name, phone')
      .in('id', cleanerIds);

    if (cleanersError) {
      console.error('Error fetching cleaners:', cleanersError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch cleaners' },
        { status: 500 }
      );
    }

    // Filter out cleaners without valid phone numbers
    const validCleaners = cleaners.filter((c) => c.phone && c.phone.trim().length > 0);
    
    if (validCleaners.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No cleaners with valid phone numbers found' },
        { status: 400 }
      );
    }

    // Send messages
    const results = await Promise.allSettled(
      validCleaners.map(async (cleaner) => {
        try {
          if (channel === 'whatsapp' && process.env.ENABLE_WHATSAPP === 'true') {
            // Send WhatsApp message
            // Note: Using a generic notification template. Create 'admin_message' template in WhatsApp Business API
            // For now, we'll use a fallback approach - log the message if template doesn't exist
            const result = await sendWhatsAppTemplate({
              to: cleaner.phone,
              template: 'admin_message', // TODO: Create this template in WhatsApp Business API
              language: 'en',
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: cleaner.name },
                    { type: 'text', text: message },
                  ],
                },
              ],
            });

            // If template doesn't exist, log it for now
            if (!result.ok && result.error?.includes('template')) {
              console.warn(`WhatsApp template 'admin_message' not found. Message for ${cleaner.name}: ${message}`);
              // Still log as attempted
              await logNotification({
                channel: 'whatsapp',
                recipient_type: 'cleaner',
                recipient_phone: cleaner.phone,
                template: 'admin_message',
                payload: { message },
                ok: false,
                status: 400,
                error: 'Template not found',
              });
              return { cleanerId: cleaner.id, status: 'skipped', error: 'Template not found' };
            }

            // Log notification
            await logNotification({
              channel: 'whatsapp',
              recipient_type: 'cleaner',
              recipient_phone: cleaner.phone,
              template: 'admin_message',
              payload: { message },
              ok: result.ok,
              status: result.status ?? null,
              error: result.error ?? null,
            });

            return { cleanerId: cleaner.id, status: 'sent' };
          } else {
            // For now, just log (email integration can be added later)
            console.log(`Would send ${channel} to ${cleaner.name} (${cleaner.phone}): ${message}`);
            await logNotification({
              channel: channel as 'email' | 'whatsapp',
              recipient_type: 'cleaner',
              recipient_phone: cleaner.phone,
              template: 'admin_message',
              payload: { message },
              ok: true,
              status: null,
              error: null,
            });
            return { cleanerId: cleaner.id, status: 'logged' };
          }
        } catch (error: any) {
          console.error(`Error sending message to ${cleaner.id}:`, error);
          return { cleanerId: cleaner.id, status: 'failed', error: error.message };
        }
      })
    );

    const sent = results.filter((r) => r.status === 'fulfilled' && r.value.status === 'sent').length;
    const skipped = results.filter((r) => r.status === 'fulfilled' && r.value.status === 'skipped').length;
    const failed = results.filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status === 'failed')).length;

    return NextResponse.json({
      ok: true,
      total: validCleaners.length,
      sent,
      skipped,
      failed,
      invalid_phones: cleaners.length - validCleaners.length,
      results: results.map((r) =>
        r.status === 'fulfilled' ? r.value : { status: 'failed', error: 'Unknown error' }
      ),
    });
  } catch (error: any) {
    console.error('Error in bulk message:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to send bulk messages' },
      { status: 500 }
    );
  }
}


