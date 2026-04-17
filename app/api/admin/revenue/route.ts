import { NextResponse } from 'next/server';
import { createClient, createServiceClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const PAID_OR_DONE_FILTER =
  'payment_status.eq.success,status.eq.paid,status.eq.completed';

const BUSINESS_TZ = 'Africa/Johannesburg';

function dateKeyInTz(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

function todayKeyInTz(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function monthPrefixInTz(): string {
  return todayKeyInTz().slice(0, 7);
}

type PaidRow = {
  id: string;
  total_amount: number | null;
  created_at: string;
  service_type: string | null;
  customer_name: string | null;
};

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    let supabase;
    try {
      supabase = createServiceClient();
    } catch {
      supabase = await createClient();
    }

    const pageSize = 1000;
    let offset = 0;
    const rows: PaidRow[] = [];

    for (;;) {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, total_amount, created_at, service_type, customer_name')
        .or(PAID_OR_DONE_FILTER)
        .order('created_at', { ascending: true })
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('revenue route bookings error:', error);
        return NextResponse.json(
          { ok: false, error: 'Failed to load bookings' },
          { status: 500 }
        );
      }
      if (!data?.length) break;
      rows.push(...(data as PaidRow[]));
      if (data.length < pageSize) break;
      offset += pageSize;
    }

    const today = todayKeyInTz();
    const monthPrefix = monthPrefixInTz();

    let totalRevenueCents = 0;
    let todayRevenueCents = 0;
    let monthRevenueCents = 0;

    const revenueByDate: Record<string, number> = {};
    const bookingsByDate: Record<string, number> = {};
    const serviceRevenue: Record<string, number> = {};
    const serviceCounts: Record<string, number> = {};

    let last7Cents = 0;
    let prev7Cents = 0;

    const now = new Date();
    const jhbDay = (d: Date) => dateKeyInTz(d.toISOString());

    const last7Start = new Date(now);
    last7Start.setDate(last7Start.getDate() - 6);
    const last7StartKey = jhbDay(last7Start);
    const last7EndKey = jhbDay(now);

    const prev7End = new Date(last7Start);
    prev7End.setDate(prev7End.getDate() - 1);
    const prev7Start = new Date(prev7End);
    prev7Start.setDate(prev7Start.getDate() - 6);
    const prev7StartKey = jhbDay(prev7Start);
    const prev7EndKey = jhbDay(prev7End);

    for (const b of rows) {
      const cents = Math.round(Number(b.total_amount) || 0);
      totalRevenueCents += cents;

      const created = b.created_at;
      const dayKey = dateKeyInTz(created);

      if (dayKey === today) todayRevenueCents += cents;
      if (dayKey.startsWith(monthPrefix)) monthRevenueCents += cents;

      revenueByDate[dayKey] = (revenueByDate[dayKey] || 0) + cents;
      bookingsByDate[dayKey] = (bookingsByDate[dayKey] || 0) + 1;

      const svc = (b.service_type || 'Unknown').trim() || 'Unknown';
      serviceRevenue[svc] = (serviceRevenue[svc] || 0) + cents;
      serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;

      if (dayKey >= last7StartKey && dayKey <= last7EndKey) last7Cents += cents;
      if (dayKey >= prev7StartKey && dayKey <= prev7EndKey) prev7Cents += cents;
    }

    const totalBookings = rows.length;
    const avgBookingCents =
      totalBookings > 0 ? Math.round(totalRevenueCents / totalBookings) : 0;

    let growthPercent: number | null = null;
    if (prev7Cents > 0) {
      growthPercent = ((last7Cents - prev7Cents) / prev7Cents) * 100;
    } else if (last7Cents > 0) {
      growthPercent = 100;
    } else {
      growthPercent = 0;
    }

    const topServices = Object.entries(serviceRevenue)
      .map(([service_type, revenueCents]) => ({
        service_type,
        revenueCents,
        count: serviceCounts[service_type] ?? 0,
      }))
      .sort((a, b) => b.revenueCents - a.revenueCents)
      .slice(0, 5);

    const allDates = Object.keys(revenueByDate).sort();
    const chartData = allDates.map((date) => ({
      date,
      revenueCents: revenueByDate[date] ?? 0,
      bookings: bookingsByDate[date] ?? 0,
    }));

    const recent = [...rows]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 10)
      .map((b) => ({
        id: b.id,
        customer_name: b.customer_name,
        service_type: b.service_type,
        total_amount: b.total_amount,
        created_at: b.created_at,
      }));

    return NextResponse.json({
      ok: true,
      metrics: {
        totalRevenueCents,
        todayRevenueCents,
        monthRevenueCents,
        totalBookings,
        avgBookingCents,
        growthPercent,
        last7DaysRevenueCents: last7Cents,
        prev7DaysRevenueCents: prev7Cents,
      },
      topServices,
      chartData,
      recentBookings: recent,
    });
  } catch (e: unknown) {
    console.error('revenue route:', e);
    const message = e instanceof Error ? e.message : 'Internal server error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
