'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Sparkles,
  BarChart3,
  Users,
  Plus,
  ArrowRight,
  Target,
  Clock,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Star,
  FileText,
  UserCheck,
  Briefcase,
  Filter,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils/formatting';
import { useAdminDashboardHomeData } from '@/hooks/use-admin-dashboard-home';
import { formatTimeSafe } from '@/lib/date-utils';
import { normalizeBookingStatusForUi } from '@/lib/booking-status-ui';
import type { NavId } from '@/components/admin/types';

const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 280, damping: 24 },
  },
};

const formatZAR = (n: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(n);

const StatusBadge = ({
  status,
}: {
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}) => {
  const map = {
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    confirmed: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: 'Completed', cls: 'bg-green-50 text-green-700 border-green-200' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide',
        s.cls
      )}
    >
      {s.label}
    </span>
  );
};

export function DashboardHome({
  onNewBooking,
  onNavigate,
  newBookingCount,
}: {
  onNewBooking: () => void;
  onNavigate: (id: NavId) => void;
  newBookingCount: number;
}) {
  const {
    stats,
    chartData,
    rawChart,
    sparkFromChart,
    serviceBreakdown,
    pipelineStages,
    upcoming,
    todayRows,
    topCleaners,
    loading,
  } = useAdminDashboardHomeData();

  const revenueGoalCents = 500_000_00;
  const currentRevenueCents = stats?.totalRevenue ?? 0;
  const goalPct = Math.min(100, Math.round((currentRevenueCents / Math.max(1, revenueGoalCents)) * 100));

  const bookingSpark = rawChart.slice(-8).map((row) => ({ v: Math.max(0, row.bookings) }));

  const sparkFallback = [{ v: 0 }];
  const revSpark = sparkFromChart.length ? sparkFromChart : sparkFallback;
  const bookSpark = bookingSpark.length ? bookingSpark : revSpark;

  const kpiCards = stats
    ? [
        {
          id: 'revenue',
          label: 'Total Revenue',
          value: formatCurrency(stats.totalRevenue, false),
          change: stats.revenueGrowth,
          color: '#4F46E5',
          bgColor: '#EEF2FF',
          sparkData: revSpark,
        },
        {
          id: 'bookings',
          label: 'Total Bookings',
          value: String(stats.totalBookings),
          change: stats.bookingsGrowth,
          color: '#059669',
          bgColor: '#ECFDF5',
          sparkData: bookSpark,
        },
        {
          id: 'customers',
          label: 'Active Customers',
          value: String(stats.activeCustomers),
          change: stats.customersGrowth,
          color: '#D97706',
          bgColor: '#FFFBEB',
          sparkData: revSpark,
        },
        {
          id: 'avg',
          label: 'Avg Booking Value',
          value: formatCurrency(stats.avgBookingValue, false),
          change: stats.avgValueGrowth,
          color: '#7C3AED',
          bgColor: '#F5F3FF',
          sparkData: revSpark,
        },
      ]
    : [];

  const recentRows = (upcoming || []).slice(0, 8).map((b: Record<string, unknown>) => ({
    id: String(b.id ?? ''),
    client: String(b.customer_name ?? '—'),
    service: String(b.service_type ?? '—'),
    cleaner: String(b.cleaner_name ?? '—'),
    time: `${b.booking_date ?? ''} · ${formatTimeSafe(String(b.booking_time ?? ''))}`,
    amount: formatCurrency(Number(b.total_amount) || 0, true),
    status: normalizeBookingStatusForUi(String(b.status ?? '')),
  }));

  const pendingAlerts =
    stats !== null && stats !== undefined
      ? [
          {
            id: 'pa1',
            type: 'Quotes',
            count: stats.pendingQuotes,
            label: 'Quotes awaiting action',
            icon: <FileText className="h-4 w-4" />,
            color: '#D97706',
            bg: '#FFFBEB',
            navTarget: 'quotes' as const,
          },
          {
            id: 'pa2',
            type: 'Applications',
            count: stats.pendingApplications,
            label: 'Cleaner applications',
            icon: <UserCheck className="h-4 w-4" />,
            color: '#4F46E5',
            bg: '#EEF2FF',
            navTarget: 'cleaners' as const,
          },
          {
            id: 'pa3',
            type: 'Bookings',
            count: stats.pendingBookings,
            label: 'Pending bookings',
            icon: <Briefcase className="h-4 w-4" />,
            color: '#DC2626',
            bg: '#FEF2F2',
            navTarget: 'bookings' as const,
          },
        ]
      : [];

  const palette = ['#4F46E5', '#059669', '#D97706', '#7C3AED'];
  const scheduleItems = (todayRows || []).map((b: Record<string, unknown>, i: number) => ({
    id: String(b.id ?? i),
    client: String(b.customer_name ?? '—'),
    address: [b.address_line1, b.address_suburb].filter(Boolean).join(', ') || '—',
    time: formatTimeSafe(String(b.booking_time ?? '')),
    cleaner: String(b.cleaner_name ?? '—'),
    service: String(b.service_type ?? '—'),
    color: palette[i % palette.length],
  }));

  const cleanerPalette = ['#4F46E5', '#059669', '#D97706', '#7C3AED', '#DC2626'];
  const topList = (topCleaners || []).map((c: Record<string, unknown>, index: number) => {
    const name = String(c.name ?? 'Cleaner');
    const initials = name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const rating = Number(c.average_rating ?? c.rating ?? 0);
    const jobs = Number(c.completed_bookings ?? 0);
    return {
      id: String(c.id ?? index),
      name,
      initials,
      rating,
      jobs,
      color: cleanerPalette[index % cleanerPalette.length],
    };
  });

  const todayLabel = new Date().toLocaleDateString('en-ZA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="flex-1 space-y-6 overflow-y-auto px-4 py-6 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">Good morning, Admin 👋</h1>
          <p className="mt-0.5 text-sm text-gray-400">
            <span>Here&apos;s what&apos;s happening today.</span>
            {loading && <span className="ml-2 text-indigo-500">Loading live stats…</span>}
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewBooking}
          className="hidden flex-shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-shadow hover:shadow-lg sm:flex"
        >
          <Plus className="h-4 w-4" />
          <span>New Booking</span>
          {newBookingCount > 0 && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {newBookingCount}
            </span>
          )}
        </motion.button>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {kpiCards.map((card) => (
          <motion.div
            key={card.id}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            className="cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{card.label}</p>
                <p className="mt-1 text-2xl font-extrabold leading-none text-gray-900">{card.value}</p>
              </div>
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: card.bgColor }}
              >
                <TrendingUp className="h-4 w-4" style={{ color: card.color }} />
              </div>
            </div>
            <div className="mb-3 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={card.sparkData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`spark-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={card.color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={card.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={card.color}
                    strokeWidth={1.5}
                    fill={`url(#spark-${card.id})`}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-1.5">
              {card.change >= 0 ? (
                <TrendingUp className="h-3 w-3 flex-shrink-0 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 flex-shrink-0 text-red-500" />
              )}
              <span className={cn('text-xs font-bold', card.change >= 0 ? 'text-green-600' : 'text-red-600')}>
                {card.change >= 0 ? '+' : ''}
                {card.change}%
              </span>
              <span className="text-xs text-gray-400">vs previous period</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Revenue Trends</h2>
              <p className="mt-0.5 text-xs text-gray-400">Last 30 days (from live bookings)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-medium text-gray-400">Revenue (ZAR)</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-500 transition-colors hover:bg-gray-200"
              >
                <Filter className="h-3 w-3" />
                <span>Full Report</span>
              </button>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `R${(v / 1000).toFixed(0)}k`}
                  width={40}
                />
                <Tooltip
                  formatter={(value) => [formatZAR(Number(value ?? 0)), 'Revenue']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#4F46E5' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Revenue Goal</h2>
                <p className="mt-0.5 text-xs text-gray-400">Target (configurable)</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50">
                <Target className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
            <div className="mb-2 flex items-end justify-between">
              <p className="text-xl font-extrabold text-gray-900">{formatCurrency(currentRevenueCents, false)}</p>
              <p className="mb-0.5 text-xs text-gray-400">of {formatCurrency(revenueGoalCents, false)}</p>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goalPct}%` }}
                transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600">{goalPct}% achieved</span>
              <span className="text-xs text-gray-400">
                {formatCurrency(Math.max(0, revenueGoalCents - currentRevenueCents), false)} to go
              </span>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            whileHover={{ y: -4 }}
            className="flex-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <h2 className="mb-4 text-sm font-bold text-gray-900">Service Breakdown</h2>
            <div className="space-y-3">
              {serviceBreakdown.length === 0 && <p className="text-xs text-gray-400">No bookings in range.</p>}
              {serviceBreakdown.map((svc) => (
                <div key={svc.id}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">{svc.label}</span>
                    <span className="text-xs font-bold text-gray-800">{svc.pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${svc.pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: svc.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Bookings Trends</h2>
              <p className="mt-0.5 text-xs text-gray-400">Daily count — last 30 days</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-[10px] font-medium text-gray-400">Bookings</span>
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  formatter={(value) => [Number(value ?? 0), 'Bookings']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#4F46E5" />
                  </linearGradient>
                </defs>
                <Bar dataKey="bookings" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <h2 className="mb-4 text-sm font-bold text-gray-900">Booking Pipeline</h2>
          <div className="space-y-3.5">
            {pipelineStages.map((stage) => (
              <div key={stage.id}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">{stage.label}</span>
                  <span className="text-xs font-bold" style={{ color: stage.color }}>
                    {stage.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.pct}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: stage.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          whileHover={{ y: -4 }}
          className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Upcoming</h2>
              <p className="mt-0.5 text-xs text-gray-400">Next scheduled jobs</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('bookings')}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
            >
              <span>View all</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentRows.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No upcoming bookings.</p>
            )}
            {recentRows.map((booking) => (
              <motion.div
                key={booking.id}
                whileHover={{ backgroundColor: '#fafafa' }}
                className="flex cursor-pointer items-center gap-4 px-5 py-3.5 transition-colors"
                onClick={() => onNavigate('bookings')}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                  <span className="text-[10px] font-bold text-white">
                    {booking.client
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{booking.client}</p>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    <span>{booking.service}</span>
                    <span className="mx-1">·</span>
                    <span>{booking.cleaner}</span>
                    <span className="mx-1">·</span>
                    <span>{booking.time}</span>
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-900">{booking.amount}</p>
                  <button
                    type="button"
                    className="mt-0.5 text-[10px] font-semibold text-indigo-500 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate('bookings');
                    }}
                  >
                    View
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col gap-4">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-gray-900">Pending Items</h2>
            <div className="space-y-2.5">
              {pendingAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  whileHover={{ y: -2 }}
                  onClick={() => onNavigate(alert.navTarget)}
                  className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all"
                  style={{ backgroundColor: alert.bg }}
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ color: alert.color, backgroundColor: `${alert.color}18` }}
                  >
                    {alert.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-900">{alert.type}</p>
                    <p className="truncate text-[10px] text-gray-500">{alert.label}</p>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <span
                      className="flex h-5 min-w-[22px] items-center justify-center rounded-full text-xs font-bold"
                      style={{ color: alert.color, backgroundColor: `${alert.color}20` }}
                    >
                      {alert.count}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-gray-900">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onNewBooking}
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-xs font-bold text-white shadow-sm transition-shadow hover:shadow-md"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Booking</span>
              </motion.button>
              {[
                { id: 'qa1', label: 'Add Cleaner', icon: <Sparkles className="h-3.5 w-3.5" />, nav: 'cleaners' as const },
                { id: 'qa2', label: 'Send Quote', icon: <FileText className="h-3.5 w-3.5" />, nav: 'quotes' as const },
                { id: 'qa3', label: 'View Reports', icon: <BarChart3 className="h-3.5 w-3.5" />, nav: 'reports' as const },
                { id: 'qa4', label: 'Customers', icon: <Users className="h-3.5 w-3.5" />, nav: 'customers' as const },
              ].map((action) => (
                <motion.button
                  key={action.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate(action.nav)}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-4 xl:grid-cols-2">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Today&apos;s Schedule</h2>
              <p className="mt-0.5 text-xs text-gray-400">{todayLabel}</p>
            </div>
            <div className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600">
              <Clock className="h-3 w-3" />
              <span>{scheduleItems.length} jobs</span>
            </div>
          </div>
          <div className="space-y-3">
            {scheduleItems.length === 0 && (
              <p className="text-sm text-gray-400">No bookings scheduled for today.</p>
            )}
            {scheduleItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ x: 4 }}
                className="flex cursor-pointer items-center gap-3.5"
                onClick={() => onNavigate('bookings')}
              >
                <div className="h-10 w-1 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                <div className="w-14 flex-shrink-0 text-center">
                  <p className="text-[10px] font-bold text-gray-500">{item.time}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{item.client}</p>
                  <p className="truncate text-xs text-gray-400">
                    <span>{item.service}</span>
                    <span className="mx-1">·</span>
                    <span>{item.cleaner}</span>
                  </p>
                  <p className="truncate text-[10px] text-gray-400">{item.address}</p>
                </div>
                <div
                  className="flex-shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold"
                  style={{ color: item.color, backgroundColor: `${item.color}15` }}
                >
                  {item.service}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          whileHover={{ y: -4 }}
          className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Top Cleaners</h2>
              <p className="mt-0.5 text-xs text-gray-400">By completed jobs</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('cleaners')}
              className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
            >
              <span>All cleaners</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-3">
            {topList.length === 0 && <p className="text-sm text-gray-400">No cleaner data.</p>}
            {topList.map((cleaner, index) => (
              <motion.div
                key={cleaner.id}
                whileHover={{ x: 4 }}
                onClick={() => onNavigate('cleaners')}
                className="flex cursor-pointer items-center gap-3"
              >
                <span className="w-4 flex-shrink-0 text-center text-xs font-bold text-gray-300">{index + 1}</span>
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: cleaner.color }}
                >
                  {cleaner.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">{cleaner.name}</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="h-2.5 w-2.5"
                        fill={star <= Math.floor(cleaner.rating) ? '#F59E0B' : 'none'}
                        stroke={star <= Math.floor(cleaner.rating) ? '#F59E0B' : '#D1D5DB'}
                      />
                    ))}
                    <span className="ml-0.5 text-[10px] text-gray-500">{cleaner.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-900">{cleaner.jobs}</p>
                  <p className="text-[10px] text-gray-400">jobs</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
