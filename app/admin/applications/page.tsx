'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar, FilterConfig } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { BulkActions } from '@/components/admin/shared/bulk-actions';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Eye } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface Application {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedApplications, setSelectedApplications] = useState<Application[]>([]);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchApplications();
  }, [currentPage, debouncedSearch, statusFilter]);

  const fetchApplications = async () => {
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

      const url = `/api/admin/applications?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });

      // Check content type first
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response from applications API:', {
          status: response.status,
          contentType,
          preview: text.substring(0, 200),
        });
        throw new Error(`API returned ${response.status} but response was not JSON`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        setApplications(data.applications || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        console.error('API returned error:', data.error);
        setApplications([]);
        setTotal(0);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
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

  const handleBulkStatusUpdate = async (newStatus: string) => {
    try {
      const response = await fetch('/api/admin/applications/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: selectedApplications.map((a) => a.id),
          status: newStatus,
        }),
      });
      const data = await response.json();
      if (data.ok) {
        setSelectedApplications([]);
        fetchApplications();
      }
    } catch (error) {
      console.error('Error updating applications:', error);
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Reviewing', value: 'reviewing' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
  ];

  const columns: Column<Application>[] = [
    {
      id: 'name',
      header: 'Name',
      accessor: (row) => (
        <span className="font-medium text-gray-900">{row.name}</span>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{row.email}</span>
      ),
    },
    {
      id: 'phone',
      header: 'Phone',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{row.phone || 'N/A'}</span>
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
          <Button variant="ghost" size="sm" asChild>
            <a href={`/admin/applications/${row.id}`}>
              <Eye className="h-4 w-4" />
            </a>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description={`Manage cleaner applications (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Applications' },
        ]}
      />

      <FilterBar
        searchPlaceholder="Search by name or email..."
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

      {selectedApplications.length > 0 && (
        <BulkActions
          selectedCount={selectedApplications.length}
          onClear={() => setSelectedApplications([])}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate('reviewing')}
              >
                Mark as Reviewing
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate('approved')}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkStatusUpdate('rejected')}
              >
                Reject
              </Button>
            </>
          }
        />
      )}

          {isLoading ? (
        <LoadingState rows={5} columns={6} variant="table" />
          ) : applications.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No applications found"
          description="Cleaner applications will appear here once they are submitted."
        />
      ) : (
        <DataTable
          columns={columns}
          data={applications}
          enableSelection
          onSelectionChange={setSelectedApplications}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No applications match your search criteria."
        />
      )}
    </div>
  );
}
