'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BookingAssignment {
  id: string;
  booking_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  status: string;
  total_amount: number;
  cleaner_id: string | null;
  cleaner_name: string | null;
  requires_team: boolean;
  team_name: string | null;
  address_line1: string | null;
  address_suburb: string | null;
  address_city: string | null;
  created_at: string;
}

const serviceTypeColors: Record<string, string> = {
  'Deep': 'bg-purple-100 text-purple-800 border-purple-200',
  'Move In/Out': 'bg-blue-100 text-blue-800 border-blue-200',
  'Standard': 'bg-green-100 text-green-800 border-green-200',
  'Airbnb': 'bg-orange-100 text-orange-800 border-orange-200',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
  accepted: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'in-progress': 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  declined: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function BookingAssignmentsPage() {
  const [assignments, setAssignments] = useState<BookingAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all'); // all, assigned, unassigned
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pageSize = 50;

  useEffect(() => {
    setError(null); // Clear any previous errors when filters change
    fetchAssignments();
  }, [currentPage, serviceTypeFilter, statusFilter, assignmentFilter]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      
      // Fetch bookings in batches to avoid timeout
      // Use a reasonable limit and fetch multiple pages if needed
      const params = new URLSearchParams({
        limit: '500', // Reasonable batch size
        offset: '0',
      });
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      let response;
      try {
        response = await fetch(`/api/admin/bookings?${params.toString()}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out. Please try again or use filters to reduce the number of results.');
        }
        throw new Error(`Network error: ${fetchError.message || 'Failed to connect to server'}`);
      }
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch bookings');
      }

      if (data.ok && data.bookings) {
        // Filter by service types on client side
        let filtered = data.bookings.filter((booking: any) => {
          const serviceType = booking.service_type || '';
          return (
            serviceType === 'Deep' ||
            serviceType === 'Move In/Out' ||
            serviceType === 'Standard' ||
            serviceType === 'Airbnb'
          );
        });

        // Apply service type filter
        if (serviceTypeFilter !== 'all') {
          filtered = filtered.filter((booking: any) => 
            booking.service_type === serviceTypeFilter
          );
        }

        // Apply assignment filter
        if (assignmentFilter === 'assigned') {
          filtered = filtered.filter((booking: any) => 
            booking.cleaner_name || booking.team_name
          );
        } else if (assignmentFilter === 'unassigned') {
          filtered = filtered.filter((booking: any) => 
            !booking.cleaner_name && !booking.team_name
          );
        }

        // Sort by booking date (newest first)
        filtered.sort((a: any, b: any) => {
          const dateA = new Date(a.booking_date).getTime();
          const dateB = new Date(b.booking_date).getTime();
          return dateB - dateA;
        });

        // Transform to assignment format
        const transformed = filtered.map((booking: any) => ({
          id: booking.id,
          booking_id: booking.id,
          customer_name: booking.customer_name || 'Unknown',
          customer_email: booking.customer_email || '',
          customer_phone: booking.customer_phone || '',
          service_type: booking.service_type || 'Unknown',
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          status: booking.status,
          total_amount: booking.total_amount || 0,
          cleaner_id: booking.cleaner_id,
          cleaner_name: booking.cleaner_name,
          requires_team: booking.requires_team || false,
          team_name: booking.team_name,
          address_line1: booking.address_line1,
          address_suburb: booking.address_suburb,
          address_city: booking.address_city,
          created_at: booking.created_at,
        }));

        // Apply pagination
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginated = transformed.slice(startIndex, endIndex);

        setAssignments(paginated);
        setTotal(transformed.length);
        setTotalPages(Math.ceil(transformed.length / pageSize));
      }
    } catch (error: any) {
      console.error('Error fetching assignments:', error);
      // Set empty state on error
      setAssignments([]);
      setTotal(0);
      setTotalPages(1);
      setError(error.message || 'Failed to fetch bookings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-ZA', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const exportToCSV = () => {
    const headers = [
      'Booking ID',
      'Service Type',
      'Customer Name',
      'Customer Email',
      'Customer Phone',
      'Booking Date',
      'Booking Time',
      'Status',
      'Amount',
      'Cleaner Name',
      'Team Name',
      'Address',
      'City',
    ];

    const rows = assignments.map((assignment) => [
      assignment.booking_id,
      assignment.service_type,
      assignment.customer_name,
      assignment.customer_email,
      assignment.customer_phone,
      formatDate(assignment.booking_date),
      assignment.booking_time,
      assignment.status,
      formatCurrency(assignment.total_amount),
      assignment.cleaner_name || 'Unassigned',
      assignment.team_name || '',
      assignment.address_line1 || '',
      assignment.address_city || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `booking-assignments-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<BookingAssignment>[] = [
    {
      id: 'booking',
      header: 'Booking ID',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.booking_id}</div>
          <div className="text-xs text-gray-500">{formatDate(row.booking_date)}</div>
        </div>
      ),
    },
    {
      id: 'service',
      header: 'Service Type',
      accessor: (row) => (
        <Badge variant="outline" className={serviceTypeColors[row.service_type] || 'bg-gray-100 text-gray-800 border-gray-200'}>
          {row.service_type}
        </Badge>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.customer_name}</div>
          <div className="text-sm text-gray-500">{row.customer_email}</div>
          {row.customer_phone && (
            <div className="text-xs text-gray-400">{row.customer_phone}</div>
          )}
        </div>
      ),
    },
    {
      id: 'date_time',
      header: 'Date & Time',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900">{formatDate(row.booking_date)}</div>
          <div className="text-sm text-gray-500">{row.booking_time}</div>
        </div>
      ),
    },
    {
      id: 'cleaner',
      header: 'Assigned Cleaner',
      accessor: (row) => {
        if (row.requires_team && row.team_name) {
          return (
            <div>
              <div className="font-medium text-gray-900">{row.team_name}</div>
              {row.cleaner_name && (
                <div className="text-sm text-gray-500">Supervisor: {row.cleaner_name}</div>
              )}
            </div>
          );
        }
        return row.cleaner_name ? (
          <div className="font-medium text-gray-900">{row.cleaner_name}</div>
        ) : (
          <span className="text-gray-400 italic">Unassigned</span>
        );
      },
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
      id: 'address',
      header: 'Address',
      accessor: (row) => (
        <div className="text-sm">
          {row.address_line1 && (
            <div className="text-gray-900">{row.address_line1}</div>
          )}
          {row.address_suburb && (
            <div className="text-gray-600">{row.address_suburb}</div>
          )}
          {row.address_city && (
            <div className="text-gray-500">{row.address_city}</div>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/admin/bookings/${row.booking_id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
  ];

  // Calculate statistics
  const stats = {
    total: assignments.length,
    assigned: assignments.filter((a) => a.cleaner_name || a.team_name).length,
    unassigned: assignments.filter((a) => !a.cleaner_name && !a.team_name).length,
    byServiceType: {
      'Deep': assignments.filter((a) => a.service_type === 'Deep').length,
      'Move In/Out': assignments.filter((a) => a.service_type === 'Move In/Out').length,
      'Standard': assignments.filter((a) => a.service_type === 'Standard').length,
      'Airbnb': assignments.filter((a) => a.service_type === 'Airbnb').length,
    },
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking Assignments"
        description="View all cleaner assignments for Deep, Move In/Out, Standard, and Airbnb bookings"
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Bookings', href: '/admin/bookings' },
          { label: 'Assignments' },
        ]}
        actions={
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Total Bookings</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Assigned</div>
          <div className="text-2xl font-bold text-green-600">{stats.assigned}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Unassigned</div>
          <div className="text-2xl font-bold text-red-600">{stats.unassigned}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Deep</div>
          <div className="text-2xl font-bold">{stats.byServiceType['Deep']}</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-sm font-medium text-muted-foreground">Move In/Out</div>
          <div className="text-2xl font-bold">{stats.byServiceType['Move In/Out']}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Service Type</label>
          <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Service Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Service Types</SelectItem>
              <SelectItem value="Deep">Deep</SelectItem>
              <SelectItem value="Move In/Out">Move In/Out</SelectItem>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="Airbnb">Airbnb</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Assignment</label>
          <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="assigned">Assigned Only</SelectItem>
              <SelectItem value="unassigned">Unassigned Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setServiceTypeFilter('all');
            setStatusFilter('all');
            setAssignmentFilter('all');
            setCurrentPage(1);
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading assignments</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    fetchAssignments();
                  }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {!error && (
        <>
          {isLoading ? (
            <LoadingState rows={10} columns={9} variant="table" />
          ) : assignments.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No assignments found"
              description="No bookings match your filter criteria."
            />
          ) : (
            <DataTable
              columns={columns}
              data={assignments}
              currentPage={currentPage}
              totalPages={totalPages}
              total={total}
              onPageChange={setCurrentPage}
              emptyMessage="No assignments match your search criteria."
            />
          )}
        </>
      )}
    </div>
  );
}

