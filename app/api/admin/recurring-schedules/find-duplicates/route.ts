import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Find duplicate recurring schedules
 * Identifies schedules with same customer, service, bedrooms, bathrooms, frequency, and time
 */
export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const svc = createServiceClient();

    // Get all active recurring schedules
    const { data: allSchedules, error: schedulesError } = await svc
      .from('recurring_schedules')
      .select(`
        id,
        customer_id,
        service_type,
        bedrooms,
        bathrooms,
        frequency,
        preferred_time,
        is_active,
        start_date,
        end_date,
        total_amount,
        cleaner_id,
        created_at,
        customers (
          id,
          first_name,
          last_name,
          email
        ),
        cleaners (
          id,
          name
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      return NextResponse.json(
        { ok: false, error: `Failed to fetch schedules: ${schedulesError.message}` },
        { status: 500 }
      );
    }

    if (!allSchedules || allSchedules.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No active recurring schedules found',
        duplicates: [],
        summary: {
          totalSchedules: 0,
          duplicateGroups: 0,
          schedulesToRemove: 0,
        },
      });
    }

    // Group schedules by unique key (customer + service details + frequency + time)
    const scheduleGroups = new Map<string, any[]>();

    for (const schedule of allSchedules) {
      const key = [
        schedule.customer_id,
        schedule.service_type,
        schedule.bedrooms,
        schedule.bathrooms,
        schedule.frequency,
        schedule.preferred_time,
      ].join('|');

      if (!scheduleGroups.has(key)) {
        scheduleGroups.set(key, []);
      }
      scheduleGroups.get(key)!.push(schedule);
    }

    // Find duplicates (groups with more than 1 schedule)
    const duplicates: Array<{
      key: string;
      schedules: any[];
      customer: any;
      serviceDetails: string;
      bookingCounts: Map<string, number>;
      recommendation: {
        keep: string;
        remove: string[];
      };
    }> = [];

    for (const [key, schedules] of scheduleGroups.entries()) {
      if (schedules.length > 1) {
        // Get booking counts for each schedule
        const scheduleIds = schedules.map(s => s.id);
        const { data: bookings } = await svc
          .from('bookings')
          .select('recurring_schedule_id')
          .in('recurring_schedule_id', scheduleIds);

        const bookingCounts = new Map<string, number>();
        (bookings || []).forEach((b: any) => {
          bookingCounts.set(b.recurring_schedule_id, (bookingCounts.get(b.recurring_schedule_id) || 0) + 1);
        });

        // Sort by: 1) Most bookings, 2) Oldest created, 3) Has pricing set
        schedules.sort((a, b) => {
          const aBookings = bookingCounts.get(a.id) || 0;
          const bBookings = bookingCounts.get(b.id) || 0;
          if (bBookings !== aBookings) return bBookings - aBookings;
          
          const aHasPricing = a.total_amount && a.total_amount > 0 ? 1 : 0;
          const bHasPricing = b.total_amount && b.total_amount > 0 ? 1 : 0;
          if (bHasPricing !== aHasPricing) return bHasPricing - aHasPricing;
          
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const keepSchedule = schedules[0];
        const removeSchedules = schedules.slice(1);

        duplicates.push({
          key,
          schedules,
          customer: schedules[0].customers,
          serviceDetails: `${schedules[0].service_type}, ${schedules[0].bedrooms} bed, ${schedules[0].bathrooms} bath, ${schedules[0].frequency}`,
          bookingCounts,
          recommendation: {
            keep: keepSchedule.id,
            remove: removeSchedules.map(s => s.id),
          },
        });
      }
    }

    // Calculate summary
    const totalSchedulesToRemove = duplicates.reduce((sum, d) => sum + d.recommendation.remove.length, 0);

    return NextResponse.json({
      ok: true,
      message: `Found ${duplicates.length} duplicate groups affecting ${totalSchedulesToRemove} schedules`,
      duplicates: duplicates.map(d => ({
        customer: {
          name: `${d.customer?.first_name || ''} ${d.customer?.last_name || ''}`.trim(),
          email: d.customer?.email,
        },
        serviceDetails: d.serviceDetails,
        frequency: d.schedules[0].frequency,
        preferredTime: d.schedules[0].preferred_time,
        duplicateCount: d.schedules.length,
        schedules: d.schedules.map((s: any) => ({
          id: s.id,
          created_at: s.created_at,
          start_date: s.start_date,
          cleaner: s.cleaners?.name || 'Unassigned',
          total_amount: s.total_amount ? Math.round(s.total_amount / 100 * 100) / 100 : null,
          booking_count: d.bookingCounts.get(s.id) || 0,
          recommendation: s.id === d.recommendation.keep ? 'KEEP' : 'REMOVE',
        })),
        recommendation: {
          keepScheduleId: d.recommendation.keep,
          removeScheduleIds: d.recommendation.remove,
        },
      })),
      summary: {
        totalSchedules: allSchedules.length,
        duplicateGroups: duplicates.length,
        schedulesToRemove: totalSchedulesToRemove,
        customersAffected: new Set(duplicates.map(d => d.customer?.id)).size,
      },
    });
  } catch (error: any) {
    console.error('Error finding duplicates:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

