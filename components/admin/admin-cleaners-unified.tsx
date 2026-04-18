'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Star,
  Mail,
  Phone,
  Calendar,
  Edit3,
  ToggleLeft,
  ToggleRight,
  MoreVertical,
  Loader2,
  KeyRound,
  Users,
  TrendingUp,
  Eye,
  UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { PageHeader } from '@/components/admin/shared/page-header';
import { FilterBar } from '@/components/admin/shared/filter-bar';
import { EmptyState } from '@/components/admin/shared/empty-state';
import { StatCard } from '@/components/admin/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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

const CARD_COLORS = ['#4F46E5', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2'];

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

export interface AdminCleanerRow {
  id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  auth_provider?: string;
  is_active: boolean;
  is_available?: boolean;
  areas?: string[];
  total_bookings?: number;
  completed_bookings?: number;
  average_rating?: number | null;
  total_revenue?: number;
  rating?: number;
  created_at?: string;
}

function formatCurrencyCents(cents: number) {
  return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function authProviderLabel(p?: string) {
  if (p === 'password') return 'Password';
  if (p === 'otp') return 'OTP';
  if (p === 'both') return 'Password + OTP';
  return '—';
}

function loginHint(p?: string) {
  if (p === 'password') return 'Phone + password';
  if (p === 'otp') return 'Phone + OTP';
  if (p === 'both') return 'Phone + password or OTP';
  return 'Phone login';
}

function getCleanerName(c: AdminCleanerRow) {
  if (c.name) return c.name;
  const first = c.first_name || '';
  const last = c.last_name || '';
  return `${first} ${last}`.trim() || 'Unknown';
}

export type AdminCleanersVariant = 'embedded' | 'full';

export function AdminCleanersUnified({ variant = 'full' }: { variant?: AdminCleanersVariant }) {
  const router = useRouter();
  const [cleaners, setCleaners] = useState<AdminCleanerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const debouncedSearch = useDebouncedValue(searchQuery, 400);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{
    total?: number;
    active?: number;
    totalBookings?: number;
    averageRating?: number;
  } | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetCleaner, setResetCleaner] = useState<AdminCleanerRow | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editCleanerId, setEditCleanerId] = useState<string | null>(null);
  const [editCleaner, setEditCleaner] = useState({ name: '', email: '', phone: '', areasStr: '' });
  const [editSaving, setEditSaving] = useState(false);

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

  const pageSize = variant === 'embedded' ? 12 : 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter]);

  const fetchCleaners = useCallback(async () => {
    try {
      setIsLoading(true);
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter === 'active') params.append('active', 'true');
      else if (statusFilter === 'inactive') params.append('active', 'false');

      const response = await fetch(`/api/admin/cleaners?${params.toString()}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.ok) {
        setCleaners(data.cleaners || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, pageSize]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/cleaners/stats', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (data.ok) setStats(data.stats);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    void fetchCleaners();
  }, [fetchCleaners]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const handleAddCleaner = async () => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      if (!formData.name.trim()) {
        setFormError('Name is required');
        return;
      }
      if (!formData.phone.trim()) {
        setFormError('Phone number is required');
        return;
      }
      if (formData.areas.length === 0) {
        setFormError('At least one service area is required');
        return;
      }
      if ((formData.auth_provider === 'password' || formData.auth_provider === 'both') && !formData.password) {
        setFormError('Password is required when password authentication is enabled');
        return;
      }
      const response = await fetch('/api/admin/cleaners', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          areas: formData.areas,
          bio: formData.bio.trim() || undefined,
          years_experience: formData.years_experience ? parseInt(formData.years_experience, 10) : undefined,
          specialties: formData.specialties.length > 0 ? formData.specialties : undefined,
          password: formData.password || undefined,
          auth_provider: formData.auth_provider,
          is_active: formData.is_active,
          is_available: formData.is_available,
          photo_url: formData.photo_url.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to create cleaner');
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
      await fetchCleaners();
      await fetchStats();
    } catch (error: unknown) {
      setFormError(error instanceof Error ? error.message : 'Failed to create cleaner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDashboardPassword = async () => {
    if (!resetCleaner) return;
    setResetError(null);
    if (resetPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    if (resetPassword !== resetPasswordConfirm) {
      setResetError('Passwords do not match');
      return;
    }
    setResetSubmitting(true);
    try {
      const response = await fetch(`/api/admin/cleaners/${resetCleaner.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to reset password');
      setResetDialogOpen(false);
      setResetCleaner(null);
      setResetPassword('');
      setResetPasswordConfirm('');
      await fetchCleaners();
    } catch (e: unknown) {
      setResetError(e instanceof Error ? e.message : 'Failed to reset password');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleEditCleaner = async () => {
    if (!editCleanerId) return;
    const areas = editCleaner.areasStr
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean);
    if (!editCleaner.name.trim() || !editCleaner.phone.trim() || areas.length === 0) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/cleaners/${editCleanerId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCleaner.name.trim(),
          email: editCleaner.email.trim() || undefined,
          phone: editCleaner.phone,
          areas,
        }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to update cleaner');
      setShowEditForm(false);
      setEditCleanerId(null);
      await fetchCleaners();
    } catch (e) {
      console.error(e);
    } finally {
      setEditSaving(false);
    }
  };

  const patchAvailability = async (id: string, is_available: boolean) => {
    try {
      const res = await fetch(`/api/admin/cleaners/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to update');
      await fetchCleaners();
    } catch (e) {
      console.error(e);
    }
  };

  const deactivateCleaner = async (c: AdminCleanerRow) => {
    if (!window.confirm(`Deactivate ${getCleanerName(c)}? They will not be able to sign in until re-activated.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/cleaners/${c.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false }),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to deactivate');
      await fetchCleaners();
      await fetchStats();
    } catch (e) {
      console.error(e);
    }
  };

  const cardModels = useMemo(() => {
    return cleaners.map((c, i) => {
      const name = getCleanerName(c);
      const areas = c.areas ?? [];
      const rating =
        c.average_rating != null && !Number.isNaN(Number(c.average_rating))
          ? Number(c.average_rating)
          : c.rating != null
            ? Number(c.rating)
            : 0;
      return {
        row: c,
        name,
        email: String(c.email ?? ''),
        phone: String(c.phone ?? ''),
        initials: name
          .split(/\s+/)
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        color: CARD_COLORS[i % CARD_COLORS.length],
        totalBookings: c.total_bookings ?? 0,
        completed: c.completed_bookings ?? 0,
        revenueCents: c.total_revenue ?? 0,
        rating,
        suburb: areas[0] ?? '',
        available: !!c.is_available,
        active: !!c.is_active,
      };
    });
  }, [cleaners]);

  const headerActions = (
    <>
      <Button type="button" onClick={() => setIsAddDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        {variant === 'full' ? 'Add New Cleaner' : 'Add Cleaner'}
      </Button>
      {variant === 'full' && (
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/cleaners/performance">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance Dashboard
          </Link>
        </Button>
      )}
    </>
  );

  return (
    <div className={cn('space-y-6', variant === 'embedded' && 'space-y-4')}>
      {variant === 'full' ? (
        <PageHeader
          title="Cleaners"
          description={`Manage and view all cleaners (${total} total)`}
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Cleaners' },
          ]}
          actions={headerActions}
        />
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Cleaners</h2>
            <p className="text-sm text-gray-500">Manage your cleaning team ({total} total)</p>
          </div>
          <div className="flex flex-wrap gap-2">{headerActions}</div>
        </div>
      )}

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard title="Total Cleaners" value={stats.total ?? 0} icon={Users} />
          <StatCard title="Active Cleaners" value={stats.active ?? 0} icon={Users} iconColor="text-green-600" />
          <StatCard title="Total Bookings" value={stats.totalBookings ?? 0} icon={TrendingUp} iconColor="text-blue-600" />
          <StatCard
            title="Avg Rating"
            value={stats.averageRating != null ? stats.averageRating.toFixed(1) : 'N/A'}
            icon={TrendingUp}
            iconColor="text-yellow-600"
          />
        </div>
      )}

      {variant === 'full' ? (
        <FilterBar
          searchPlaceholder="Search by name, email, or phone..."
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
      ) : (
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-gray-100 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cleaners..."
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                aria-label="Search cleaners"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
                setCurrentPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : cleaners.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No cleaners found"
          description="Adjust filters or add a cleaner to get started."
        />
      ) : (
        <>
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cardModels.map((m) => (
              <motion.div
                key={m.row.id}
                variants={fadeUp}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{m.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1">
                        {m.rating > 0 ? (
                          <span className="text-[10px] font-bold text-amber-600">
                            <Star className="mb-0.5 mr-0.5 inline h-3 w-3 text-amber-500" aria-hidden />
                            {m.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">No ratings yet</span>
                        )}
                        {m.suburb ? (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="text-[10px] text-gray-500">{m.suburb}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-gray-500" aria-label="Actions">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem
                        onSelect={() => {
                          setEditCleanerId(m.row.id);
                          setEditCleaner({
                            name: m.name,
                            email: m.email,
                            phone: m.phone,
                            areasStr: (m.row.areas ?? []).join(', '),
                          });
                          setShowEditForm(true);
                        }}
                      >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit cleaner
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() =>
                          router.push(
                            `/admin/schedule?cleanerId=${encodeURIComponent(m.row.id)}&cleanerName=${encodeURIComponent(m.name)}`
                          )
                        }
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Schedule
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/cleaners/${m.row.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/cleaners/performance?cleaner=${m.row.id}`}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Performance
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          setResetCleaner(m.row);
                          setResetPassword('');
                          setResetPasswordConfirm('');
                          setResetError(null);
                          setResetDialogOpen(true);
                        }}
                      >
                        <KeyRound className="mr-2 h-4 w-4" />
                        Reset PIN
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        disabled={!m.active}
                        onSelect={() => void deactivateCleaner(m.row)}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate cleaner
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { label: 'Jobs', value: String(m.totalBookings) },
                    { label: 'Done', value: String(m.completed) },
                    {
                      label: 'Revenue',
                      value: m.revenueCents > 0 ? formatCurrencyCents(m.revenueCents) : '—',
                    },
                    { label: 'Rating', value: m.rating > 0 ? m.rating.toFixed(1) : '—' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-gray-50 p-2 text-center">
                      <p className="truncate text-xs font-extrabold text-gray-900">{stat.value}</p>
                      <p className="text-[9px] font-medium text-gray-400">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-3 space-y-1 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                    <span className="tabular-nums">{m.phone || '—'}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-600">Dashboard login:</span>{' '}
                    {authProviderLabel(m.row.auth_provider)}
                  </p>
                  <p className="text-[11px] text-gray-400">{loginHint(m.row.auth_provider)}</p>
                  {m.email ? (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{m.email}</span>
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      m.active ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-600'
                    )}
                  >
                    {m.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <button
                    type="button"
                    onClick={() => void patchAvailability(m.row.id, !m.available)}
                    className={cn(
                      'flex items-center gap-1 text-[10px] font-bold transition-colors',
                      m.available ? 'text-green-600' : 'text-gray-400'
                    )}
                  >
                    {m.available ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    <span>{m.available ? 'Available' : 'Busy'}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 text-sm text-gray-600">
              <p>
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add cleaner — full form from former table page */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Cleaner</DialogTitle>
            <DialogDescription>
              Create a cleaner profile and set how they sign in to the cleaner dashboard (phone + password and/or OTP).
            </DialogDescription>
          </DialogHeader>
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{formError}</div>
          )}
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ac_name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ac_name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ac_email">Email</Label>
                <Input
                  id="ac_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cleaner@example.com"
                />
              </div>
            </div>
            <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50/80 p-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Cleaner dashboard login</h3>
                <p className="mt-1 text-xs text-gray-600">
                  Cleaners sign in at <span className="font-mono text-gray-800">/cleaner/login</span> with this phone
                  number.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ac_phone">
                    Login phone <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ac_phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+27123456789"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sign-in methods</Label>
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
                      <SelectItem value="password">Password only</SelectItem>
                      <SelectItem value="otp">OTP only (SMS)</SelectItem>
                      <SelectItem value="both">Password and OTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ac_password">
                  Initial password{' '}
                  {(formData.auth_provider === 'password' || formData.auth_provider === 'both') && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Input
                  id="ac_password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={formData.auth_provider === 'otp' ? 'Not used for OTP-only' : 'Minimum 6 characters'}
                  disabled={formData.auth_provider === 'otp'}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac_areas">
                Service Areas <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ac_areas"
                value={formData.areas.join(', ')}
                onChange={(e) => {
                  const areas = e.target.value
                    .split(',')
                    .map((a) => a.trim())
                    .filter(Boolean);
                  setFormData({ ...formData, areas });
                }}
                placeholder="Cape Town, Sea Point"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac_bio">Bio</Label>
              <Textarea
                id="ac_bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ac_years">Years of Experience</Label>
                <Input
                  id="ac_years"
                  type="number"
                  min={0}
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ac_photo">Photo URL</Label>
                <Input
                  id="ac_photo"
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ac_spec">Specialties</Label>
              <Input
                id="ac_spec"
                value={formData.specialties.join(', ')}
                onChange={(e) => {
                  const specialties = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  setFormData({ ...formData, specialties });
                }}
              />
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Active
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_available}
                  onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Available
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleAddCleaner()} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
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

      {/* Edit */}
      <AnimatePresence>
        {showEditForm && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditForm(false)}
              className="fixed inset-0 bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h3 className="text-sm font-extrabold text-gray-900">Edit cleaner</h3>
              {(['name', 'email', 'phone'] as const).map((key) => (
                <div key={key}>
                  <Label className="text-xs font-bold text-gray-700">{key === 'name' ? 'Full name' : key}</Label>
                  <Input
                    className="mt-1"
                    value={editCleaner[key]}
                    onChange={(e) => setEditCleaner((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <Label className="text-xs font-bold text-gray-700">Service areas (comma-separated)</Label>
                <Input
                  className="mt-1"
                  value={editCleaner.areasStr}
                  onChange={(e) => setEditCleaner((prev) => ({ ...prev, areasStr: e.target.value }))}
                  placeholder="Cape Town, Sea Point"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowEditForm(false)}>
                  Cancel
                </Button>
                <Button type="button" className="flex-1" onClick={() => void handleEditCleaner()} disabled={editSaving}>
                  {editSaving ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset PIN */}
      <Dialog
        open={resetDialogOpen}
        onOpenChange={(open) => {
          setResetDialogOpen(open);
          if (!open) {
            setResetCleaner(null);
            setResetPassword('');
            setResetPasswordConfirm('');
            setResetError(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset dashboard password</DialogTitle>
            <DialogDescription>
              New password for{' '}
              <span className="font-medium text-gray-900">{resetCleaner ? getCleanerName(resetCleaner) : 'cleaner'}</span>
              {resetCleaner?.phone ? (
                <>
                  {' '}
                  (<span className="tabular-nums">{resetCleaner.phone}</span>)
                </>
              ) : null}
              . Used at <span className="font-mono text-xs">/cleaner/login</span> with their phone.
            </DialogDescription>
          </DialogHeader>
          {resetCleaner?.auth_provider === 'otp' && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              OTP-only today — adding a password enables <strong>Password + OTP</strong>.
            </p>
          )}
          {resetError && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{resetError}</div>}
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>New password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={resetPasswordConfirm}
                onChange={(e) => setResetPasswordConfirm(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)} disabled={resetSubmitting}>
              Cancel
            </Button>
            <Button onClick={() => void handleResetDashboardPassword()} disabled={resetSubmitting}>
              {resetSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Save password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
