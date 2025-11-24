import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Try admin_notifications table first, fallback to notification_logs
    let count = 0;
    
    // Check if admin_notifications table exists
    const { count: adminNotifCount, error: adminError } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (!adminError && adminNotifCount !== null) {
      count = adminNotifCount;
    } else {
      // Fallback to notification_logs
      const { count: logCount, error: logError } = await supabase
        .from('notification_logs')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);

      if (!logError && logCount !== null) {
        count = logCount;
      }
    }

    return NextResponse.json({
      ok: true,
      count,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({
      ok: true,
      count: 0,
    });
  }
}

