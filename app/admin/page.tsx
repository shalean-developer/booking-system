'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { getDateRange } from '@/lib/utils/formatting';
import {
  validateDashboardStats,
  validateBookingPipeline,
  validateServiceBreakdown,
  validateChartData,
  validateRecentBookings,
} from '@/lib/utils/validation';
import type {
  DashboardStats,
  BookingPipeline as BookingPipelineType,
  ServiceBreakdownItem,
  ChartDataPoint,
  RecentBooking,
} from '@/types/admin-dashboard';

interface DashboardErrors {
  stats: string | null;
  pipeline: string | null;
  serviceBreakdown: string | null;
  chart: string | null;
  bookings: string | null;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [pipeline, setPipeline] = useState<BookingPipelineType | null>(null);
  const [serviceBreakdown, setServiceBreakdown] = useState<ServiceBreakdownItem[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errors, setErrors] = useState<DashboardErrors>({
    stats: null,
    pipeline: null,
    serviceBreakdown: null,
    chart: null,
    bookings: null,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [dateRange, setDateRange] = useState<DateRangePeriod>('month');

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Clear previous errors
      setErrors({
        stats: null,
        pipeline: null,
        serviceBreakdown: null,
        chart: null,
        bookings: null,
      });

      // Get date range for chart data
      const { dateFrom, dateTo } = dateRange === 'custom' 
        ? { dateFrom: '', dateTo: '' } // Custom will be handled separately if needed
        : getDateRange(dateRange);
      
      const chartUrl = dateRange === 'custom' 
        ? '/api/admin/stats/chart'
        : `/api/admin/stats/chart?date_from=${dateFrom}&date_to=${dateTo}`;

      const [statsRes, pipelineRes, serviceRes, chartRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/stats').catch(() => ({ ok: false, json: async () => ({ ok: false, error: 'Network error' }) })),
        fetch('/api/admin/stats/booking-pipeline').catch(() => ({ ok: false, json: async () => ({ ok: false, error: 'Network error' }) })),
        fetch('/api/admin/stats/service-breakdown').catch(() => ({ ok: false, json: async () => ({ ok: false, data: [], error: 'Network error' }) })),
        fetch(chartUrl).catch(() => ({ ok: false, json: async () => ({ ok: false, data: [], error: 'Network error' }) })),
        fetch('/api/admin/bookings?limit=10').catch(() => ({ ok: false, json: async () => ({ ok: false, bookings: [], error: 'Network error' }) })),
      ]);

      const results = await Promise.allSettled([
        statsRes.json().catch(() => ({ ok: false, error: 'Failed to parse response' })),
        pipelineRes.json().catch(() => ({ ok: false, error: 'Failed to parse response' })),
        serviceRes.json().catch(() => ({ ok: false, data: [], error: 'Failed to parse response' })),
        chartRes.json().catch(() => ({ ok: false, data: [], error: 'Failed to parse response' })),
        bookingsRes.json().catch(() => ({ ok: false, bookings: [], error: 'Failed to parse response' })),
      ]);

      const [statsResult, pipelineResult, serviceResult, chartResult, bookingsResult] = results;

      // Handle stats with validation
      if (statsResult.status === 'fulfilled' && statsResult.value.ok && statsResult.value.stats) {
        if (validateDashboardStats(statsResult.value.stats)) {
          setStats(statsResult.value.stats);
          setErrors((prev) => ({ ...prev, stats: null }));
        } else {
          setErrors((prev) => ({ ...prev, stats: 'Invalid statistics data format' }));
        }
      } else {
        const errorMsg = statsResult.status === 'rejected' 
          ? 'Failed to fetch statistics'
          : statsResult.value.error || 'Failed to fetch statistics';
        setErrors((prev) => ({ ...prev, stats: errorMsg }));
      }

      // Handle pipeline with validation
      if (pipelineResult.status === 'fulfilled' && pipelineResult.value.ok && pipelineResult.value.pipeline) {
        if (validateBookingPipeline(pipelineResult.value.pipeline)) {
          setPipeline(pipelineResult.value.pipeline);
          setErrors((prev) => ({ ...prev, pipeline: null }));
        } else {
          setErrors((prev) => ({ ...prev, pipeline: 'Invalid pipeline data format' }));
        }
      } else {
        const errorMsg = pipelineResult.status === 'rejected'
          ? 'Failed to fetch booking pipeline'
          : pipelineResult.value.error || 'Failed to fetch booking pipeline';
        setErrors((prev) => ({ ...prev, pipeline: errorMsg }));
      }

      // Handle service breakdown with validation
      if (serviceResult.status === 'fulfilled' && serviceResult.value.ok) {
        const data = serviceResult.value.data || [];
        if (validateServiceBreakdown(data)) {
          setServiceBreakdown(data);
          setErrors((prev) => ({ ...prev, serviceBreakdown: null }));
        } else {
          setErrors((prev) => ({ ...prev, serviceBreakdown: 'Invalid service breakdown data format' }));
        }
      } else {
        const errorMsg = serviceResult.status === 'rejected'
          ? 'Failed to fetch service breakdown'
          : serviceResult.value.error || 'Failed to fetch service breakdown';
        setErrors((prev) => ({ ...prev, serviceBreakdown: errorMsg }));
      }

      // Handle chart data with validation
      if (chartResult.status === 'fulfilled' && chartResult.value.ok) {
        const data = chartResult.value.data || [];
        if (validateChartData(data)) {
          setChartData(data);
          setErrors((prev) => ({ ...prev, chart: null }));
        } else {
          setErrors((prev) => ({ ...prev, chart: 'Invalid chart data format' }));
        }
      } else {
        const errorMsg = chartResult.status === 'rejected'
          ? 'Failed to fetch chart data'
          : chartResult.value.error || 'Failed to fetch chart data';
        setErrors((prev) => ({ ...prev, chart: errorMsg }));
      }

      // Handle recent bookings with validation
      if (bookingsResult.status === 'fulfilled' && bookingsResult.value.ok) {
        const bookings = bookingsResult.value.bookings || [];
        if (validateRecentBookings(bookings)) {
          setRecentBookings(bookings);
          setErrors((prev) => ({ ...prev, bookings: null }));
        } else {
          setErrors((prev) => ({ ...prev, bookings: 'Invalid bookings data format' }));
        }
      } else {
        const errorMsg = bookingsResult.status === 'rejected'
          ? 'Failed to fetch recent bookings'
          : bookingsResult.value.error || 'Failed to fetch recent bookings';
        setErrors((prev) => ({ ...prev, bookings: errorMsg }));
      }

      setLastUpdated(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({
        stats: errorMessage,
        pipeline: errorMessage,
        serviceBreakdown: errorMessage,
        chart: errorMessage,
        bookings: errorMessage,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, dateRange]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchDashboardData(true);
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
    // fetchDashboardData is stable due to useCallback, so we can safely omit it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const hasAnyError = Object.values(errors).some((error) => error !== null);

  return (
    <ErrorBoundary>
      <div className="space-y-6 w-full">
        <PageHeader
          title="Dashboard"
          description={
            lastUpdated
              ? `Overview of your business metrics and recent activity • Last updated: ${lastUpdated.toLocaleTimeString()}`
              : 'Overview of your business metrics and recent activity'
          }
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
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
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
                onRetry={() => fetchDashboardData(true)}
                onDismiss={() => setErrors((prev) => ({ ...prev, stats: null }))}
              />
            )}
            {errors.pipeline && (
              <ErrorAlert
                title="Failed to load booking pipeline"
                message={errors.pipeline}
                onRetry={() => fetchDashboardData(true)}
                onDismiss={() => setErrors((prev) => ({ ...prev, pipeline: null }))}
                variant="default"
              />
            )}
            {errors.serviceBreakdown && (
              <ErrorAlert
                title="Failed to load service breakdown"
                message={errors.serviceBreakdown}
                onRetry={() => fetchDashboardData(true)}
                onDismiss={() => setErrors((prev) => ({ ...prev, serviceBreakdown: null }))}
                variant="default"
              />
            )}
            {errors.chart && (
              <ErrorAlert
                title="Failed to load chart data"
                message={errors.chart}
                onRetry={() => fetchDashboardData(true)}
                onDismiss={() => setErrors((prev) => ({ ...prev, chart: null }))}
                variant="default"
              />
            )}
            {errors.bookings && (
              <ErrorAlert
                title="Failed to load recent bookings"
                message={errors.bookings}
                onRetry={() => fetchDashboardData(true)}
                onDismiss={() => setErrors((prev) => ({ ...prev, bookings: null }))}
                variant="default"
              />
            )}
          </div>
        )}

