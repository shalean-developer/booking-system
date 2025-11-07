'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { MetricAlerts } from './metric-alerts';
import { CriticalAlertsPanel } from './critical-alerts-panel';
import { TodaySnapshot } from './today-snapshot';
import { OperationsCommand } from './operations-command';
import { ServicePerformance } from './service-performance';
import { PipelineSection } from './pipeline-section';
import { RevenueChartEnhanced } from './revenue-chart-enhanced';
import { BookingsChartEnhanced } from './bookings-chart-enhanced';
import { ActivityFeed } from './activity-feed';
import { PerformanceWidget } from './performance-widget';
import { ExportDialog } from './export-dialog';
import { StatCard } from './stat-card';
import { DateRangeFilter } from './date-range-filter';
import { PaymentStatusWidget } from './payment-status-widget';
import { ServiceRevenueChart } from './service-revenue-chart';
import { RevenueTrendsWidget } from './revenue-trends-widget';
import { CleanerPerformanceWidget } from './cleaner-performance-widget';
import { TodaysBookingsWidget } from './todays-bookings-widget';
import { ActiveCleanersWidget } from './active-cleaners-widget';
import { RecentActivityWidget } from './recent-activity-widget';
import { QuotesWidgetDashboard } from './quotes-widget-dashboard';
import { DollarSign, Calendar, Percent, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { useFilterPeriod, type FilterPeriod } from '@/context/FilterPeriodContext';
import { startOfMonth, endOfMonth } from 'date-fns';

interface Stats {
  bookings: {
    total: number;
    recent: number;
    today?: number;
    pending: number;
    accepted: number;
    completed: number;
    unassigned?: number;
    unassignedList?: any[];
    todayBookings?: any[];
  };
  revenue: {
    total: number;
    recent: number;
    today?: number;
    cleanerEarnings: number;
    recentCleanerEarnings: number;
    companyEarnings: number;
    recentCompanyEarnings: number;
    serviceFees: number;
    recentServiceFees: number;
    profitMargin: number;
    recentProfitMargin: number;
    avgBookingValue: number;
    recentAvgBookingValue: number;
  };
  customers: {
    total: number;
    repeat: number;
    retentionRate: number;
  };
  cleaners: {
    total: number;
    active: number;
    utilization: number;
    availableToday?: number;
    availableTomorrow?: number;
  };
  applications: {
    total: number;
    pending: number;
  };
  quotes: {
    total: number;
    pending: number;
    contacted: number;
    converted: number;
    oldPending?: number;
    oldPendingList?: any[];
  };
  tomorrowBookings: Array<{
    id: string;
    customer_name: string;
    booking_time: string;
    service_type: string;
    status: string;
    cleaner_name?: string | null;
  }>;
  serviceTypeBreakdown?: Record<string, { bookings: number; revenue: number }>;
  recentServiceTypeBreakdown?: Record<string, { bookings: number; revenue: number }>;
}

export function AdminDashboardViewV2() {
  const { selectedPeriod } = useFilterPeriod();

  // Convert filter period to days for API calls
  const getDaysForPeriod = (period: FilterPeriod): number => {
    switch (period) {
      case 'Today':
        return 1;
      case '7 days':
        return 7;
      case 'Last 10 days':
        return 10;
      case '30 days':
        return 30;
      case '90 days':
        return 90;
      case 'Month': {
        const today = new Date();
        const start = startOfMonth(today);
        const end = endOfMonth(today);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      default:
        return 30;
    }
  };

  // Use filter period from context, fallback to current month days
  const dateRangeDays = getDaysForPeriod(selectedPeriod);
  const [chartData, setChartData] = useState<any[]>([]);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  const { data, error, isLoading, mutate } = useSWR<{
    ok: boolean;
    stats?: Stats;
    error?: string;
  }>(
    `/api/admin/stats?days=${dateRangeDays}`,
    async (url) => {
      const response = await fetch(url, {
        credentials: 'include',
      });
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

  const stats = data?.stats || null;
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

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
  }, [selectedPeriod]); // Refetch when period changes (dateRangeDays is computed from selectedPeriod)

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

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Date Range Filter - Now controlled by navbar filter period */}
      {/* <div>
        <DateRangeFilter 
          onDateRangeChange={setDateRangeDays} 
          selectedDays={dateRangeDays}
        />
      </div> */}

      {/* Critical Alerts Panel - Priority Position */}
      <CriticalAlertsPanel />

      {/* Top Section: Alerts + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Metric Alerts */}
          {stats && <MetricAlerts stats={stats} />}
          
          {/* Today's Snapshot */}
          {stats && <TodaySnapshot stats={stats} />}
          
          {/* Operations Command Center */}
          {stats && <OperationsCommand stats={stats} />}
        </div>

        {/* Right Sidebar: Quick Metrics */}
        <div className="space-y-4">
          <div className="sticky top-24">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.revenue.total)}
              icon={<DollarSign className="h-4 w-4" />}
              delay={0.1}
            />
            <StatCard
              title="Company Earnings"
              value={formatCurrency(stats.revenue.companyEarnings)}
              icon={<TrendingUp className="h-4 w-4" />}
              delay={0.2}
            />
            <StatCard
              title="Profit Margin"
              value={`${stats.revenue.profitMargin}%`}
              icon={<Percent className="h-4 w-4" />}
              delay={0.3}
            />
            <StatCard
              title="Avg Booking Value"
              value={formatCurrency(stats.revenue.avgBookingValue)}
              icon={<Calendar className="h-4 w-4" />}
              delay={0.4}
            />
          </div>
        </div>
      </div>

      {/* Dashboard Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <TodaysBookingsWidget 
          bookings={stats?.bookings?.todayBookings || []} 
        />
        <ActiveCleanersWidget 
          totalCleaners={stats?.cleaners?.total || 0}
        />
        <RecentActivityWidget 
          stats={{
            bookings: {
              today: stats?.bookings?.today || stats?.bookings?.todayBookings?.length || 0,
              pending: stats?.bookings?.pending || 0,
              completed: stats?.bookings?.completed || 0,
            }
          }}
        />
        <QuotesWidgetDashboard 
          pendingCount={stats?.quotes?.pending || 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Service Performance */}
          {stats && stats.serviceTypeBreakdown && (
            <ServicePerformance 
              serviceTypeBreakdown={stats.serviceTypeBreakdown}
              recentServiceTypeBreakdown={stats.recentServiceTypeBreakdown}
            />
          )}

          {/* Pipeline Section */}
          {stats && <PipelineSection stats={stats} />}

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueChartEnhanced data={chartData} isLoading={isLoadingChart} />
            <BookingsChartEnhanced data={chartData} isLoading={isLoadingChart} />
          </div>

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

          {/* Activity Feed */}
          <ActivityFeed />
        </div>

        <div className="space-y-6">
          {/* Payment Status */}
          <PaymentStatusWidget />
          
          {/* Cleaner Performance */}
          <CleanerPerformanceWidget limit={5} />
          
          <PerformanceWidget />
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
    </div>
  );
}

