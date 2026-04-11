'use client';

import { useMemo } from 'react';
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

export function useAdminDashboardHomeData() {
  const { dateFrom, dateTo } = useMemo(() => getDateRange('month'), []);
  const qs = `date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`;

  const { stats, isLoading: statsLoading } = useDashboardStats('month');

  const { data: chartRes, isLoading: chartLoading } = useSWR<{ ok: boolean; data: ChartPoint[] }>(
    `/api/admin/stats/chart?${qs}`,
    fetcher
  );

  const { data: svcRes, isLoading: svcLoading } = useSWR<{ ok: boolean; data: { name: string; value: number }[] }>(
    `/api/admin/stats/service-breakdown?${qs}`,
    fetcher
  );

  const { data: pipeRes, isLoading: pipeLoading } = useSWR<{ ok: boolean; pipeline: Record<string, number> }>(
    `/api/admin/stats/booking-pipeline?${qs}`,
    fetcher
  );

  const { data: upcomingRes, isLoading: upcomingLoading } = useSWR<{
    ok: boolean;
    bookings: Array<Record<string, unknown>>;
  }>(`/api/admin/stats/upcoming-bookings?limit=8`, fetcher);

  const today = useMemo(() => todayYmd(), []);

  const { data: todayBookingsRes, isLoading: todayLoading } = useSWR<{
    ok: boolean;
    bookings: Array<Record<string, unknown>>;
  }>(`/api/admin/bookings?start=${today}&end=${today}&limit=50`, fetcher);

  const { data: cleanersRes, isLoading: cleanersLoading } = useSWR<{
    ok: boolean;
    cleaners: Array<Record<string, unknown>>;
  }>(`/api/admin/cleaners?limit=5&active=true`, fetcher);

  const chartData = chartRes?.ok ? chartRes.data ?? [] : [];
  const serviceRows = svcRes?.ok ? svcRes.data ?? [] : [];
  const pipeline = pipeRes?.ok ? pipeRes.pipeline ?? {} : {};
  const upcoming = upcomingRes?.ok ? upcomingRes.bookings ?? [] : [];
  const todayRows = todayBookingsRes?.ok ? todayBookingsRes.bookings ?? [] : [];
  const topCleaners = cleanersRes?.ok ? cleanersRes.cleaners ?? [] : [];

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
    cleanersLoading;

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
    loading,
  };
}
