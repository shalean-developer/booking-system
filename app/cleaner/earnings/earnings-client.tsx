'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { formatZarFromCents } from '@/lib/cleaner-financial';
import { CLEANER_HOURLY_RATE_ZAR } from '@/lib/cleaner/earnings-rates';
import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { isCompletedBooking } from '@/shared/dashboard-data';

type FinancialResp = {
  ok?: boolean;
  data?: {
    earnings?: Array<{ amount_cents: number; created_at: string }>;
    totals?: { total_earnings_cents?: number; month_earnings_cents?: number };
  };
};

type BookingRow = {
  id: string;
  status: string;
  booking_date?: string | null;
  completed_at?: string | null;
  cleaner_completed_at?: string | null;
  duration_minutes?: number | null;
};

function startOfWeekMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function localDayRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  return { start, end };
}

function parseBookingTs(b: BookingRow): Date | null {
  const raw = b.completed_at || b.cleaner_completed_at;
  if (!raw) return null;
  const t = new Date(raw);
  return Number.isNaN(t.getTime()) ? null : t;
}

export function CleanerEarningsClient() {
  const [financial, setFinancial] = useState<FinancialResp['data'] | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [finRes, bookRes] = await Promise.all([
        fetch('/api/cleaner/financial', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/cleaner/jobs', { credentials: 'include', cache: 'no-store' }),
      ]);
      const finJson = (await finRes.json()) as FinancialResp;
      const bookJson = await bookRes.json();
      if (finJson.ok && finJson.data) setFinancial(finJson.data);
      if (bookJson.ok && Array.isArray(bookJson.jobs)) {
        setBookings(bookJson.jobs as BookingRow[]);
      } else if (bookJson.ok && Array.isArray((bookJson as { bookings?: unknown }).bookings)) {
        setBookings((bookJson as { bookings: BookingRow[] }).bookings);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => {
    const now = new Date();
    const { start: todayStart, end: todayEnd } = localDayRange(now);
    const weekStart = startOfWeekMonday(now);

    const completed = bookings.filter(b => isCompletedBooking(b.status));

    const completedToday = completed.filter(b => {
      const t = parseBookingTs(b);
      return t !== null && t >= todayStart && t <= todayEnd;
    });

    const completedWeek = completed.filter(b => {
      const t = parseBookingTs(b);
      return t !== null && t >= weekStart;
    });

    const earningsList = financial?.earnings ?? [];
    const todayCents = earningsList
      .filter(e => {
        const t = new Date(e.created_at);
        return t >= todayStart && t <= todayEnd;
      })
      .reduce((s, e) => s + (e.amount_cents || 0), 0);

    const weekCents = earningsList
      .filter(e => {
        const t = new Date(e.created_at);
        return t >= weekStart;
      })
      .reduce((s, e) => s + (e.amount_cents || 0), 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthCents = earningsList
      .filter(e => {
        const t = new Date(e.created_at);
        return t >= monthStart;
      })
      .reduce((s, e) => s + (e.amount_cents || 0), 0);

    const hoursWeek =
      completedWeek.reduce((s, b) => s + (typeof b.duration_minutes === 'number' ? b.duration_minutes : 0), 0) /
      60;

    const avgHourlyWeekZar =
      hoursWeek > 0.05 ? (weekCents / 100) / hoursWeek : 0;

    return {
      todayCents,
      weekCents,
      monthCents,
      jobsToday: completedToday.length,
      jobsWeek: completedWeek.length,
      hoursWeek,
      avgHourlyWeekZar,
    };
  }, [bookings, financial]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm font-medium text-slate-500">Loading earnings…</p>
      </div>
    );
  }

  const rateLines = Object.entries(CLEANER_HOURLY_RATE_ZAR)
    .map(([k, v]) => `${k}: R${v}/h`)
    .join(' · ');

  return (
    <div className="max-w-lg mx-auto px-4 pb-28 pt-6">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/cleaner/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Earnings</h1>
          <p className="text-sm text-slate-500">Today & this week</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Today</p>
          <p className="text-3xl font-extrabold text-slate-900">{formatZarFromCents(stats.todayCents)}</p>
          <p className="text-sm text-slate-500 mt-2">{stats.jobsToday} jobs completed</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">This week</p>
          <p className="text-3xl font-extrabold text-slate-900">{formatZarFromCents(stats.weekCents)}</p>
          <p className="text-sm text-slate-500 mt-2">{stats.jobsWeek} jobs completed</p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">This month</p>
          <p className="text-3xl font-extrabold text-slate-900">{formatZarFromCents(stats.monthCents)}</p>
          <p className="text-sm text-slate-500 mt-2">Wallet credits (same period)</p>
        </div>

        <div className="rounded-2xl bg-slate-900 text-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Hours (week)</p>
          <p className="text-3xl font-extrabold">{stats.hoursWeek.toFixed(1)} h</p>
          <p className="text-sm text-slate-400 mt-2">
            Avg ~R{stats.avgHourlyWeekZar.toFixed(0)}/h from completed jobs (wallet ÷ hours)
          </p>
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed px-1">
          Reference labour rates (display / estimates): {rateLines}. Actual payouts follow each job’s
          approval and team split.
        </p>
      </div>

      <CleanerMobileBottomNav />
    </div>
  );
}
