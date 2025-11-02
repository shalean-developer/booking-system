'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { DollarSign, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import useSWR from 'swr';
import { DateRangeFilter } from './date-range-filter';
import { CriticalAlertsPanel } from './critical-alerts-panel';
import { OperationsCommand } from './operations-command';
import { PerformanceWidget } from './performance-widget';
import { ExportDialog } from './export-dialog';
import { PaymentStatusWidget } from './payment-status-widget';
import { ServiceRevenueChart } from './service-revenue-chart';
import { RevenueTrendsWidget } from './revenue-trends-widget';
// Enhanced dashboard components
import { StatCard } from '@/components/dashboard/StatCard';
import { MetricAlerts } from '@/components/dashboard/MetricAlerts';
import { SnapshotCard } from '@/components/dashboard/SnapshotCard';
import { ServiceCard } from '@/components/dashboard/ServiceCard';
import { TrendsCharts } from '@/components/dashboard/TrendsCharts';
import { BusinessPipeline } from '@/components/dashboard/BusinessPipeline';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { FAB } from '@/components/dashboard/FAB';
import { MobileSummaryBar } from '@/components/dashboard/MobileSummaryBar';
import { generateMockSparkline } from '@/components/dashboard/mock';

// --------------------
// Types
// --------------------
export type Booking = {
  id: string;
  date: string;
  time: string;
  serviceType: string;
  customerName: string;
  cleanerId?: string | null;
  cleanerName?: string;
  cleanerInitials?: string;
  status: string;
  price: number;
};

export type Metrics = {
  todayRevenue: number;
  bookingsToday: number;
  cleanersAvailable: number;
  totalRevenue: number;
  companyEarnings: number;
  profitMarginPct: number;
  avgBookingValue: number;
  totalBookings: number;
  activeCleaners: number;
  customerRetentionPct: number;
};

export type Alert = {
  id: string;
  level: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  count?: number;
  actionLabel?: string;
  actionHref?: string;
};

// --------------------
// Enhanced components are imported from @/components/dashboard
// --------------------

