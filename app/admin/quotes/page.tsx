'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar, FilterConfig } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { ExportButton } from '@/components/admin/shared/export-button';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface Quote {
  id: string;
  customer_name: string;
  customer_email: string;
  service_type: string;
  status: string;
  amount: number | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  contacted: 'bg-blue-100 text-blue-800 border-blue-200',
  converted: 'bg-green-100 text-green-800 border-green-200',
  declined: 'bg-red-100 text-red-800 border-red-200',
};

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchQuotes();
  }, [currentPage, debouncedSearch, statusFilter]);

  const fetchQuotes = async () => {
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

      const url = `/api/admin/quotes?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setQuotes(data.quotes || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (cents: number | null | undefined) => {
    if (cents == null || isNaN(cents) || cents === 0) {
      return 'R0.00';
    }
    return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['Customer', 'Email', 'Service', 'Amount', 'Status', 'Date'].join(','),
      ...quotes.map((q) =>
        [
          q.customer_name,
          q.customer_email,
          q.service_type,
          formatCurrency(q.amount),
          q.status,
          formatDate(q.created_at),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleConvertToBooking = async (quoteId: string) => {
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}/convert`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.ok) {
        fetchQuotes();
      }
    } catch (error) {
      console.error('Error converting quote:', error);
    }
  };

  const handleStatusUpdate = async (quoteId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await response.json();
      if (data.ok) {
        fetchQuotes();
      }
    } catch (error) {
      console.error('Error updating quote status:', error);
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Converted', value: 'converted' },
        { label: 'Declined', value: 'declined' },
      ],
    },
  ];

  const columns: Column<Quote>[] = [
    {
      id: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer_name}</div>
          <div className="text-sm text-gray-500">{row.customer_email}</div>
        </div>
      ),
    },
    {
      id: 'service',
      header: 'Service',
      accessor: (row) => (
        <span className="text-sm text-gray-900">{row.service_type}</span>
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
      id: 'date',
      header: 'Date',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{formatDate(row.created_at)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(row.id, 'contacted')}
              >
                Mark Contacted
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleConvertToBooking(row.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Convert
              </Button>
            </>
          )}
          {row.status === 'contacted' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => handleConvertToBooking(row.id)}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Convert
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description={`Manage and track customer quotes (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Quotes' },
        ]}
        actions={<ExportButton onExport={handleExport} />}
      />

      <FilterBar
        searchPlaceholder="Search by customer name or email..."
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
          ) : quotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No quotes found"
          description="Customer quotes will appear here once they are submitted."
        />
      ) : (
        <DataTable
          columns={columns}
          data={quotes}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No quotes match your search criteria."
        />
      )}
    </div>
  );
}
