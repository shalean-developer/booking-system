'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar, FilterConfig } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Edit, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  published_at?: string;
  meta_description?: string | null;
  keywords?: string | null;
  featured_image?: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800 border-gray-200',
  published: 'bg-green-100 text-green-800 border-green-200',
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState<string | null>(null);
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
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `API returned ${response.status}`);
      }

      if (data.ok) {
        setPosts(data.posts || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        setPosts([]);
        setTotal(0);
        setTotalPages(1);
        toast.error(data.error || 'Failed to load blog posts');
      }
    } catch (error: any) {
      setPosts([]);
      setTotal(0);
      setTotalPages(1);
      toast.error(error.message || 'Failed to load blog posts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('Delete this blog post permanently?');
    if (!confirmed) return;

    setIsMutating(id);
    try {
      const response = await fetch('/api/admin/blog/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Delete failed (${response.status})`);
      }
      toast.success('Post deleted');
      await fetchPosts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post');
    } finally {
      setIsMutating(null);
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    setIsMutating(post.id);
    try {
      const response = await fetch('/api/admin/blog/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: post.id,
          title: post.title,
          slug: post.slug,
          content: post.content,
          meta_description: post.meta_description,
          keywords: post.keywords,
          featured_image: post.featured_image,
          status: post.status === 'published' ? 'draft' : 'published',
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || `Update failed (${response.status})`);
      }
      toast.success(post.status === 'published' ? 'Post unpublished' : 'Post published');
      await fetchPosts();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update post');
    } finally {
      setIsMutating(null);
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
      id: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge variant="outline" className={statusColors[row.status] || statusColors.draft}>
          {row.status}
        </Badge>
      ),
    },
    {
      id: 'created',
      header: 'Created',
      accessor: (row) => (
        <span className="text-sm text-gray-600">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={row.status === 'published' ? 'secondary' : 'default'}
            disabled={isMutating === row.id}
            onClick={() => handleTogglePublish(row)}
          >
            {row.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-gray-100" 
            asChild
            title="Edit post"
          >
            <Link href={`/admin/blog/${row.id}`} aria-label="Edit blog post">
              <Edit className="h-4 w-4 text-gray-600 hover:text-gray-900" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-gray-100"
            onClick={() => handleDelete(row.id)}
            disabled={isMutating === row.id}
            title="Delete post"
          >
            <Trash2 className="h-4 w-4 text-red-600 hover:text-red-700" />
          </Button>
          {row.status === 'published' && row.slug && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 hover:bg-gray-100" 
              asChild
              title="View post"
            >
              <a 
                href={`/blog/${row.slug}`} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="View published blog post"
              >
                <Eye className="h-4 w-4 text-gray-600 hover:text-gray-900" />
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
        searchPlaceholder="Search by title..."
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
        <LoadingState rows={5} columns={4} variant="table" />
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

