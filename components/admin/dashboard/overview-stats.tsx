'use client';

import { StatCard } from '@/components/admin/shared/stat-card';
import { DollarSign, Calendar, TrendingUp, Users } from 'lucide-react';
import type { DashboardStats } from '@/types/admin-dashboard';

interface OverviewStatsProps {
  stats: DashboardStats | null;
  isLoading?: boolean;
}

export function OverviewStats({ stats, isLoading = false }: OverviewStatsProps) {
  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Revenue"
        value={stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : 'R0.00'}
        icon={DollarSign}
        iconColor="text-green-600"
        isLoading={isLoading}
        delta={stats?.revenueGrowth}
        deltaLabel="from last month"
      />
      <StatCard
        title="Total Bookings"
        value={stats?.totalBookings || 0}
        icon={Calendar}
        iconColor="text-blue-600"
        isLoading={isLoading}
        delta={stats?.bookingsGrowth}
        deltaLabel="from last month"
      />
      <StatCard
        title="Active Customers"
        value={stats?.activeCustomers || 0}
        icon={Users}
        iconColor="text-purple-600"
        isLoading={isLoading}
        delta={stats?.customersGrowth}
        deltaLabel="from last month"
      />
      <StatCard
        title="Avg Booking Value"
        value={stats?.avgBookingValue ? formatCurrency(stats.avgBookingValue) : 'R0.00'}
        icon={TrendingUp}
        iconColor="text-orange-600"
        isLoading={isLoading}
        delta={stats?.avgValueGrowth}
        deltaLabel="from last month"
      />
    </div>
  );
}
