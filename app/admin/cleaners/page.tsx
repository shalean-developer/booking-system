'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar } from '@/components/admin/shared/filter-bar';
import { DataTable, Column } from '@/components/admin/shared/data-table';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { LoadingState } from '@/components/admin/shared/loading-state';
import { StatCard } from '@/components/admin/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Users, Eye, TrendingUp, MoreVertical, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

interface Cleaner {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  is_active: boolean;
  total_bookings?: number;
  completed_bookings?: number;
  average_rating?: number;
  total_revenue?: number;
}

export default function AdminCleanersPage() {
  const router = useRouter();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const debouncedSearch = useDebouncedValue(searchQuery, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    areas: [] as string[],
    bio: '',
    years_experience: '',
    specialties: [] as string[],
    password: '',
    auth_provider: 'both' as 'password' | 'otp' | 'both',
    is_active: true,
    is_available: true,
    photo_url: '',
  });
  const pageSize = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchCleaners();
    fetchStats();
  }, [currentPage, debouncedSearch, statusFilter]);

  const fetchCleaners = async () => {
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

      if (statusFilter === 'active') {
        params.append('active', 'true');
      } else if (statusFilter === 'inactive') {
        params.append('active', 'false');
      }

      const url = `/api/admin/cleaners?${params.toString()}`;
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (data.ok) {
        setCleaners(data.cleaners || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching cleaners:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/cleaners/stats', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching cleaner stats:', error);
    }
  };

  const handleAddCleaner = async () => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        setFormError('Name is required');
        setIsSubmitting(false);
        return;
      }

      if (!formData.phone.trim()) {
        setFormError('Phone number is required');
        setIsSubmitting(false);
        return;
      }

      if (formData.areas.length === 0) {
        setFormError('At least one service area is required');
        setIsSubmitting(false);
        return;
      }

      if ((formData.auth_provider === 'password' || formData.auth_provider === 'both') && !formData.password) {
        setFormError('Password is required when password authentication is enabled');
        setIsSubmitting(false);
        return;
      }

      const response = await fetch('/api/admin/cleaners', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          areas: formData.areas,
          bio: formData.bio.trim() || undefined,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : undefined,
          specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
          password: formData.password || undefined,
          auth_provider: formData.auth_provider,
          is_active: formData.is_active,
          is_available: formData.is_available,
          photo_url: formData.photo_url.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create cleaner');
      }

      // Reset form and close dialog
      setFormData({
        name: '',
        phone: '',
        email: '',
        areas: [],
        bio: '',
        years_experience: '',
        specialties: [],
        password: '',
        auth_provider: 'both',
        is_active: true,
        is_available: true,
        photo_url: '',
      });
      setIsAddDialogOpen(false);
      setFormError(null);

      // Refresh the cleaners list
      fetchCleaners();
      fetchStats();
    } catch (error: any) {
      console.error('Error creating cleaner:', error);
      setFormError(error.message || 'Failed to create cleaner. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleArea = (area: string) => {
    setFormData((prev) => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter((a) => a !== area)
        : [...prev.areas, area],
    }));
  };

  const formatCurrency = (cents: number) => {
    return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getCleanerName = (cleaner: Cleaner) => {
    if (cleaner.name) return cleaner.name;
    const firstName = cleaner.first_name || '';
    const lastName = cleaner.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Cleaner';
  };

  const columns: Column<Cleaner>[] = [
    {
      id: 'cleaner',
      header: 'Cleaner',
      accessor: (row) => (
        <div>
          <div className="font-medium text-gray-900">{getCleanerName(row)}</div>
          <div className="text-sm text-gray-500">{row.email}</div>
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
      id: 'bookings',
      header: 'Total Bookings',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">{row.total_bookings || 0}</span>
      ),
    },
    {
      id: 'completed',
      header: 'Completed',
      accessor: (row) => (
        <span className="text-sm text-gray-600">{row.completed_bookings || 0}</span>
      ),
    },
    {
      id: 'rating',
      header: 'Rating',
      accessor: (row) => (
        <div className="flex items-center gap-1">
          <span className="font-semibold text-gray-900">
            {row.average_rating ? row.average_rating.toFixed(1) : 'N/A'}
          </span>
          {row.average_rating && (
            <span className="text-yellow-500">★</span>
                            )}
                          </div>
      ),
    },
    {
      id: 'revenue',
      header: 'Revenue',
      accessor: (row) => (
        <span className="font-semibold text-gray-900">
          {row.total_revenue ? formatCurrency(row.total_revenue) : 'R0.00'}
        </span>
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
            <DropdownMenuItem asChild>
              <Link href={`/admin/cleaners/${row.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/cleaners/performance?cleaner=${row.id}`}>
                <TrendingUp className="mr-2 h-4 w-4" />
                View Performance
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
        title="Cleaners"
        description={`Manage and view all cleaners (${total} total)`}
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'Cleaners' },
        ]}
        actions={
          <>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Cleaner
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/cleaners/performance">
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance Dashboard
              </Link>
            </Button>
          </>
        }
      />

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            title="Total Cleaners"
            value={stats.total || 0}
            icon={Users}
          />
          <StatCard
            title="Active Cleaners"
            value={stats.active || 0}
            icon={Users}
            iconColor="text-green-600"
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings || 0}
            icon={TrendingUp}
            iconColor="text-blue-600"
          />
          <StatCard
            title="Avg Rating"
            value={stats.averageRating ? stats.averageRating.toFixed(1) : 'N/A'}
            icon={TrendingUp}
            iconColor="text-yellow-600"
          />
                </div>
              )}

      <FilterBar
        searchPlaceholder="Search by name or email..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        filters={[
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'All Cleaners', value: 'all' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ],
          },
        ]}
        filterValues={{ status: statusFilter === 'all' ? '' : statusFilter }}
        onFilterChange={(key, value) => {
          if (key === 'status') {
            setStatusFilter(value === '' ? 'all' : (value as 'active' | 'inactive'));
            setCurrentPage(1);
          }
        }}
        onClear={() => {
          setSearchQuery('');
          setStatusFilter('all');
          setCurrentPage(1);
        }}
      />

      {isLoading ? (
        <LoadingState rows={5} columns={7} variant="table" />
      ) : cleaners.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No cleaners found"
          description="Cleaners will appear here once they are added to the system."
        />
      ) : (
        <DataTable
          columns={columns}
          data={cleaners}
          currentPage={currentPage}
          totalPages={totalPages}
          total={total}
          onPageChange={setCurrentPage}
          emptyMessage="No cleaners match your search criteria."
        />
      )}

      {/* Add New Cleaner Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Cleaner</DialogTitle>
            <DialogDescription>
              Create a new cleaner account. All required fields must be filled.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
              {formError}
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+27123456789 or 0123456789"
                  required
                />
                <p className="text-xs text-gray-500">Will be normalized to +27 format</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cleaner@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="areas">
                Service Areas <span className="text-red-500">*</span>
              </Label>
              <Input
                id="areas"
                value={formData.areas.join(', ')}
                onChange={(e) => {
                  const areas = e.target.value
                    .split(',')
                    .map((a) => a.trim())
                    .filter((a) => a.length > 0);
                  setFormData({ ...formData, areas });
                }}
                placeholder="Cape Town, Sea Point, Green Point"
                required
              />
              <p className="text-xs text-gray-500">
                Enter areas separated by commas. At least one area is required.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  required={formData.auth_provider === 'password' || formData.auth_provider === 'both'}
                />
                <p className="text-xs text-gray-500">
                  Required if password authentication is enabled
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auth_provider">Authentication Method</Label>
                <Select
                  value={formData.auth_provider}
                  onValueChange={(value: 'password' | 'otp' | 'both') =>
                    setFormData({ ...formData, auth_provider: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">Password Only</SelectItem>
                    <SelectItem value="otp">OTP Only</SelectItem>
                    <SelectItem value="both">Both Methods</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Brief description of the cleaner..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="years_experience">Years of Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  min="0"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                  placeholder="5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="photo_url">Photo URL</Label>
                <Input
                  id="photo_url"
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialties">Specialties</Label>
              <Input
                id="specialties"
                value={formData.specialties.join(', ')}
                onChange={(e) => {
                  const specialties = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                  setFormData({ ...formData, specialties });
                }}
                placeholder="Deep Cleaning, Move In/Out, Office Cleaning"
              />
              <p className="text-xs text-gray-500">Separate multiple specialties with commas</p>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active" className="font-normal cursor-pointer">
                  Active
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_available"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_available" className="font-normal cursor-pointer">
                  Available
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setFormError(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleAddCleaner} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Cleaner
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
