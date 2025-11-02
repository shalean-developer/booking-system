'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, DollarSign, Users, Calendar, Briefcase, CheckCircle, FileText, TrendingUp, TrendingDown, Percent, Receipt, Activity, Repeat, UserPlus, RefreshCw, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { ActivityFeed } from './activity-feed';
import { DateRangeFilter } from './date-range-filter';
import { RevenueChart } from './revenue-chart';
import { BookingsChart } from './bookings-chart';
import { MetricAlerts } from './metric-alerts';
import { ExportDialog } from './export-dialog';
import { PerformanceWidget } from './performance-widget';
import { OperationsCommand } from './operations-command';
import { ServicePerformance } from './service-performance';
import { PipelineSection } from './pipeline-section';
import { TodaySnapshot } from './today-snapshot';
import { formatCurrency, formatPercentage, formatPercentageChange } from '@/lib/utils/formatting';
import { recentPeriodPercentage } from '@/lib/utils/calculations';
import { Tooltip } from '@/components/ui/tooltip';

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

export function AdminDashboardView() {
  // Calculate days from start of current month to today
  const getCurrentMonthDays = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysDifference = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
    return daysDifference + 1; // +1 to include today
  };

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [dateRangeDays, setDateRangeDays] = useState(getCurrentMonthDays());
  const [chartData, setChartData] = useState<any[]>([]);

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
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  useEffect(() => {
    if (data?.stats) {
      setLastUpdated(new Date());
    }
  }, [data]);

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

  // Helper function to get period label based on days
  const getPeriodLabel = (days: number): string => {
    const currentMonthDays = getCurrentMonthDays();
    if (days === currentMonthDays) return 'current month';
    if (days === 1) return 'today';
    if (days === 7) return 'last 7 days';
    if (days === 30) return 'last 30 days';
    if (days === 90) return 'last 90 days';
    if (days === 180) return 'last 6 months';
    return `last ${days} days`;
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button and date filter */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold">Dashboard Overview</h2>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="flex-1 sm:flex-initial"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
        <DateRangeFilter 
          onDateRangeChange={setDateRangeDays} 
          selectedDays={dateRangeDays}
        />
      </div>

      {/* Metric Alerts */}
      {stats && <MetricAlerts stats={stats} />}
      
      {/* Today's Snapshot */}
      {stats && <TodaySnapshot stats={stats} />}
      
      {/* Operations Command Center */}
      {stats && <OperationsCommand stats={stats} />}
      
      {/* Financial Health Section */}
      <div className="space-y-4">
        <div className="section-header">
          <DollarSign className="section-header-icon" />
          <h3 className="section-header-title">Financial Health</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="metric-card cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              Total Revenue
              <Tooltip content="Total revenue from all bookings (including cleaner earnings and service fees)">
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </Tooltip>
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {formatCurrency(stats.revenue.total)}
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              {stats.revenue.today !== undefined && stats.revenue.today > 0 && (
                <p className="text-sm font-medium text-blue-600">
                  {formatCurrency(stats.revenue.today)} today
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {formatCurrency(stats.revenue.recent)} from {getPeriodLabel(dateRangeDays)}
              </p>
              {stats.revenue.total > 0 && stats.revenue.recent > 0 && (
                <Tooltip content={`${formatPercentage(recentPeriodPercentage(stats.revenue.recent, stats.revenue.total, 1))} of total revenue comes from the ${getPeriodLabel(dateRangeDays)}`}>
                  <span className="text-sm text-green-600 font-medium cursor-help">
                    {formatPercentage(recentPeriodPercentage(stats.revenue.recent, stats.revenue.total, 1))} from {getPeriodLabel(dateRangeDays)}
                  </span>
                </Tooltip>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium flex items-center gap-1.5">
              Company Earnings
              <Tooltip content="Company earnings after paying cleaner commissions (total revenue minus cleaner earnings)">
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </Tooltip>
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.revenue.companyEarnings)}
              </div>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-sm text-muted-foreground">
                {formatCurrency(stats.revenue.recentCompanyEarnings)} from {getPeriodLabel(dateRangeDays)}
              </p>
              {stats.revenue.companyEarnings > 0 && (
                <Tooltip content={`${formatPercentage(recentPeriodPercentage(stats.revenue.recentCompanyEarnings, stats.revenue.companyEarnings, 1))} of total company earnings come from the ${getPeriodLabel(dateRangeDays)}`}>
                  <span className="text-sm text-green-600 font-medium cursor-help">
                    {formatPercentage(recentPeriodPercentage(stats.revenue.recentCompanyEarnings, stats.revenue.companyEarnings, 1))} from {getPeriodLabel(dateRangeDays)}
                  </span>
                </Tooltip>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {stats.revenue.profitMargin}%
              </div>
              {stats.revenue.profitMargin !== stats.revenue.recentProfitMargin && (
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  stats.revenue.profitMargin > stats.revenue.recentProfitMargin ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stats.revenue.profitMargin > stats.revenue.recentProfitMargin ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  <span>{stats.revenue.profitMargin > stats.revenue.recentProfitMargin ? '+' : ''}{(stats.revenue.profitMargin - stats.revenue.recentProfitMargin).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-sm text-muted-foreground">
                {stats.revenue.recentProfitMargin}% {getPeriodLabel(dateRangeDays)}
              </p>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-4">
        <div className="section-header">
          <Activity className="section-header-icon" />
          <h3 className="section-header-title">Key Metrics</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card 
          className="metric-card cursor-pointer"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'bookings' }));
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{stats.bookings.total}</div>
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <p className="text-sm text-muted-foreground">
                {stats.bookings.recent} in {getPeriodLabel(dateRangeDays)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="metric-card cursor-pointer"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'cleaners' }));
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium">Active Cleaners</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-2xl font-bold">{stats.cleaners.active}</div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.cleaners.total} total cleaners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-2xl font-bold">
              {stats.customers.retentionRate}%
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {stats.customers.repeat} repeat customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-2xl font-bold">
              {formatCurrency(stats.revenue.avgBookingValue)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {formatCurrency(stats.revenue.recentAvgBookingValue)} recent
            </p>
          </CardContent>
        </Card>
        </div>
      </div>

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <RevenueChart data={chartData} isLoading={isLoadingChart} />
        <BookingsChart data={chartData} isLoading={isLoadingChart} />
      </div>

      {/* Comparison Metrics */}
      {comparisonData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Change</CardTitle>
              {comparisonData.revenue.change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentageChange(comparisonData.revenue.change)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs previous period
              </p>
              <div className="mt-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Current:</span>
                  <span className="font-medium">{formatCurrency(comparisonData.revenue.current, false)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Previous:</span>
                  <span>{formatCurrency(comparisonData.revenue.previous, false)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bookings Change</CardTitle>
              {comparisonData.bookings.change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentageChange(comparisonData.bookings.change)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs previous period
              </p>
              <div className="mt-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Current:</span>
                  <span className="font-medium">{comparisonData.bookings.current}</span>
                </div>
                <div className="flex justify-between">
                  <span>Previous:</span>
                  <span>{comparisonData.bookings.previous}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Change</CardTitle>
              {comparisonData.completed.change >= 0 ? (
                <ArrowUpRight className="h-4 w-4 text-green-600" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPercentageChange(comparisonData.completed.change)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                vs previous period
              </p>
              <div className="mt-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span>Current:</span>
                  <span className="font-medium">{comparisonData.completed.current}</span>
                </div>
                <div className="flex justify-between">
                  <span>Previous:</span>
                  <span>{comparisonData.completed.previous}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Feed & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <ActivityFeed />
        <PerformanceWidget />
      </div>

      {/* Export Dialog */}
      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
    </div>
  );
}

