'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar, FilterConfig } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface BlogPost {
  id: string;
  title: string;
  author: string;
  status: string;
  published_at?: string;
  views: number;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  published: 'bg-green-100 text-green-800 border-green-200',
  archived: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, debouncedSearch, statusFilter]);

  const fetchPosts = async () => {
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

      const url = `/api/admin/blog?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setPosts(data.posts || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching blog posts:', error);
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

  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ];

  const columns: Column<BlogPost>[] = [
    {
      id: 'title',
      header: 'Title',
      accessor: (row) => (
        <span className="font-medium text-gray-900">{row.title}</span>
      ),
    },
    {
      id: 'author',
      header: 'Author',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{row.author}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge variant="outline" className={statusColors[row.status] || statusColors.draft}>
          {row.status}
        </Badge>
      ),
    },
    {
      id: 'published',
      header: 'Published',
      accessor: (row) => (
        <span className="text-sm text-gray-600">
          {row.published_at ? formatDate(row.published_at) : 'Not published'}
        </span>
      ),
    },
    {
      id: 'views',
      header: 'Views',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">{row.views || 0}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/blog/${row.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          {row.status === 'published' && (
            <Button variant="ghost" size="sm" asChild>
              <a href={`/blog/${row.id}`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog Posts"
        description={`Manage blog content (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Blog' },
        ]}
        actions={
          <Button asChild>
            <Link href="/admin/blog/new">
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Link>
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search by title or author..."
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

      {isLoading ? (
        <LoadingState rows={5} columns={6} variant="table" />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No blog posts found"
          description="Create your first blog post to get started."
          action={{
            label: 'Create Post',
            onClick: () => (window.location.href = '/admin/blog/new'),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={posts}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No blog posts match your search criteria."
        />
      )}
    </div>
  );
}

