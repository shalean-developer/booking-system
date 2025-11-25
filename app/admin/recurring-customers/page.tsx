'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Repeat, Mail, Phone, MoreVertical, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';

interface RecurringCustomer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  frequency: string;
  schedulesCount: number;
  totalBookings: number;
  startDate: string;
}

export default function RecurringCustomersPage() {
  const [customers, setCustomers] = useState<RecurringCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, searchQuery]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const offset = (currentPage - 1) * pageSize;
      const url = `/api/admin/recurring-customers?limit=${pageSize}&offset=${offset}&search=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorText = 'Failed to fetch recurring customers.';
        try {
          const errorData = await response.json();
          errorText = errorData.error || errorText;
        } catch {
          errorText = response.statusText || errorText;
        }
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.ok) {
        setCustomers(data.customers || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setError(data.error || 'Failed to fetch recurring customers.');
      }
    } catch (err: any) {
      console.error('Error fetching recurring customers:', err);
      setError(err.message || 'Failed to fetch recurring customers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const frequencyLabels: Record<string, string> = {
    weekly: 'Weekly',
    'bi-weekly': 'Bi-weekly',
    monthly: 'Monthly',
    'custom-weekly': 'Custom Weekly',
    'custom-bi-weekly': 'Custom Bi-weekly',
  };

  const columns: Column<RecurringCustomer>[] = [
    {
      id: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            {row.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {row.email}
              </span>
            )}
            {row.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {row.phone}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'frequency',
      header: 'Frequency',
      accessor: (row) => (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          {frequencyLabels[row.frequency] || row.frequency}
        </Badge>
      ),
    },
    {
      id: 'schedules',
      header: 'Schedules',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{row.schedulesCount} active</span>
      ),
    },
    {
      id: 'bookings',
      header: 'Total Bookings',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">{row.totalBookings}</span>
      ),
    },
    {
      id: 'startDate',
      header: 'Start Date',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{formatDate(row.startDate)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/bookings?customer=${row.id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                View Bookings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/recurring-schedules?customer=${row.id}`}>
                <Repeat className="mr-2 h-4 w-4" />
                View Recurring Schedules
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Customers"
        description={`Customers with active recurring schedules (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Recurring Customers' },
        ]}
      />

      <FilterBar
        searchPlaceholder="Search by name, email, or phone..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onClear={() => {
          setSearchQuery('');
          setCurrentPage(1);
        }}
      />

      {error && (
        <div className="p-4 text-red-600 bg-red-50 border border-red-200 rounded-md">
          Error: {error}
        </div>
      )}

      {isLoading ? (
        <LoadingState rows={5} columns={6} variant="table" />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring customers found"
          description="Customers with active recurring schedules will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No recurring customers match your search criteria."
        />
      )}
    </div>
  );
}