// --------------------
// Main page
// --------------------
export default function DashboardPageNew() {
  // Calculate days from start of current month to today
  const getCurrentMonthDays = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysDifference = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
    return daysDifference + 1;
  };

  const [dateRangeDays, setDateRangeDays] = useState(getCurrentMonthDays());
  const [chartData, setChartData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{
    ok: boolean;
    stats?: any;
    error?: string;
  }>(
    `/api/admin/stats?days=${dateRangeDays}`,
    async (url) => {
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }
      return data;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000,
      dedupingInterval: 5000,
    }
  );

  const stats = data?.stats;

  // Fetch chart data when date range changes
  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoadingChart(true);
      try {
        const response = await fetch(`/api/admin/stats/chart?days=${dateRangeDays}`, {
          credentials: 'include',
        });
        const result = await response.json();
        if (result.ok) {
          setChartData(result.chartData || []);
          setComparisonData(result.comparison || null);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoadingChart(false);
      }
    };

    fetchChartData();
  }, [dateRangeDays]);

  // Listen for export dialog events
  useEffect(() => {
    const handleShowExport = () => setExportDialogOpen(true);
    window.addEventListener('admin-show-export', handleShowExport);
    return () => window.removeEventListener('admin-show-export', handleShowExport);
  }, []);

  const handleRefresh = () => {
    mutate();
    const fetchChartData = async () => {
      setIsLoadingChart(true);
      try {
        const response = await fetch(`/api/admin/stats/chart?days=${dateRangeDays}`, {
          credentials: 'include',
        });
        const result = await response.json();
        if (result.ok) {
          setChartData(result.chartData || []);
          setComparisonData(result.comparison || null);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setIsLoadingChart(false);
      }
    };
    fetchChartData();
  };

  const comparison = comparisonData;

  // Calculate financial deltas from comparison data
  const financialDeltas = useMemo(() => {
    if (!comparison) return { totalRevenue: null, profitMargin: null, avgBooking: null };
    
    const totalRevenueDelta = comparison.revenue?.change || null;
    
    // Calculate profit margin delta from stats (percentage point change)
    const profitMarginDelta = stats?.revenue?.profitMargin && stats?.revenue?.recentProfitMargin
      ? ((stats.revenue.profitMargin - stats.revenue.recentProfitMargin) / stats.revenue.recentProfitMargin) * 100
      : null;
    
    // Calculate avg booking delta from stats
    const avgBookingDelta = stats?.revenue?.avgBookingValue && stats?.revenue?.recentAvgBookingValue
      ? ((stats.revenue.avgBookingValue - stats.revenue.recentAvgBookingValue) / stats.revenue.recentAvgBookingValue) * 100
      : null;
    
    return {
      totalRevenue: totalRevenueDelta,
      profitMargin: profitMarginDelta,
      avgBooking: avgBookingDelta ? Math.round(avgBookingDelta) : null,
    };
  }, [comparison, stats]);

  // Transform stats into metrics
  const metrics: Metrics = useMemo(() => {
    if (!stats) {
      return {
        todayRevenue: 0,
        bookingsToday: 0,
        cleanersAvailable: 0,
        totalRevenue: 0,
        companyEarnings: 0,
        profitMarginPct: 0,
        avgBookingValue: 0,
        totalBookings: 0,
        activeCleaners: 0,
        customerRetentionPct: 0,
      };
    }

    const todayRevenue = stats.revenue?.today || 0;
    const bookingsToday = stats.bookings?.today || 0;
    const cleanersAvailable = stats.cleaners?.availableToday || 0;
    const totalRevenue = stats.revenue?.total || 0;
    const companyEarnings = stats.revenue?.companyEarnings || 0;
    const profitMarginPct = stats.revenue?.profitMargin || 0;
    const avgBookingValue = stats.revenue?.avgBookingValue || 0;
    const totalBookings = stats.bookings?.total || 0;
    const activeCleaners = stats.cleaners?.active || 0;
    const customerRetentionPct = stats.customers?.retentionRate || 0;

    return {
      todayRevenue,
      bookingsToday,
      cleanersAvailable,
      totalRevenue,
      companyEarnings,
      profitMarginPct,
      avgBookingValue,
      totalBookings,
      activeCleaners,
      customerRetentionPct,
    };
  }, [stats]);

  // Generate alerts from stats
  // Note: Unassigned bookings removed from alerts - shown in Operations Command Center instead
  const alerts: Alert[] = useMemo(() => {
    if (!stats) return [];
    const alertList: Alert[] = [];

    if (stats.quotes?.pending > 0) {
      alertList.push({
        id: 'pending-quotes',
        level: 'warning',
        title: 'Pending Quotes',
        message: `${stats.quotes.pending} quotes awaiting response`,
        count: stats.quotes.pending,
        actionLabel: 'Review',
        actionHref: '#quotes',
      });
    }

    if (stats.applications?.pending > 0) {
      alertList.push({
        id: 'pending-apps',
        level: 'info',
        title: 'Cleaner Applications',
        message: `${stats.applications.pending} applications awaiting review`,
        count: stats.applications.pending,
        actionLabel: 'Review',
      });
    }

    return alertList;
  }, [stats]);

  // Transform today's bookings
  const bookings: Booking[] = useMemo(() => {
    if (!stats?.bookings?.todayBookings) return [];
    return stats.bookings.todayBookings.map((b: any) => ({
      id: b.id,
      date: b.booking_date || '',
      time: b.booking_time || '',
      serviceType: b.service_type || 'Standard',
      customerName: b.customer_name || 'Unknown',
      cleanerId: b.cleaner_id,
      cleanerName: b.cleaner_name,
      cleanerInitials: b.cleaner_name ? b.cleaner_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : '?',
      status: b.status || 'pending',
      price: b.total_price || 0,
    }));
  }, [stats]);

  // Transform chart data for enhanced charts (they expect date format)
  const transformedChartData = useMemo(() => {
    if (chartData && chartData.length > 0) {
      return chartData.map(item => ({
        date: item.date,
        revenue: item.revenue || 0,
        bookings: item.bookings || 0,
        completed: item.completed || 0,
        companyEarnings: item.companyEarnings || 0,
      }));
    }
    return [];
  }, [chartData]);

  // Service breakdown
  const topServices = useMemo(() => {
    if (!stats?.serviceTypeBreakdown) return [];
    const totalRevenue = Object.values(stats.serviceTypeBreakdown).reduce((sum: number, data: any) => sum + data.revenue, 0);
    return Object.entries(stats.serviceTypeBreakdown)
      .map(([type, data]: [string, any]) => ({
        title: type,
        revenue: data.revenue,
        bookings: data.bookings,
        avg: data.bookings > 0 ? Math.round(data.revenue / data.bookings) : 0,
        top: false,
        percentage: totalRevenue > 0 ? Math.round((data.revenue / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map((s, i) => ({ ...s, top: i === 0 }));
  }, [stats]);

  // Generate sparkline data for metrics
  const sparklineData = useMemo(() => generateMockSparkline(7), []);

  // Pipeline stats
  const pipeline = useMemo(() => {
    if (!stats) return { quotes: 0, conversion: 0, applications: 0, reviewRate: 0, retention: 0 };
    
    const conversion = stats.quotes?.total > 0
      ? Math.round((stats.quotes?.converted || 0) / stats.quotes.total * 100)
      : 0;

    const reviewRate = stats.applications?.total > 0
      ? Math.round(((stats.applications.total - stats.applications.pending) / stats.applications.total) * 100)
      : 0;

    return {
      quotes: stats.quotes?.total || 0,
      conversion,
      applications: stats.applications?.total || 0,
      reviewRate,
      retention: stats.customers?.retentionRate || 0,
    };
  }, [stats]);

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error instanceof Error ? error.message : 'Failed to load stats'}</p>
        <Button onClick={handleRefresh} className="mt-4" variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mobile Summary Bar */}
      <MobileSummaryBar 
        revenue={metrics.todayRevenue}
        bookings={metrics.bookingsToday}
        cleaners={metrics.cleanersAvailable}
      />

      {/* Date Range Filter */}
      <div>
        <DateRangeFilter 
          onDateRangeChange={setDateRangeDays} 
          selectedDays={dateRangeDays}
        />
      </div>

      {/* Critical Alerts Panel - Priority Position */}
      <CriticalAlertsPanel />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <MetricAlerts alerts={alerts} />
        </div>
        <div className="space-y-3">
          <StatCard 
            title="Company Earnings" 
            value={formatCurrency(metrics.companyEarnings)} 
            hint="All time"
            sparklineData={sparklineData}
          />
          <StatCard 
            title="Total Bookings" 
            value={metrics.totalBookings} 
            hint={`${metrics.activeCleaners} active cleaners`}
          />
        </div>
      </div>

      <SnapshotCard 
        metrics={metrics}
        sparklineData={sparklineData}
        recentBookings={bookings.slice(0, 7)}
      />

      {/* Operations Command Center */}
      {stats && <OperationsCommand stats={stats} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <TrendsCharts chartData={transformedChartData} isLoadingChart={isLoadingChart} />
          
          {/* Service Revenue Breakdown */}
          {stats && stats.serviceTypeBreakdown && (
            <ServiceRevenueChart 
              data={Object.entries(stats.serviceTypeBreakdown).map(([key, value]: [string, any]) => ({
                service_type: key,
                revenue: value.revenue,
                bookings: value.bookings,
                avgValue: value.bookings > 0 ? value.revenue / value.bookings : 0,
              }))}
            />
          )}
          
          <BusinessPipeline pipeline={pipeline} />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Financial Health</h3>
              <Tooltip content="Quick financial overview">
                <DollarSign />
              </Tooltip>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                title="Total Rev" 
                value={formatCurrency(metrics.totalRevenue)} 
                delta={financialDeltas.totalRevenue} 
                hint="vs previous period"
                sparklineData={sparklineData}
              />
              <StatCard 
                title="Profit Margin" 
                value={`${metrics.profitMarginPct}%`} 
                delta={financialDeltas.profitMargin} 
                hint="vs previous period"
              />
              <StatCard 
                title="Avg Booking" 
                value={formatCurrency(metrics.avgBookingValue)} 
                delta={financialDeltas.avgBooking} 
                hint="vs previous period"
              />
            </div>
          </div>

          {/* Payment Status Widget */}
          <PaymentStatusWidget />

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Service Performance</h3>
            <div className="grid grid-cols-1 gap-3">
              {topServices.map((s) => (
                <ServiceCard key={s.title} service={s} />
              ))}
            </div>
          </div>

          <PerformanceWidget />
          <RecentActivities />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">Connected to real-time data from Shalean cleaning services platform.</div>

      {/* Export Dialog */}
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />

      {/* Floating Action Button */}
      <FAB
        onNewBooking={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'bookings' }))}
        onAssignCleaner={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'bookings' }))}
        onReviewApplications={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'applications' }))}
        onExportCSV={() => setExportDialogOpen(true)}
      />
    </div>
  );
}

