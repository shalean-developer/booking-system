'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { StatCard } from '@/components/admin/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Eye, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface Cleaner {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  is_active: boolean;
  total_bookings?: number;
  completed_bookings?: number;
  average_rating?: number;
  total_revenue?: number;
}

export default function AdminCleanersPage() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCleaners();
    fetchStats();
  }, [currentPage, debouncedSearch]);

  const fetchCleaners = async () => {
    try {
      setIsLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const url = `/api/admin/cleaners?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setCleaners(data.cleaners || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/cleaners/stats');
      const data = await response.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching cleaner stats:', error);
    }
  };

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getCleanerName = (cleaner: Cleaner) => {
    if (cleaner.name) return cleaner.name;
    const firstName = cleaner.first_name || '';
    const lastName = cleaner.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Cleaner';
  };

  const columns: Column<Cleaner>[] = [
    {
      id: 'cleaner',
      header: 'Cleaner',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900">{getCleanerName(row)}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
                  </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => (
                            <Badge
                              variant="outline"
          className={
            row.is_active
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 text-gray-700 border-gray-200'
          }
                            >
          {row.is_active ? 'Active' : 'Inactive'}
                            </Badge>
      ),
    },
    {
      id: 'bookings',
      header: 'Total Bookings',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">{row.total_bookings || 0}</span>
      ),
    },
    {
      id: 'completed',
      header: 'Completed',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{row.completed_bookings || 0}</span>
      ),
    },
    {
      id: 'rating',
      header: 'Rating',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <span className="font-semibold text-gray-900">
            {row.average_rating ? row.average_rating.toFixed(1) : 'N/A'}
          </span>
          {row.average_rating && (
            <span className="text-yellow-500">★</span>
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
      id: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/cleaners/${row.id}`}>View</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/cleaners/performance?cleaner=${row.id}`}>
              Performance
                    </Link>
                    </Button>
                  </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cleaners"
        description={`Manage and view all cleaners (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Cleaners' },
        ]}
        actions={
          <Button asChild>
            <Link href="/admin/cleaners/performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance Dashboard
            </Link>
          </Button>
        }
      />

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Cleaners"
            value={stats.total || 0}
            icon={Users}
          />
          <StatCard
            title="Active Cleaners"
            value={stats.active || 0}
            icon={Users}
            iconColor="text-green-600"
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings || 0}
            icon={TrendingUp}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Avg Rating"
            value={stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
            icon={TrendingUp}
            iconColor="text-yellow-600"
          />
                </div>
              )}

      <FilterBar
        searchPlaceholder="Search by name or email..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onClear={() => {
          setSearchQuery('');
          setCurrentPage(1);
        }}
      />

      {isLoading ? (
        <LoadingState rows={5} columns={7} variant="table" />
      ) : cleaners.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No cleaners found"
          description="Cleaners will appear here once they are added to the system."
        />
      ) : (
        <DataTable
          columns={columns}
          data={cleaners}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No cleaners match your search criteria."
        />
      )}
    </div>
  );
}
