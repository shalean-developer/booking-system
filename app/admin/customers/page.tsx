'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { ExportButton } from '@/components/admin/shared/export-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Users, Eye, Mail, Phone, MoreVertical, Calendar } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface Customer {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  created_at: string;
  total_bookings?: number;
  total_spent?: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, debouncedSearch]);

  const fetchCustomers = async () => {
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

      const url = `/api/admin/customers?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data.ok) {
        setCustomers(data.customers || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
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

  const getCustomerName = (customer: Customer) => {
    if (customer.name) return customer.name;
    const firstName = customer.first_name || '';
    const lastName = customer.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Customer';
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Total Bookings', 'Total Spent', 'Joined'].join(','),
      ...customers.map((c) =>
        [
          getCustomerName(c),
          c.email,
          c.phone || '',
          c.total_bookings || 0,
          c.total_spent ? formatCurrency(c.total_spent) : 'R0.00',
          formatDate(c.created_at),
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const columns: Column<Customer>[] = [
    {
      id: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900">{getCustomerName(row)}</div>
          <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {row.email}
            </span>
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
      id: 'bookings',
      header: 'Bookings',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">{row.total_bookings || 0}</span>
      ),
    },
    {
      id: 'spent',
      header: 'Total Spent',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">
          {row.total_spent ? formatCurrency(row.total_spent) : 'R0.00'}
        </span>
      ),
    },
    {
      id: 'joined',
      header: 'Joined',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{formatDate(row.created_at)}</span>
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
            <DropdownMenuItem
              onClick={() => {
                setSelectedCustomer(row);
                setIsViewModalOpen(true);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/bookings?customer=${row.id}`}>
                <Calendar className="mr-2 h-4 w-4" />
                View Bookings
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
        title="Customers"
        description={`Manage and view all customers (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Customers' },
        ]}
        actions={<ExportButton onExport={handleExport} />}
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

      {isLoading ? (
        <LoadingState rows={5} columns={5} variant="table" />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description="Customers will appear here once they make bookings."
        />
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No customers match your search criteria."
        />
      )}

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>View customer information</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-sm text-gray-900">{getCustomerName(selectedCustomer)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-sm text-gray-900">{selectedCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Bookings</label>
                  <p className="text-sm text-gray-900 font-semibold">
                    {selectedCustomer.total_bookings || 0}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Spent</label>
                  <p className="text-sm text-gray-900 font-semibold">
                    {selectedCustomer.total_spent ? formatCurrency(selectedCustomer.total_spent) : 'R0.00'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Joined</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedCustomer.created_at)}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/admin/bookings?customer=${selectedCustomer.id}`}>
                    View Bookings
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
