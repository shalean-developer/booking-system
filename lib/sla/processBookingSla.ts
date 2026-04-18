import type { SupabaseClient } from '@supabase/supabase-js';
import { timeHmToMinutes } from '@/lib/booking-interval';
import { findFirstAvailableCleanerId } from '@/lib/dispatch/cleaner-dispatch';
import { checkBookingSLA, SLA_ISSUE_ON_WAY_NOT_STARTED } from '@/lib/sla/checkBookingSLA';
import { sendAdminNotification } from '@/lib/notifications/sendAdminNotification';
import { sendCustomerNotification } from '@/lib/notifications/sendCustomerNotification';
import { sendCleanerNotification } from '@/lib/notifications/sendCleanerNotification';

/** Bookings that can still breach accepted → en route → started SLA */
const ACTIVE_SLA_STATUSES = [
  'accepted',
  'assigned',
  'confirmed',
  'on_my_way',
  'in-progress',
] as const;

type BookingRow = {
  id: string;
  status: string;
  sla_status?: string | null;
  sla_severity?: string | null;
  sla_admin_notified_at?: string | null;
  sla_delay_customer_notified_at?: string | null;
  reassigned_at?: string | null;
  reassignment_count?: number | null;
  requires_team?: boolean | null;
  address_suburb?: string | null;
  booking_date?: string;
  booking_time?: string | null;
  start_time?: string | null;
  duration_minutes?: number | null;
  expected_end_time?: string | null;
  cleaner_id?: string | null;
  assigned_cleaner_id?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  [key: string]: unknown;
};

function resolveDurationMinutes(row: BookingRow): number {
  const dm = row.duration_minutes;
  if (typeof dm === 'number' && dm > 0) return dm;
  const bt = String(row.booking_time || '');
  const et = String(row.expected_end_time || '');
  if (bt && et) {
    const d = timeHmToMinutes(et) - timeHmToMinutes(bt);
    if (d > 0) return Math.min(d, 12 * 60);
  }
  return 180;
}

/**
 * Auto-reassign when the critical “on the way but not started” SLA fires.
 * Caps at 2 reassignments per booking (`reassignment_count`).
 */
async function tryAutomaticReassignment(
  supabase: SupabaseClient,
  row: BookingRow,
  issues: string[]
): Promise<boolean> {
  const status = String(row.status || '');
  if (row.requires_team === true) return false;
  if ((row.reassignment_count ?? 0) >= 2) return false;
  if (!issues.includes(SLA_ISSUE_ON_WAY_NOT_STARTED)) return false;
  if (status === 'in-progress' || status === 'completed') return false;

  const suburb = String(row.address_suburb || '').trim();
  if (!suburb) return false;

  const currentCleaner = String(row.cleaner_id || row.assigned_cleaner_id || '').trim();
  if (!currentCleaner) return false;

  const date = String(row.booking_date || '');
  const startTime = String(row.booking_time || '').slice(0, 5);
  if (!date || !startTime) return false;

  const duration = resolveDurationMinutes(row);

  const newCleanerId = await findFirstAvailableCleanerId(supabase, {
    date,
    startTime,
    durationMinutes: duration,
    areas: [suburb],
    excludeCleanerIds: [currentCleaner],
  });

  if (
    !newCleanerId ||
    newCleanerId === row.assigned_cleaner_id ||
    newCleanerId === row.cleaner_id
  ) {
    return false;
  }

  const now = new Date().toISOString();
  const nextCount = (row.reassignment_count ?? 0) + 1;

  const { error } = await supabase
    .from('bookings')
    .update({
      cleaner_id: newCleanerId,
      assigned_cleaner_id: newCleanerId,
      status: 'assigned',
      reassigned_at: now,
      reassignment_count: nextCount,
      cleaner_accepted_at: null,
      accepted_at: null,
      cleaner_on_my_way_at: null,
      on_my_way_at: null,
      cleaner_started_at: null,
      started_at: null,
      sla_status: 'ok',
      updated_at: now,
    })
    .eq('id', row.id);

  if (error) {
    console.warn('[reassign] update failed', row.id, error);
    return false;
  }

  console.log('[reassign] Booking:', row.id, '→', newCleanerId);

  const bookingForNotify: BookingRow = {
    ...row,
    cleaner_id: newCleanerId,
    assigned_cleaner_id: newCleanerId,
    status: 'assigned',
  };

  const bookingLite = {
    id: row.id,
    start_time: row.start_time,
    booking_time: row.booking_time,
  };

  const { data: oldCleaner } = await supabase
    .from('cleaners')
    .select('id, name, phone')
    .eq('id', currentCleaner)
    .maybeSingle();
  const { data: newCleaner } = await supabase
    .from('cleaners')
    .select('id, name, phone')
    .eq('id', newCleanerId)
    .maybeSingle();

  if (oldCleaner) {
    await sendCleanerNotification({
      type: 'reassigned_removed',
      cleaner: oldCleaner,
      booking: bookingLite,
    });
  }
  if (newCleaner) {
    await sendCleanerNotification({
      type: 'reassigned_new',
      cleaner: newCleaner,
      booking: bookingLite,
    });
  }

  await sendCustomerNotification({ type: 'reassigned', booking: bookingForNotify });
  await sendAdminNotification({
    bookingId: row.id,
    issues: ['Cleaner reassigned due to delay'],
    subject: `Reassignment: ${row.id}`,
  });

  console.log('[reassign] Optional cleaner handoff — old:', currentCleaner, 'new:', newCleanerId);

  return true;
}

