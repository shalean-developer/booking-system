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
import { Users, Eye, Mail, Phone, MoreVertical, Calendar, Repeat, Edit } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  recurring_schedules_count?: number;
  has_recurring?: boolean;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [recurringFilter, setRecurringFilter] = useState<'all' | 'recurring' | 'non-recurring'>('all');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_suburb: '',
    address_city: '',
  });
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, recurringFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, debouncedSearch, recurringFilter]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      // Add recurring filter to API request
      if (recurringFilter && recurringFilter !== 'all') {
        params.append('recurring', recurringFilter);
      }

      const url = `/api/admin/customers?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Request failed (${response.status}): ${text || 'Unknown error'}`);
      }

      const data = await response.json();

      if (data.ok) {
        let customers = data.customers || [];
        
        // Sort: recurring customers first, then by name (for display purposes)
        customers.sort((a: Customer, b: Customer) => {
          if (a.has_recurring && !b.has_recurring) return -1;
          if (!a.has_recurring && b.has_recurring) return 1;
          const nameA = getCustomerName(a).toLowerCase();
          const nameB = getCustomerName(b).toLowerCase();
          return nameA.localeCompare(nameB);
        });
        
        setCustomers(customers);
        // Use the total from API, not the filtered length
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error(data.error || 'Failed to fetch customers');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch customers';
      console.error('Error fetching customers:', error);
      setFetchError(message);
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

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setEditFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address_line1: (customer as any).address_line1 || '',
      address_suburb: (customer as any).address_suburb || '',
      address_city: (customer as any).address_city || '',
    });
    setEditError(null);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCustomer) return;

    setIsSaving(true);
    setEditError(null);

    try {
      // Validate required fields
      if (!editFormData.first_name.trim()) {
        setEditError('First name is required');
        setIsSaving(false);
        return;
      }

      if (!editFormData.last_name.trim()) {
        setEditError('Last name is required');
        setIsSaving(false);
        return;
      }

      if (!editFormData.email.trim() || !editFormData.email.includes('@')) {
        setEditError('Valid email is required');
        setIsSaving(false);
        return;
      }

      const response = await fetch(`/api/admin/customers/${editingCustomer.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }

      // Close dialog and refresh list
      setIsEditDialogOpen(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      console.error('Error updating customer:', error);
      setEditError(error.message || 'Failed to update customer. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<Customer>[] = [
    {
      id: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900 flex items-center gap-2">
            {getCustomerName(row)}
            {row.has_recurring && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                <Repeat className="h-3 w-3 mr-1" />
                {row.recurring_schedules_count || 0} recurring
              </Badge>
            )}
          </div>
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
            <DropdownMenuItem
              onClick={() => handleEditClick(row)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Customer
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
        filters={[
          {
            key: 'recurring',
            label: 'Recurring',
            type: 'select',
            options: [
              { label: 'All Customers', value: 'all' },
              { label: 'With Recurring', value: 'recurring' },
              { label: 'Without Recurring', value: 'non-recurring' },
            ],
          },
        ]}
        filterValues={{ recurring: recurringFilter === 'all' ? '' : recurringFilter }}
        onFilterChange={(key, value) => {
          if (key === 'recurring') {
            setRecurringFilter(value === '' ? 'all' : (value as 'recurring' | 'non-recurring'));
            setCurrentPage(1);
          }
        }}
        onClear={() => {
          setSearchQuery('');
          setRecurringFilter('all');
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

      {fetchError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          {fetchError}
        </div>
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
                  <label className="text-sm font-medium text-gray-500">Recurring Schedules</label>
                  <p className="text-sm text-gray-900 font-semibold flex items-center gap-2">
                    {selectedCustomer.has_recurring ? (
                      <>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          <Repeat className="h-3 w-3 mr-1" />
                          {selectedCustomer.recurring_schedules_count || 0} active
                        </Badge>
                        <Link href={`/admin/recurring-schedules?customer=${selectedCustomer.id}`} className="text-xs text-primary hover:underline">
                          View schedules
                        </Link>
                      </>
                    ) : (
                      <span className="text-gray-400">None</span>
                    )}
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

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer information. All required fields must be filled.
            </DialogDescription>
          </DialogHeader>

          {editError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              {editError}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-first_name">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-first_name"
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                  placeholder="John"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-last_name">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-last_name"
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="customer@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="+27123456789"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address_line1">Address Line 1</Label>
              <Input
                id="edit-address_line1"
                value={editFormData.address_line1}
                onChange={(e) => setEditFormData({ ...editFormData, address_line1: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-address_suburb">Suburb</Label>
                <Input
                  id="edit-address_suburb"
                  value={editFormData.address_suburb}
                  onChange={(e) => setEditFormData({ ...editFormData, address_suburb: e.target.value })}
                  placeholder="Sea Point"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address_city">City</Label>
                <Input
                  id="edit-address_city"
                  value={editFormData.address_city}
                  onChange={(e) => setEditFormData({ ...editFormData, address_city: e.target.value })}
                  placeholder="Cape Town"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingCustomer(null);
                setEditError(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
