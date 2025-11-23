'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/admin/shared/page-header';
import { StatCard } from '@/components/admin/shared/stat-card';
import { FilterBar } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Star, DollarSign, Calendar } from 'lucide-react';

interface CleanerPerformance {
  id: string;
  name: string;
  total_bookings: number;
  completed_bookings: number;
  average_rating: number;
  total_revenue: number;
  bookings_this_month: number;
}

export default function CleanerPerformancePage() {
  const searchParams = useSearchParams();
  const cleanerId = searchParams.get('cleaner');
  
  const [performance, setPerformance] = useState<CleanerPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchPerformance();
    fetchStats();
  }, [cleanerId, dateRange]);

  const fetchPerformance = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (cleanerId) {
        params.append('cleaner', cleanerId);
      }
      if (dateRange.start) {
        params.append('start', dateRange.start);
      }
      if (dateRange.end) {
        params.append('end', dateRange.end);
      }

      const url = `/api/admin/cleaners/performance?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setPerformance(data.performance || []);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/cleaners/performance/stats');
      const data = await response.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching performance stats:', error);
    }
  };

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const columns: Column<CleanerPerformance>[] = [
    {
      id: 'cleaner',
      header: 'Cleaner',
      accessor: (row) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      id: 'total',
      header: 'Total Bookings',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">{row.total_bookings}</span>
      ),
    },
    {
      id: 'completed',
      header: 'Completed',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{row.completed_bookings}</span>
      ),
    },
    {
      id: 'rating',
      header: 'Avg Rating',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <span className="font-semibold text-gray-900">
            {row.average_rating ? row.average_rating.toFixed(1) : 'N/A'}
          </span>
          {row.average_rating && (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          )}
        </div>
      ),
    },
    {
      id: 'revenue',
      header: 'Revenue',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">
          {row.total_revenue ? formatCurrency(row.total_revenue) : 'R0.00'}
        </span>
      ),
    },
    {
      id: 'thisMonth',
      header: 'This Month',
      accessor: (row) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {row.bookings_this_month || 0}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cleaner Performance"
        description="Track and analyze cleaner performance metrics"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Cleaners', href: '/admin/cleaners' },
          { label: 'Performance' },
        ]}
      />

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings || 0}
            icon={Calendar}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Avg Rating"
            value={stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
            icon={Star}
            iconColor="text-yellow-600"
          />
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue ? formatCurrency(stats.totalRevenue) : 'R0.00'}
            icon={DollarSign}
            iconColor="text-green-600"
          />
          <StatCard
            title="Completion Rate"
            value={stats.completionRate ? `${(stats.completionRate * 100).toFixed(1)}%` : '0%'}
            icon={TrendingUp}
            iconColor="text-purple-600"
          />
        </div>
      )}

      <div className="bg-white border rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState rows={5} columns={6} variant="table" />
      ) : performance.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No performance data found"
          description="Performance metrics will appear here once cleaners complete bookings."
        />
      ) : (
        <DataTable
          columns={columns}
          data={performance}
          emptyMessage="No performance data available."
        />
      )}
    </div>
  );
}

