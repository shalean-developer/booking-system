'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, Plus, Edit, Trash2 } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';

interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  valid_from: string;
  valid_until: string | null;
  usage_limit: number | null;
  usage_count: number;
  is_active: boolean;
  applicable_services: string[] | null;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

export default function AdminDiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pageSize = 20;

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_purchase_amount: '',
    max_discount_amount: '',
    valid_from: format(new Date(), 'yyyy-MM-dd'),
    valid_until: '',
    usage_limit: '',
    is_active: true,
    applicable_services: [] as string[],
    notes: '',
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCodes();
  }, [currentPage, debouncedSearch]);

  const fetchCodes = async () => {
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

      const response = await fetch(`/api/admin/discount-codes?${params.toString()}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
              errorMessage = 'API endpoint not found. Please check if the database migration has been run.';
            } else {
              errorMessage = text || errorMessage;
            }
          }
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
          throw new Error('API endpoint not found. Please check if the database migration has been run.');
        }
        throw new Error('Invalid response from server');
      }

      const data = await response.json();
      if (data.ok) {
        setCodes(data.codes || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching discount codes:', error);
      setCodes([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCode(null);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      min_purchase_amount: '',
      max_discount_amount: '',
      valid_from: format(new Date(), 'yyyy-MM-dd'),
      valid_until: '',
      usage_limit: '',
      is_active: true,
      applicable_services: [],
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (code: DiscountCode) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      description: code.description || '',
      discount_type: code.discount_type,
      discount_value: code.discount_value.toString(),
      min_purchase_amount: code.min_purchase_amount.toString(),
      max_discount_amount: code.max_discount_amount?.toString() || '',
      valid_from: code.valid_from,
      valid_until: code.valid_until || '',
      usage_limit: code.usage_limit?.toString() || '',
      is_active: code.is_active,
      applicable_services: code.applicable_services || [],
      notes: code.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount code?')) return;

    try {
      const response = await fetch(`/api/admin/discount-codes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          await fetchCodes();
        } else {
          alert(data.error || 'Failed to delete discount code');
        }
      } else {
        let errorMessage = 'Failed to delete discount code';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          }
        } catch {
          // Use default error message
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error deleting discount code:', error);
      alert('Error deleting discount code. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingCode
        ? `/api/admin/discount-codes/${editingCode.id}`
        : '/api/admin/discount-codes';
      const method = editingCode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discount_value: parseFloat(formData.discount_value),
          min_purchase_amount: parseFloat(formData.min_purchase_amount) || 0,
          max_discount_amount: formData.max_discount_amount ? parseFloat(formData.max_discount_amount) : null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
          applicable_services: formData.applicable_services.length > 0 ? formData.applicable_services : null,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setIsDialogOpen(false);
        await fetchCodes();
      } else {
        alert(data.error || 'Failed to save discount code');
      }
    } catch (error) {
      console.error('Error saving discount code:', error);
      alert('Error saving discount code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<DiscountCode>[] = [
    {
      id: 'code',
      header: 'Code',
      accessor: (row) => (
        <span className="font-mono font-semibold text-gray-900">{row.code}</span>
      ),
    },
    {
      id: 'discount',
      header: 'Discount',
      accessor: (row) => (
        <span className="text-gray-900">
          {row.discount_type === 'percentage'
            ? `${row.discount_value}%`
            : `R${row.discount_value.toFixed(2)}`}
        </span>
      ),
    },
    {
      id: 'validity',
      header: 'Validity',
      accessor: (row) => {
        const today = new Date();
        const validFrom = new Date(row.valid_from);
        const validUntil = row.valid_until ? new Date(row.valid_until) : null;

        let status = 'Active';
        let color = 'green';

        if (validFrom > today) {
          status = 'Not Started';
          color = 'gray';
        } else if (validUntil && validUntil < today) {
          status = 'Expired';
          color = 'red';
        }

        return (
          <div className="flex flex-col">
            <span className="text-sm text-gray-600">
              {format(validFrom, 'MMM dd, yyyy')} -{' '}
              {validUntil ? format(validUntil, 'MMM dd, yyyy') : 'No expiry'}
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${
                color === 'green'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : color === 'red'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}
            >
              {status}
            </Badge>
          </div>
        );
      },
    },
    {
      id: 'usage',
      header: 'Usage',
      accessor: (row) => (
        <span className="text-sm text-gray-600">
          {row.usage_count} / {row.usage_limit || '∞'}
        </span>
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
          <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Discount Codes"
        description={`Manage discount codes for customer bookings (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Discount Codes' },
        ]}
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Discount Code
          </Button>
        }
      />

      <FilterBar
        searchPlaceholder="Search by code or description..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onClear={() => {
          setSearchQuery('');
          setCurrentPage(1);
        }}
      />

      {isLoading ? (
        <LoadingState rows={5} columns={6} variant="table" />
      ) : codes.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No discount codes found"
          description="Create discount codes to offer promotions to customers."
          action={{
            label: 'Create Code',
            onClick: handleCreate,
          }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={codes}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No discount codes match your search criteria."
        />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
            </DialogTitle>
            <DialogDescription>
              {editingCode
                ? 'Update the discount code details below.'
                : 'Create a new discount code that customers can use when booking services.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="SAVE20"
                  required
                  disabled={!!editingCode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed') =>
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount_value">
                Discount Value * ({formData.discount_type === 'percentage' ? '%' : 'R'})
              </Label>
              <Input
                id="discount_value"
                type="number"
                step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                min="0"
                max={formData.discount_type === 'percentage' ? '100' : undefined}
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Summer sale discount"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_purchase_amount">Minimum Purchase (R)</Label>
                <Input
                  id="min_purchase_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_purchase_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, min_purchase_amount: e.target.value })
                  }
                />
              </div>
              {formData.discount_type === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="max_discount_amount">Max Discount (R)</Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_discount_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, max_discount_amount: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From *</Label>
                <Input
                  id="valid_from"
                  type="date"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="date"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Usage Limit</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  placeholder="Unlimited if empty"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="is_active">Status</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, is_active: value === 'active' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicable_services">Applicable Services</Label>
              <div className="flex flex-wrap gap-2">
                {['Standard', 'Deep', 'Move In/Out', 'Airbnb'].map((service) => (
                  <label key={service} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.applicable_services.includes(service)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            applicable_services: [...formData.applicable_services, service],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            applicable_services: formData.applicable_services.filter(
                              (s) => s !== service
                            ),
                          });
                        }
                      }}
                    />
                    <span className="text-sm">{service}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">
                Leave empty to apply to all services
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingCode ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

