'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, Plus, Edit } from 'lucide-react';
import Link from 'next/link';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface PricingRule {
  id: string;
  service_id: string;
  service_name: string;
  multiplier: number;
  region?: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminPricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchRules();
  }, [currentPage, debouncedSearch]);

  const fetchRules = async () => {
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

      const url = `/api/admin/pricing?${params.toString()}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.ok) {
        setRules(data.rules || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column<PricingRule>[] = [
    {
      id: 'service',
      header: 'Service',
      accessor: (row) => (
        <span className="font-medium text-gray-900">{row.service_name}</span>
      ),
    },
    {
      id: 'multiplier',
      header: 'Multiplier',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">×{row.multiplier.toFixed(2)}</span>
      ),
    },
    {
      id: 'region',
      header: 'Region',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{row.region || 'All Regions'}</span>
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
      id: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/pricing/${row.id}`}>
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
        title="Pricing Rules"
        description={`Manage pricing multipliers and regional pricing (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Pricing' },
        ]}
        actions={
          <Button asChild>
            <Link href="/admin/pricing/new">
              <Plus className="h-4 w-4 mr-2" />
              New Rule
            </Link>
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search by service name..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onClear={() => {
          setSearchQuery('');
          setCurrentPage(1);
        }}
      />

      {isLoading ? (
        <LoadingState rows={5} columns={5} variant="table" />
      ) : rules.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No pricing rules found"
          description="Create pricing rules to customize service pricing."
          action={{
            label: 'Create Rule',
            onClick: () => (window.location.href = '/admin/pricing/new'),
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={rules}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No pricing rules match your search criteria."
        />
      )}
    </div>
  );
}

