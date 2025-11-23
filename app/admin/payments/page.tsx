'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar, FilterConfig } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { ExportButton } from '@/components/admin/shared/export-button';
import { StatCard } from '@/components/admin/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface Payment {
  id: string;
  booking_id: string;
  customer_name: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  transaction_id?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [currentPage, debouncedSearch, statusFilter]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });
      
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const url = `/api/admin/payments?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.ok) {
        setPayments(data.payments || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        console.error('API error:', data.error);
        setPayments([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setPayments([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/payments/stats');
      const data = await response.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['Date', 'Customer', 'Booking ID', 'Amount', 'Status', 'Method', 'Transaction ID'].join(','),
      ...payments.map((p) =>
        [
          formatDate(p.created_at),
          p.customer_name || 'Unknown',
          p.booking_id || 'N/A',
          formatCurrency(p.amount || 0),
          p.status || 'unknown',
          p.payment_method || 'unknown',
          p.transaction_id || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
  ];

  const columns: Column<Payment>[] = [
    {
      id: 'date',
      header: 'Date',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{formatDate(row.created_at)}</span>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <span className="font-medium text-gray-900">{row.customer_name}</span>
      ),
    },
    {
      id: 'booking',
      header: 'Booking ID',
      accessor: (row) => (
        <span className="text-sm text-gray-600 font-mono">
          {row.booking_id ? `${row.booking_id.slice(0, 8)}...` : 'N/A'}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">{formatCurrency(row.amount)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge variant="outline" className={statusColors[row.status] || statusColors.pending}>
          {row.status}
        </Badge>
      ),
    },
    {
      id: 'method',
      header: 'Payment Method',
      accessor: (row) => (
        <span className="text-sm text-gray-600 capitalize">{row.payment_method}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description={`Manage and view all payment transactions (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Payments' },
        ]}
        actions={<ExportButton onExport={handleExport} />}
      />

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue ? formatCurrency(stats.totalRevenue) : 'R0.00'}
            icon={DollarSign}
            iconColor="text-green-600"
          />
          <StatCard
            title="This Month"
            value={stats.monthRevenue ? formatCurrency(stats.monthRevenue) : 'R0.00'}
            icon={TrendingUp}
            iconColor="text-blue-600"
            delta={stats.monthGrowth}
            deltaLabel="from last month"
          />
          <StatCard
            title="Pending"
            value={stats.pendingCount || 0}
            icon={DollarSign}
            iconColor="text-yellow-600"
          />
          <StatCard
            title="Failed"
            value={stats.failedCount || 0}
            icon={TrendingDown}
            iconColor="text-red-600"
          />
        </div>
      )}

      <FilterBar
        searchPlaceholder="Search by customer name or booking ID..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filterConfigs}
        filterValues={{ status: statusFilter }}
        onFilterChange={(key, value) => {
          if (key === 'status') {
            setStatusFilter(value);
            setCurrentPage(1);
          }
        }}
        onClear={() => {
          setSearchQuery('');
          setStatusFilter('');
          setCurrentPage(1);
        }}
      />

      {isLoading ? (
        <LoadingState rows={5} columns={6} variant="table" />
      ) : payments.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="No payments found"
          description="Payment transactions will appear here once customers make payments."
        />
      ) : (
        <DataTable
          columns={columns}
          data={payments}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No payments match your search criteria."
        />
      )}
    </div>
  );
}
