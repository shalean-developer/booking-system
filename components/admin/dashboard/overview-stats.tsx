'use client';

import { StatCard } from '@/components/admin/shared/stat-card';
import { DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import type { DashboardStats } from '@/types/admin-dashboard';
import type { DateRangePeriod } from '@/components/admin/shared/date-range-selector';

interface OverviewStatsProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
  dateRange?: DateRangePeriod;
}

// Helper function to generate comparison label based on date range
function getComparisonLabel(dateRange?: DateRangePeriod): string {
  switch (dateRange) {
    case 'today':
      return 'from yesterday';
    case 'week':
      return 'from previous 7 days';
    case 'month':
      return 'from previous 30 days';
    case 'year':
      return 'from previous year';
    case 'custom':
      return 'from previous period';
    default:
      return 'from previous period';
  }
}

export function OverviewStats({ stats, isLoading = false, dateRange }: OverviewStatsProps) {
  const comparisonLabel = getComparisonLabel(dateRange);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : 'R0.00'}
        icon={DollarSign}
        iconColor="text-green-600"
        isLoading={isLoading}
        delta={stats?.revenueGrowth}
        deltaLabel={comparisonLabel}
      />
      <StatCard
        title="Total Bookings"
        value={stats?.totalBookings || 0}
        icon={Calendar}
        iconColor="text-blue-600"
        isLoading={isLoading}
        delta={stats?.bookingsGrowth}
        deltaLabel={comparisonLabel}
      />
      <StatCard
        title="Active Customers"
        value={stats?.activeCustomers || 0}
        icon={Users}
        iconColor="text-purple-600"
        isLoading={isLoading}
        delta={stats?.customersGrowth}
        deltaLabel={comparisonLabel}
      />
      <StatCard
        title="Avg Booking Value"
        value={stats?.avgBookingValue ? formatCurrency(stats.avgBookingValue) : 'R0.00'}
        icon={TrendingUp}
        iconColor="text-orange-600"
        isLoading={isLoading}
        delta={stats?.avgValueGrowth}
        deltaLabel={comparisonLabel}
      />
    </div>
  );
}