/**
 * Evaluates SLA rules, persists `sla_status`, optional auto-reassign, escalation, and notifications.
 */
export async function runBookingSlaSweep(supabase: SupabaseClient): Promise<{
  scanned: number;
  inWarning: number;
  cleared: number;
  reassigned: number;
  escalated: number;
}> {
  const { data: rows, error } = await supabase
    .from('bookings')
    .select('*')
    .in('status', [...ACTIVE_SLA_STATUSES])
    .limit(500);

  if (error) {
    throw error;
  }

  let scanned = 0;
  let inWarning = 0;
  let cleared = 0;
  let reassigned = 0;
  let escalated = 0;
  const now = new Date().toISOString();

  for (const raw of rows || []) {
    const row = raw as BookingRow;
    scanned++;

    const issues = checkBookingSLA(row);

    if (issues.length > 0) {
      const didReassign = await tryAutomaticReassignment(supabase, row, issues);
      if (didReassign) {
        reassigned++;
        continue;
      }

      if (
        (row.reassignment_count ?? 0) >= 2 &&
        row.sla_severity !== 'critical' &&
        issues.length > 0
      ) {
        const { error: escErr } = await supabase
          .from('bookings')
          .update({
            sla_severity: 'critical',
            sla_status: 'warning',
            updated_at: now,
          })
          .eq('id', row.id);

        if (!escErr) {
          await sendAdminNotification({
            bookingId: row.id,
            issues: ['CRITICAL: Multiple reassignment failures'],
            subject: `CRITICAL: ${row.id}`,
          });
          await sendCustomerNotification({ type: 'delay_critical', booking: row });
          console.warn('[ESCALATION]', row.id);
          escalated++;
        }
        continue;
      }
    }

    if (issues.length === 0) {
      if (row.sla_status === 'warning') {
        const { error: upErr } = await supabase
          .from('bookings')
          .update({ sla_status: 'ok', updated_at: now })
          .eq('id', row.id);
        if (!upErr) cleared++;
      }
      continue;
    }

    inWarning++;

    const patch: Record<string, unknown> = {
      sla_status: 'warning',
      updated_at: now,
    };

    if (!row.sla_admin_notified_at) {
      await sendAdminNotification({ bookingId: row.id, issues });
      patch.sla_admin_notified_at = now;
    }

    if (!row.sla_delay_customer_notified_at) {
      await sendCustomerNotification({ type: 'delay', booking: row });
      patch.sla_delay_customer_notified_at = now;
    }

    const { error: upErr } = await supabase.from('bookings').update(patch).eq('id', row.id);
    if (upErr) {
      console.warn('[SLA sweep] update failed', row.id, upErr);
    } else {
      console.warn('[SLA]', row.id, issues);
    }
  }

  return { scanned, inWarning, cleared, reassigned, escalated };
}
