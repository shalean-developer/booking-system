'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar, FilterConfig } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Repeat, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface RecurringSchedule {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  service_type: string;
  frequency: string;
  day_of_week?: number;
  day_of_month?: number;
  days_of_week?: number[];
  preferred_time: string;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  address_line1: string;
  address_suburb: string;
  address_city: string;
  cleaner_id?: string;
  cleaner_name?: string;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  last_generated_month?: string;
  created_at: string;
}

const frequencyLabels: Record<string, string> = {
  weekly: 'Weekly',
  'bi-weekly': 'Bi-weekly',
  monthly: 'Monthly',
  'custom-weekly': 'Custom Weekly',
  'custom-bi-weekly': 'Custom Bi-weekly',
};

const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function RecurringSchedulesPage() {
  const searchParams = useSearchParams();
  const customerFilter = searchParams.get('customer');
  
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>(customerFilter ? '' : 'all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<RecurringSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const pageSize = 20;

  useEffect(() => {
    fetchSchedules();
  }, [currentPage, statusFilter, customerFilter]);

  const fetchSchedules = async () => {
    try {
      setIsLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });
      
      if (customerFilter) {
        params.append('customer', customerFilter);
      }
      
      // Only append status filter if it's not 'all'
      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const url = `/api/admin/recurring-schedules?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.ok) {
        // Debug: log cleaner names in response
        if (process.env.NODE_ENV === 'development') {
          console.log('[Recurring Schedules Page] Received schedules:', data.schedules?.map((s: any) => ({
            id: s.id,
            customer_name: s.customer_name,
            cleaner_id: s.cleaner_id,
            cleaner_name: s.cleaner_name,
          })));
        }
        setSchedules(data.schedules || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Error fetching recurring schedules:', error);
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

  const getScheduleDescription = (schedule: RecurringSchedule) => {
    if (schedule.frequency === 'weekly' || schedule.frequency === 'bi-weekly') {
      if (schedule.day_of_week !== null && schedule.day_of_week !== undefined) {
        return `Every ${schedule.frequency === 'bi-weekly' ? 'other ' : ''}${dayLabels[schedule.day_of_week]}`;
      }
      if (schedule.days_of_week && schedule.days_of_week.length > 0) {
        const days = schedule.days_of_week.map((d) => dayLabels[d]).join(', ');
        return `Every ${schedule.frequency === 'bi-weekly' ? 'other ' : ''}week: ${days}`;
      }
    }
    if (schedule.frequency === 'monthly' && schedule.day_of_month) {
      return `Day ${schedule.day_of_month} of each month`;
    }
    return frequencyLabels[schedule.frequency] || schedule.frequency;
  };

  const handleDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/recurring-schedules/${scheduleToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to delete recurring schedule');
      }

      // Close dialog and refresh list
      setIsDeleteDialogOpen(false);
      setScheduleToDelete(null);
      fetchSchedules();
    } catch (error: any) {
      console.error('Error deleting recurring schedule:', error);
      alert(error.message || 'Failed to delete recurring schedule. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: 'all' },
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  const columns: Column<RecurringSchedule>[] = [
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
        <div>
          <div className="font-medium text-gray-900">{row.service_type}</div>
          <div className="text-sm text-gray-500">
            {row.bedrooms} bed, {row.bathrooms} bath
          </div>
        </div>
      ),
    },
    {
      id: 'schedule',
      header: 'Schedule',
      accessor: (row) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {getScheduleDescription(row)}
          </div>
          <div className="text-sm text-gray-500">at {row.preferred_time}</div>
        </div>
      ),
    },
    {
      id: 'cleaner',
      header: 'Cleaner',
      accessor: (row) => (
        <div>
          {row.cleaner_name ? (
            <span className="font-medium text-gray-900">{row.cleaner_name}</span>
          ) : (
            <span className="text-gray-400 italic">Unassigned</span>
          )}
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
      id: 'startDate',
      header: 'Start Date',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{formatDate(row.start_date)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/recurring-schedules/${row.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setScheduleToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring Schedules"
        description={`Manage recurring booking schedules (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Recurring Schedules' },
        ]}
        actions={
          <Button asChild>
            <Link href="/admin/recurring-schedules/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Link>
          </Button>
        }
      />

      <FilterBar
        filters={filterConfigs}
        filterValues={{ status: statusFilter }}
        onFilterChange={(key, value) => {
          if (key === 'status') {
            setStatusFilter(value);
            setCurrentPage(1);
          }
        }}
        onClear={() => {
          setStatusFilter('all');
          setCurrentPage(1);
        }}
      />

      {isLoading ? (
        <LoadingState rows={5} columns={7} variant="table" />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No recurring schedules found"
          description="Create a new recurring schedule to get started."
          action={{
            label: 'Create Schedule',
            onClick: () => (window.location.href = '/admin/recurring-schedules/new'),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={schedules}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No recurring schedules match your filters."
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this recurring schedule? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {scheduleToDelete && (
            <div className="mt-4 p-3 bg-muted rounded text-sm space-y-1">
              <p><strong>Customer:</strong> {scheduleToDelete.customer_name}</p>
              <p><strong>Service:</strong> {scheduleToDelete.service_type}</p>
              <p><strong>Frequency:</strong> {getScheduleDescription(scheduleToDelete)}</p>
              <p><strong>Address:</strong> {scheduleToDelete.address_line1}, {scheduleToDelete.address_suburb}</p>
            </div>
          )}
          <p className="mt-3 text-sm font-medium text-amber-600">
            Note: This will not delete any bookings that were already generated from this schedule.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setScheduleToDelete(null)} disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSchedule}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

