'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar, FilterConfig } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { BulkActions } from '@/components/admin/shared/bulk-actions';
import { ExportButton } from '@/components/admin/shared/export-button';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_amount: number;
  cleaner_name?: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  declined: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedBookings, setSelectedBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, currentPage, debouncedSearch]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
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

      const url = `/api/admin/bookings?${params.toString()}`;
      console.log('Fetching bookings from:', url);
      const response = await fetch(url);
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error('Response is not JSON');
      }

      const data = await response.json();
      console.log('API response:', { ok: data.ok, bookingsCount: data.bookings?.length, total: data.total, error: data.error });

      if (data.ok) {
        setBookings(data.bookings || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setError(null);
      } else {
        const errorMsg = data.error || 'Failed to fetch bookings';
        console.error('API error:', errorMsg);
        setError(errorMsg);
        setBookings([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error fetching bookings:', error);
      setError(errorMessage);
      setBookings([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
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
    });
  };

  const handleExport = () => {
    const csvContent = [
      ['Customer', 'Email', 'Phone', 'Service', 'Date', 'Time', 'Status', 'Amount', 'Cleaner'].join(','),
      ...bookings.map((b) =>
        [
          b.customer_name,
          b.customer_email,
          b.customer_phone,
          b.service_type,
          formatDate(b.booking_date),
          b.booking_time,
          b.status,
          formatCurrency(b.total_amount),
          b.cleaner_name || '',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch('/api/admin/bookings/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingIds: selectedBookings.map((b) => b.id),
          status: newStatus,
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setSelectedBookings([]);
        fetchBookings();
      }
    } catch (error) {
      console.error('Error updating bookings:', error);
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Confirmed', value: 'confirmed' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'In Progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
  ];

  const columns: Column<Booking>[] = [
    {
      id: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer_name || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{row.customer_email}</div>
        </div>
      ),
    },
    {
      id: 'service',
      header: 'Service',
      accessor: 'service_type',
    },
    {
      id: 'date',
      header: 'Date & Time',
      accessor: (row) => (
        <div>
          <div>{formatDate(row.booking_date)}</div>
          <div className="text-sm text-gray-500">{row.booking_time}</div>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge variant="outline" className={statusColors[row.status] || statusColors.declined}>
          {row.status}
        </Badge>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">{formatCurrency(row.total_amount)}</span>
      ),
    },
    {
      id: 'cleaner',
      header: 'Cleaner',
      accessor: (row) => row.cleaner_name || <span className="text-gray-400">Unassigned</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedBooking(row);
              setIsViewModalOpen(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/bookings/${row.id}`}>View</Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        description={`Manage and view all bookings (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Bookings' },
        ]}
        actions={
          <>
            <ExportButton onExport={handleExport} />
            <Button asChild>
              <Link href="/admin/bookings/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Booking
              </Link>
            </Button>
          </>
        }
      />

      <FilterBar
        searchPlaceholder="Search by customer name, email, phone, or service..."
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

      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading bookings</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchBookings()}
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedBookings.length > 0 && (
        <BulkActions
          selectedCount={selectedBookings.length}
          onClear={() => setSelectedBookings([])}
          actions={
            <>
                    <Button
                      variant="outline"
                      size="sm"
                onClick={() => handleBulkStatusUpdate('confirmed')}
                    >
                Mark as Confirmed
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                onClick={() => handleBulkStatusUpdate('completed')}
              >
                Mark as Completed
              </Button>
            </>
          }
        />
      )}

      {isLoading ? (
        <LoadingState rows={5} columns={7} variant="table" />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No bookings found"
          description="Get started by creating a new booking or check your filters."
          action={{
            label: 'Create Booking',
            onClick: () => (window.location.href = '/admin/bookings/new'),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={bookings}
          enableSelection
          onSelectionChange={setSelectedBookings}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No bookings match your search criteria."
        />
      )}

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>View booking information</DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="text-sm text-gray-900">{selectedBooking.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{selectedBooking.customer_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm text-gray-900">{selectedBooking.customer_phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Service</label>
                  <p className="text-sm text-gray-900">{selectedBooking.service_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedBooking.booking_date)} at {selectedBooking.booking_time}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge variant="outline" className={statusColors[selectedBooking.status]}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-sm text-gray-900 font-semibold">
                    {formatCurrency(selectedBooking.total_amount)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Cleaner</label>
                  <p className="text-sm text-gray-900">
                    {selectedBooking.cleaner_name || 'Unassigned'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/admin/bookings/${selectedBooking.id}`}>View Full Details</Link>
                    </Button>
                  </div>
                </div>
              )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
