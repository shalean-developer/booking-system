'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar, FilterConfig } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Star, Check, X } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface Review {
  id: string;
  booking_id: string;
  customer_name: string;
  cleaner_name?: string;
  rating: number;
  comment?: string;
  is_approved: boolean;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [currentPage, debouncedSearch, ratingFilter]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });
      
      if (ratingFilter && ratingFilter !== 'all') {
        params.append('rating', ratingFilter);
      }
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const url = `/api/admin/reviews?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setReviews(data.reviews || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
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

  const handleApprove = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/approve`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error approving review:', error);
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/reject`, {
        method: 'POST',
      });
      const data = await response.json();
      if (data.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  };

  const filterConfigs: FilterConfig[] = [
    {
      key: 'rating',
      label: 'Rating',
      type: 'select',
      options: [
        { label: '5 Stars', value: '5' },
        { label: '4 Stars', value: '4' },
        { label: '3 Stars', value: '3' },
        { label: '2 Stars', value: '2' },
        { label: '1 Star', value: '1' },
      ],
    },
  ];

  const columns: Column<Review>[] = [
    {
      id: 'rating',
      header: 'Rating',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <span className="font-semibold text-gray-900">{row.rating}</span>
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        </div>
      ),
    },
    {
      id: 'customer',
      header: 'Customer',
      accessor: (row) => (
        <span className="font-medium text-gray-900">{row.customer_name}</span>
      ),
    },
    {
      id: 'cleaner',
      header: 'Cleaner',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{row.cleaner_name || 'N/A'}</span>
      ),
    },
    {
      id: 'comment',
      header: 'Comment',
      accessor: (row) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-600 line-clamp-2">{row.comment || 'No comment'}</p>
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
            row.is_approved
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-yellow-50 text-yellow-700 border-yellow-200'
          }
        >
          {row.is_approved ? 'Approved' : 'Pending'}
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
          {!row.is_approved && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleApprove(row.id)}
                className="text-green-600 hover:text-green-700"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleReject(row.id)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews"
        description={`Manage and moderate customer reviews (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Reviews' },
        ]}
      />

      <FilterBar
        searchPlaceholder="Search by customer or cleaner name..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filterConfigs}
        filterValues={{ rating: ratingFilter }}
        onFilterChange={(key, value) => {
          if (key === 'rating') {
            setRatingFilter(value);
            setCurrentPage(1);
          }
        }}
        onClear={() => {
          setSearchQuery('');
          setRatingFilter('');
          setCurrentPage(1);
        }}
      />

          {isLoading ? (
        <LoadingState rows={5} columns={7} variant="table" />
          ) : reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews found"
          description="Customer reviews will appear here once they are submitted."
        />
      ) : (
        <DataTable
          columns={columns}
          data={reviews}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No reviews match your search criteria."
        />
      )}
    </div>
  );
}
