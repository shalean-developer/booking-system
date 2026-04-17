'use client';

import { useMemo, useState, useEffect } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/swr-config';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { getDateRange } from '@/lib/utils/formatting';

function todayYmd(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const d = String(t.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type ChartPoint = { date: string; revenue: number; bookings: number };

type ActivityItem = {
  id: string;
  type: string;
  message: string;
  status?: string;
  created_at: string;
};

function joinErrors(parts: (string | null | undefined)[]): string | null {
  const s = parts.filter(Boolean).join(' ');
  return s.length > 0 ? s : null;
}

export function useAdminDashboardHomeData() {
  const { dateFrom, dateTo } = useMemo(() => getDateRange('month'), []);
  const qs = `date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`;

  const {
    stats,
    isLoading: statsLoading,
    isError: statsHookError,
    error: statsHookErrMsg,
  } = useDashboardStats('month');

  const {
    data: chartRes,
    error: chartErr,
    isLoading: chartLoading,
  } = useSWR<{ ok: boolean; data?: ChartPoint[]; error?: string }>(`/api/admin/stats/chart?${qs}`, fetcher);

  const {
    data: svcRes,
    error: svcErr,
    isLoading: svcLoading,
  } = useSWR<{ ok: boolean; data?: { name: string; value: number }[]; error?: string }>(
    `/api/admin/stats/service-breakdown?${qs}`,
    fetcher
  );

  const {
    data: pipeRes,
    error: pipeErr,
    isLoading: pipeLoading,
  } = useSWR<{ ok: boolean; pipeline?: Record<string, number>; error?: string }>(
    `/api/admin/stats/booking-pipeline?${qs}`,
    fetcher
  );

  const {
    data: upcomingRes,
    error: upcomingErr,
    isLoading: upcomingLoading,
  } = useSWR<{ ok: boolean; bookings?: Array<Record<string, unknown>>; error?: string }>(
    `/api/admin/stats/upcoming-bookings?limit=8`,
    fetcher
  );

  const [todayKey, setTodayKey] = useState(todayYmd);
  useEffect(() => {
    const sync = () => {
      const n = todayYmd();
      setTodayKey((prev) => (prev !== n ? n : prev));
    };
    const id = setInterval(sync, 60_000);
    const onFocus = () => sync();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const {
    data: todayBookingsRes,
    error: todayErr,
    isLoading: todayLoading,
  } = useSWR<{ ok: boolean; bookings?: Array<Record<string, unknown>>; error?: string }>(
    `/api/admin/bookings?start=${todayKey}&end=${todayKey}&limit=50&skip_count=1&fields=schedule`,
    fetcher
  );

  const {
    data: cleanersRes,
    error: cleanersErr,
    isLoading: cleanersLoading,
  } = useSWR<{ ok: boolean; cleaners?: Array<Record<string, unknown>>; error?: string }>(
    `/api/admin/cleaners?limit=5&active=true&sort=completed_bookings`,
    fetcher
  );

  const {
    data: activityRes,
    error: activityErr,
    isLoading: activityLoading,
  } = useSWR<{ ok: boolean; activities?: ActivityItem[]; error?: string }>(
    '/api/admin/activity?limit=10',
    fetcher
  );

  const chartData = chartRes?.ok ? chartRes.data ?? [] : [];
  const serviceRows = svcRes?.ok ? svcRes.data ?? [] : [];
  const pipeline = pipeRes?.ok ? pipeRes.pipeline ?? {} : {};
  const upcoming = upcomingRes?.ok ? upcomingRes.bookings ?? [] : [];
  const todayRows = todayBookingsRes?.ok ? todayBookingsRes.bookings ?? [] : [];
  const topCleaners = cleanersRes?.ok ? cleanersRes.cleaners ?? [] : [];
  const activityFeed = activityRes?.ok ? activityRes.activities ?? [] : [];

  const serviceTotal = serviceRows.reduce((s, r) => s + (r.value || 0), 0);
  const serviceBreakdown = serviceRows.map((r, i) => {
    const pct = serviceTotal > 0 ? Math.round((r.value / serviceTotal) * 100) : 0;
    const colors = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626', '#0891B2'];
    return {
      id: `sb-${i}`,
      label: r.name,
      pct,
      color: colors[i % colors.length],
    };
  });

  const pipelineOrder = [
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'in-progress', label: 'In progress' },
    { key: 'completed', label: 'Completed' },
  ];
  const maxPipeline = Math.max(1, ...pipelineOrder.map((p) => pipeline[p.key] || 0));
  const pipelineColors = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#10B981'];
  const pipelineStages = pipelineOrder.map((p, idx) => {
    const count = pipeline[p.key] || 0;
    return {
      id: p.key,
      label: p.label,
      count,
      pct: Math.round((count / maxPipeline) * 100),
      color: pipelineColors[idx % pipelineColors.length],
    };
  });

  const revenueChartFormatted = chartData.map((row) => ({
    label: row.date.slice(5),
    revenue: row.revenue / 100,
    bookings: row.bookings,
  }));

  const sparkFromChart = chartData.slice(-8).map((row) => ({ v: Math.max(0, row.revenue / 100) }));

  const loading =
    statsLoading ||
    chartLoading ||
    svcLoading ||
    pipeLoading ||
    upcomingLoading ||
    todayLoading ||
    cleanersLoading ||
    activityLoading;

  const statsMissingAfterLoad = stats === null && !statsLoading && !statsHookError;

  const loadError = joinErrors([
    statsHookErrMsg ?? (statsHookError ? 'Dashboard stats failed to load.' : null),
    statsMissingAfterLoad ? 'Stats data was invalid or incomplete.' : null,
    chartErr?.message ?? (!chartRes?.ok && chartRes !== undefined ? chartRes.error ?? 'Chart unavailable.' : null),
    svcErr?.message ?? (!svcRes?.ok && svcRes !== undefined ? svcRes.error ?? 'Service breakdown unavailable.' : null),
    pipeErr?.message ?? (!pipeRes?.ok && pipeRes !== undefined ? pipeRes.error ?? 'Pipeline unavailable.' : null),
    upcomingErr?.message ??
      (!upcomingRes?.ok && upcomingRes !== undefined ? upcomingRes.error ?? 'Upcoming list unavailable.' : null),
    todayErr?.message ?? (!todayBookingsRes?.ok && todayBookingsRes !== undefined ? todayBookingsRes.error ?? null : null),
    cleanersErr?.message ?? (!cleanersRes?.ok && cleanersRes !== undefined ? cleanersRes.error ?? null : null),
    activityErr?.message ?? (!activityRes?.ok && activityRes !== undefined ? activityRes.error ?? null : null),
  ]);

  return {
    dateFrom,
    dateTo,
    stats,
    chartData: revenueChartFormatted,
    rawChart: chartData,
    sparkFromChart,
    serviceBreakdown,
    pipelineStages,
    upcoming,
    todayRows,
    topCleaners,
    activityFeed,
    loading,
    loadError,
  };
}
