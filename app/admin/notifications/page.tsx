'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar, FilterConfig } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, readFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [currentPage, debouncedSearch, readFilter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });
      
      if (readFilter && readFilter !== 'all') {
        params.append('read', readFilter);
      }
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const url = `/api/admin/notifications?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
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

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/admin/notifications/mark-all-read', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'read',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Unread', value: 'false' },
        { label: 'Read', value: 'true' },
      ],
    },
  ];

  const columns: Column<Notification>[] = [
    {
      id: 'notification',
      header: 'Notification',
      accessor: (row) => (
        <div className={row.is_read ? '' : 'font-semibold'}>
          <div className="text-gray-900">{row.title}</div>
          <div className="text-sm text-gray-600 mt-1">{row.message}</div>
        </div>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      accessor: (row) => (
        <Badge variant="outline" className="capitalize">
          {row.type}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge
          variant="outline"
          className={
            row.is_read
              ? 'bg-gray-50 text-gray-700 border-gray-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }
        >
          {row.is_read ? 'Read' : 'Unread'}
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
          {!row.is_read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleMarkAsRead(row.id)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`Manage system notifications (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Notifications' },
        ]}
        actions={
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search notifications..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filterConfigs}
        filterValues={{ read: readFilter }}
        onFilterChange={(key, value) => {
          if (key === 'read') {
            setReadFilter(value);
            setCurrentPage(1);
          }
        }}
        onClear={() => {
          setSearchQuery('');
          setReadFilter('');
          setCurrentPage(1);
        }}
      />

      {isLoading ? (
        <LoadingState rows={5} columns={5} variant="table" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications found"
          description="System notifications will appear here."
        />
      ) : (
        <DataTable
          columns={columns}
          data={notifications}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No notifications match your search criteria."
        />
      )}
    </div>
  );
}

