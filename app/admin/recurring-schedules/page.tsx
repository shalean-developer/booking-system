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
import { Repeat, Plus, Edit } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState<string>(customerFilter ? '' : 'active');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
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
      
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const url = `/api/admin/recurring-schedules?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setSchedules(data.schedules || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
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
      accessor: (row) => row.cleaner_name || <span className="text-gray-400">Unassigned</span>,
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
          setStatusFilter('active');
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
    </div>
  );
}

