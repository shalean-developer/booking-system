'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { MetricAlerts } from './metric-alerts';
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
import { DollarSign, Calendar, Percent, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';

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
  // Calculate days from start of current month to today
  const getCurrentMonthDays = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysDifference = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
    return daysDifference + 1;
  };

  const [dateRangeDays, setDateRangeDays] = useState(getCurrentMonthDays());
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
      {/* Date Range Filter */}
      <div>
        <DateRangeFilter 
          onDateRangeChange={setDateRangeDays} 
          selectedDays={dateRangeDays}
        />
      </div>

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

          {/* Activity Feed */}
          <ActivityFeed />
        </div>

        <div className="space-y-6">
          <PerformanceWidget />
        </div>
      </div>

      {/* Export Dialog */}
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
    </div>
  );
}

