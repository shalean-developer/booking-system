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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TrendingUp, Star, DollarSign, Calendar, X } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchPerformance();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanerId, dateRange.start, dateRange.end]);

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
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        // Check if response is HTML (error page)
        if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
          throw new Error(`API route returned HTML instead of JSON. Status: ${response.status}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.ok) {
        setPerformance(data.performance || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch performance data');
        setPerformance([]);
      }
    } catch (error: any) {
      console.error('Error fetching performance data:', error);
      setError(error?.message || 'Failed to fetch performance data');
      setPerformance([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (cleanerId) {
        params.append('cleaner', cleanerId);
      }
      const url = `/api/admin/cleaners/performance/stats${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        // Check if response is HTML (error page)
        if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
          throw new Error(`API route returned HTML instead of JSON. Status: ${response.status}. The route may not exist or there's a server error.`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error: any) {
      console.error('Error fetching performance stats:', error);
      // Don't set error state for stats, just log it
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
      id: 'completionRate',
      header: 'Completion Rate',
      accessor: (row) => {
        const rate = row.total_bookings > 0 
          ? (row.completed_bookings / row.total_bookings) * 100 
          : 0;
        return (
          <Badge 
            variant="outline" 
            className={
              rate >= 90 
                ? 'bg-green-50 text-green-700 border-green-200'
                : rate >= 70
                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }
          >
            {rate.toFixed(1)}%
          </Badge>
        );
      },
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Date Range Filter</h3>
          {(dateRange.start || dateRange.end) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange({ start: '', end: '' })}
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              max={dateRange.end || undefined}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              min={dateRange.start || undefined}
            />
          </div>
        </div>
        {cleanerId && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
            <p className="text-sm text-blue-700">
              Showing performance data for selected cleaner only.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-md">
          Error: {error}
        </div>
      )}

      {isLoading ? (
        <LoadingState rows={5} columns={6} variant="table" />
      ) : error ? (
        <EmptyState
          icon={TrendingUp}
          title="Error loading performance data"
          description={error}
        />
      ) : performance.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No performance data found"
          description={
            cleanerId
              ? "This cleaner has no bookings yet."
              : dateRange.start || dateRange.end
              ? "No performance data found for the selected date range."
              : "Performance metrics will appear here once cleaners complete bookings."
          }
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