        <ErrorBoundary>
          <OverviewStats stats={stats} isLoading={isLoading} />
        </ErrorBoundary>

        <div className="grid gap-6 md:grid-cols-2 w-full">
          <ErrorBoundary>
            <RevenueChartEnhanced data={chartData} isLoading={isLoading} />
          </ErrorBoundary>
          <ErrorBoundary>
            <BookingsChartEnhanced data={chartData} isLoading={isLoading} />
          </ErrorBoundary>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 w-full">
          <div className="lg:col-span-2 space-y-6">
            <ErrorBoundary>
              <ServiceBreakdown data={serviceBreakdown} isLoading={isLoading} />
            </ErrorBoundary>
            <ErrorBoundary>
              <RecentActivity bookings={recentBookings} isLoading={isLoading} />
            </ErrorBoundary>
          </div>

          <div className="space-y-6">
            <ErrorBoundary>
              <BookingPipeline pipeline={pipeline} isLoading={isLoading} />
            </ErrorBoundary>
            <ErrorBoundary>
              <PendingAlerts
                pendingQuotes={stats?.pendingQuotes}
                pendingApplications={stats?.pendingApplications}
                pendingBookings={stats?.pendingBookings}
                isLoading={isLoading}
              />
            </ErrorBoundary>
            <QuickActions />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
