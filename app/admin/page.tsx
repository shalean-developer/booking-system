'use client';

import { useState, useEffect } from 'react';
import { useSWRConfig } from 'swr';
import { PageHeader } from '@/components/admin/shared/page-header';
import { OverviewStats } from '@/components/admin/dashboard/overview-stats';
import { BookingPipeline } from '@/components/admin/dashboard/booking-pipeline';
import { ServiceBreakdown } from '@/components/admin/dashboard/service-breakdown';
import { QuickActions } from '@/components/admin/dashboard/quick-actions';
import { RecentActivity } from '@/components/admin/dashboard/recent-activity';
import { PendingAlerts } from '@/components/admin/dashboard/pending-alerts';
import { RevenueChartEnhanced } from '@/components/admin/revenue-chart-enhanced';
import { BookingsChartEnhanced } from '@/components/admin/bookings-chart-enhanced';
import { ErrorAlert } from '@/components/admin/shared/error-alert';
import { ErrorBoundary } from '@/components/admin/shared/error-boundary';
import { DateRangeSelector, type DateRangePeriod } from '@/components/admin/shared/date-range-selector';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { useBookingPipeline } from '@/hooks/use-booking-pipeline';
import { useServiceBreakdown } from '@/hooks/use-service-breakdown';
import { useChartData } from '@/hooks/use-chart-data';
import { useRecentBookings } from '@/hooks/use-recent-bookings';

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRangePeriod>('month');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const { mutate: mutateAll } = useSWRConfig();

  // Use SWR hooks for data fetching
  const { stats, isLoading: statsLoading, isError: statsError, error: statsErrorMsg, mutate: mutateStats } = useDashboardStats();
  const { pipeline, isLoading: pipelineLoading, isError: pipelineError, error: pipelineErrorMsg, mutate: mutatePipeline } = useBookingPipeline();
  const { serviceBreakdown, isLoading: breakdownLoading, isError: breakdownError, error: breakdownErrorMsg, mutate: mutateBreakdown } = useServiceBreakdown();
  const { chartData, isLoading: chartLoading, isError: chartError, error: chartErrorMsg, mutate: mutateChart } = useChartData(dateRange);
  const { recentBookings, isLoading: bookingsLoading, isError: bookingsError, error: bookingsErrorMsg, mutate: mutateBookings } = useRecentBookings(10);

  // Debug: Log data states (temporary)
  useEffect(() => {
    console.log('[Dashboard Data Check]', {
      stats: { hasData: !!stats, loading: statsLoading, error: statsError },
      chartData: { hasData: chartData?.length > 0, length: chartData?.length, loading: chartLoading, error: chartError },
      pipeline: { hasData: !!pipeline, loading: pipelineLoading, error: pipelineError },
      serviceBreakdown: { hasData: serviceBreakdown?.length > 0, length: serviceBreakdown?.length, loading: breakdownLoading, error: breakdownError },
      recentBookings: { hasData: recentBookings?.length > 0, length: recentBookings?.length, loading: bookingsLoading, error: bookingsError },
    });
  }, [stats, chartData, pipeline, serviceBreakdown, recentBookings, statsLoading, chartLoading, pipelineLoading, breakdownLoading, bookingsLoading, statsError, chartError, pipelineError, breakdownError, bookingsError]);

  // Combined loading state
  const isLoading = statsLoading || pipelineLoading || breakdownLoading || chartLoading || bookingsLoading;
  
  // Combined errors
  const errors = {
    stats: statsError ? statsErrorMsg : null,
    pipeline: pipelineError ? pipelineErrorMsg : null,
    serviceBreakdown: breakdownError ? breakdownErrorMsg : null,
    chart: chartError ? chartErrorMsg : null,
    bookings: bookingsError ? bookingsErrorMsg : null,
  };

  // Handle refresh - revalidate all SWR data
  const handleRefresh = () => {
    mutateStats();
    mutatePipeline();
    mutateBreakdown();
    mutateChart();
    mutateBookings();
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        handleRefresh();
      }, 60000); // Refresh every 60 seconds
      setAutoRefreshInterval(interval);
      return () => {
        clearInterval(interval);
      };
    } else {
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        setAutoRefreshInterval(null);
        }
    }
  }, [autoRefresh, mutateStats, mutatePipeline, mutateBreakdown, mutateChart, mutateBookings]);

  const hasAnyError = Object.values(errors).some((error) => error !== null);
  const isRefreshing = false; // SWR handles loading states internally

  return (
    <ErrorBoundary>
    <div className="space-y-6 w-full">
      <PageHeader
        title="Dashboard"
        description="Overview of your business metrics and recent activity"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Dashboard' },
        ]}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              <DateRangeSelector value={dateRange} onChange={setDateRange} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              </Button>
            </div>
          }
        />

        {hasAnyError && (
          <div className="space-y-3">
            {errors.stats && (
              <ErrorAlert
                title="Failed to load statistics"
                message={errors.stats}
                onRetry={mutateStats}
              />
            )}
            {errors.pipeline && (
              <ErrorAlert
                title="Failed to load booking pipeline"
                message={errors.pipeline}
                onRetry={mutatePipeline}
                variant="default"
              />
            )}
            {errors.serviceBreakdown && (
              <ErrorAlert
                title="Failed to load service breakdown"
                message={errors.serviceBreakdown}
                onRetry={mutateBreakdown}
                variant="default"
              />
            )}
            {errors.chart && (
              <ErrorAlert
                title="Failed to load chart data"
                message={errors.chart}
                onRetry={mutateChart}
                variant="default"
              />
            )}
            {errors.bookings && (
              <ErrorAlert
                title="Failed to load recent bookings"
                message={errors.bookings}
                onRetry={mutateBookings}
                variant="default"
              />
            )}
          </div>
        )}

        <ErrorBoundary>
      <OverviewStats stats={stats} isLoading={statsLoading} />
        </ErrorBoundary>

      <div className="grid gap-6 md:grid-cols-2 w-full">
          <ErrorBoundary>
        <RevenueChartEnhanced data={chartData} isLoading={chartLoading} />
          </ErrorBoundary>
          <ErrorBoundary>
        <BookingsChartEnhanced data={chartData} isLoading={chartLoading} />
          </ErrorBoundary>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 w-full">
        <div className="lg:col-span-2 space-y-6">
            <ErrorBoundary>
          <ServiceBreakdown data={serviceBreakdown} isLoading={breakdownLoading} />
            </ErrorBoundary>
            <ErrorBoundary>
          <RecentActivity bookings={recentBookings} isLoading={bookingsLoading} />
            </ErrorBoundary>
        </div>

        <div className="space-y-6">
            <ErrorBoundary>
          <BookingPipeline pipeline={pipeline} isLoading={pipelineLoading} />
            </ErrorBoundary>
            <ErrorBoundary>
          <PendingAlerts
            pendingQuotes={stats?.pendingQuotes}
            pendingApplications={stats?.pendingApplications}
            pendingBookings={stats?.pendingBookings}
            isLoading={statsLoading}
          />
            </ErrorBoundary>
          <QuickActions />
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
