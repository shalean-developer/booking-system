'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  X,
  Star,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Send,
  DollarSign,
  Users,
  User,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Save,
  Bell,
  Globe,
  Key,
  Building,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { useAdminBookings } from '@/hooks/use-admin-bookings';
import { useAdminCleaners } from '@/hooks/use-admin-cleaners';
import { mapAdminBookingApiToRow } from '@/lib/admin-ui-mappers';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { fetcher } from '@/lib/swr-config';
import { getDateRange } from '@/lib/utils/formatting';
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import { formatCurrency } from '@/lib/utils/formatting';

// --- Types ---

type BookingStatus = 'pending' | 'paid' | 'confirmed' | 'completed' | 'cancelled';
type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
type QuoteStatus = 'draft' | 'pending' | 'sent' | 'accepted' | 'declined' | 'expired';
interface Booking {
  id: string;
  client: string;
  email: string;
  service: string;
  cleaner: string;
  cleanerId: string;
  date: string;
  time: string;
  amount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  address: string;
  suburb: string;
}

export type NewBookingRecord = Booking;

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  suburb: string;
  city: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string;
  status: 'active' | 'inactive';
  initials: string;
  color: string;
}
interface Cleaner {
  id: string;
  name: string;
  email: string;
  phone: string;
  initials: string;
  color: string;
  rating: number;
  jobs: number;
  revenue: number;
  available: boolean;
  status: 'active' | 'inactive' | 'pending';
  suburb: string;
  joinDate: string;
}
interface Quote {
  id: string;
  client: string;
  email: string;
  service: string;
  amount: number;
  status: QuoteStatus;
  createdDate: string;
  expiryDate: string;
  notes: string;
}
interface Payment {
  id: string;
  bookingId: string;
  client: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  paystackRef: string;
  date: string;
  service: string;
}


// --- Mock Data ---

const formatZAR = (n: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(n);
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 24 },
  },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

// --- Shared Components ---

const BookingStatusBadge = ({ status }: { status: BookingStatus }) => {
  const map: Record<BookingStatus, { label: string; cls: string }> = {
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    paid: { label: 'Paid', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    confirmed: { label: 'Confirmed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    completed: { label: 'Completed', cls: 'bg-green-50 text-green-700 border-green-200' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide',
        s.cls
      )}
    >
      {s.label}
    </span>
  );
};
const PayStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const map: Record<PaymentStatus, { label: string; cls: string }> = {
    paid: { label: 'Paid', cls: 'bg-green-50 text-green-700 border-green-200' },
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    failed: { label: 'Failed', cls: 'bg-red-50 text-red-700 border-red-200' },
    refunded: { label: 'Refunded', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
  };
  const s = map[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide',
        s.cls
      )}
    >
      {s.label}
    </span>
  );
};
const QuoteStatusBadge = ({ status }: { status: QuoteStatus | string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-gray-50 text-gray-600 border-gray-200' },
    pending: { label: 'Pending', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    sent: { label: 'Sent', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    accepted: { label: 'Accepted', cls: 'bg-green-50 text-green-700 border-green-200' },
    declined: { label: 'Declined', cls: 'bg-red-50 text-red-700 border-red-200' },
    expired: { label: 'Expired', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  };
  const key = typeof status === 'string' ? status.toLowerCase().trim() : '';
  const s =
    map[key] ??
    ({
      label: status ? String(status).replace(/_/g, ' ') : 'Unknown',
      cls: 'bg-gray-50 text-gray-600 border-gray-200',
    } as const);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide',
        s.cls
      )}
    >
      {s.label}
    </span>
  );
};
const PageHeader = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="mb-6 flex items-start justify-between gap-4"
  >
    <div>
      <h1 className="text-xl font-extrabold tracking-tight text-gray-900">{title}</h1>
      <p className="mt-0.5 text-sm text-gray-400">
        <span>{subtitle}</span>
      </p>
    </div>
    {action}
  </motion.div>
);

const BookingDrawer = ({
  booking,
  onClose,
  onStatusChange,
}: {
  booking: Booking | null;
  onClose: () => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
}) => {
  const STATUS_OPTIONS: BookingStatus[] = [
    'pending',
    'paid',
    'confirmed',
    'completed',
    'cancelled',
  ];
  return (
    <AnimatePresence>
      {booking && (
        <div className="fixed inset-0 z-[80] flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="flex-1 bg-black/40"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="flex w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">{booking.id}</h3>
                <p className="mt-0.5 text-xs text-gray-400">Booking Details</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-gray-500">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onStatusChange(booking.id, s)}
                      className={cn(
                        'rounded-xl border-2 px-3 py-1.5 text-xs font-bold transition-all',
                        booking.status === s
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      )}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Client</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                    {booking.client
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{booking.client}</p>
                    <p className="text-xs text-gray-500">{booking.email}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 rounded-2xl bg-gray-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Details</p>
                {[
                  { icon: <Sparkles className="h-3.5 w-3.5" />, label: 'Service', value: booking.service },
                  { icon: <Users className="h-3.5 w-3.5" />, label: 'Cleaner', value: booking.cleaner },
                  { icon: <Calendar className="h-3.5 w-3.5" />, label: 'Date', value: booking.date },
                  { icon: <Clock className="h-3.5 w-3.5" />, label: 'Time', value: booking.time },
                  {
                    icon: <MapPin className="h-3.5 w-3.5" />,
                    label: 'Address',
                    value: `${booking.address}, ${booking.suburb}`,
                  },
                  { icon: <DollarSign className="h-3.5 w-3.5" />, label: 'Amount', value: formatZAR(booking.amount) },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-lg bg-gray-200 text-gray-500">
                      {row.icon}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                      <span className="text-xs text-gray-500">{row.label}</span>
                      <span className="text-right text-xs font-semibold text-gray-800">{row.value}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Payment</p>
                <div className="flex items-center justify-between">
                  <PayStatusBadge status={booking.paymentStatus} />
                  <p className="text-base font-extrabold text-gray-900">{formatZAR(booking.amount)}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0 gap-2 border-t border-gray-100 p-4">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-2.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Resend Email</span>
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-200"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>View Invoice</span>
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};


// --- BOOKINGS PAGE ---

export const BookingsPage = ({
  onNewBooking,
  newBookings,
  syncSearch = '',
}: {
  onNewBooking: () => void;
  newBookings: NewBookingRecord[];
  /** Synced from the admin shell search (e.g. top bar on /admin). */
  syncSearch?: string;
}) => {
  const { bookings: raw, loading, error, mutate } = useAdminBookings(500);
  const apiRows = useMemo(() => {
    return (raw as Record<string, unknown>[]).map((row) =>
      mapAdminBookingApiToRow(row as Parameters<typeof mapAdminBookingApiToRow>[0])
    );
  }, [raw]);

  const merged = useMemo(() => {
    const byId = new Map(apiRows.map((b) => [b.id, b as Booking]));
    for (const nb of newBookings) {
      if (!byId.has(nb.id)) byId.set(nb.id, nb);
    }
    return Array.from(byId.values());
  }, [apiRows, newBookings]);

  const [search, setSearch] = useState('');
  useEffect(() => {
    setSearch(syncSearch);
  }, [syncSearch]);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const filtered = merged.filter((b) => {
    const matchSearch =
      b.client.toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase()) ||
      b.service.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = useCallback(
    async (id: string, status: BookingStatus) => {
      try {
        const res = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const j = await res.json();
        if (!res.ok || !j?.ok) throw new Error(j?.error || 'Update failed');
        await mutate();
        setSelectedBooking((prev) => (prev && prev.id === id ? { ...prev, status } : prev));
      } catch (e) {
        console.error(e);
      }
    },
    [mutate]
  );

  const STATUS_TABS: { value: BookingStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div>
      <PageHeader
        title="Bookings"
        subtitle="Manage and track all cleaning bookings"
        action={
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={onNewBooking}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-shadow hover:shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span>New Booking</span>
          </motion.button>
        }
      />

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-gray-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings, clients, services..."
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              aria-label="Search bookings"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                  statusFilter === tab.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <p className="text-sm font-bold text-gray-900">
            <span>{filtered.length}</span>
            <span className="ml-1 font-normal text-gray-400">bookings found</span>
          </p>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-200"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export</span>
          </button>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Booking', 'Client', 'Service', 'Date & Time', 'Cleaner', 'Amount', 'Status', ''].map((h) => (
                  <th key={h} className="whitespace-nowrap px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((booking) => (
                <tr
                  key={booking.id}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-bold text-indigo-600">{booking.id}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[9px] font-bold text-white">
                        {booking.client
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="whitespace-nowrap text-sm font-semibold text-gray-900">{booking.client}</p>
                        <p className="text-[10px] text-gray-400">{booking.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-700">{booking.service}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="whitespace-nowrap text-sm text-gray-700">{booking.date}</p>
                    <p className="text-[10px] text-gray-400">{booking.time}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-700">{booking.cleaner}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold text-gray-900">{formatZAR(booking.amount)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <BookingStatusBadge status={booking.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBooking(booking);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                      aria-label="View booking"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-gray-50 md:hidden">
          {filtered.map((booking) => (
            <div
              key={booking.id}
              className="cursor-pointer px-4 py-4 transition-colors hover:bg-gray-50"
              onClick={() => setSelectedBooking(booking)}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold text-white">
                  {booking.client
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{booking.client}</p>
                    <BookingStatusBadge status={booking.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    <span>{booking.service}</span>
                    <span className="mx-1">{'\u00B7'}</span>
                    <span>{booking.date}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600">{booking.id}</span>
                    <span className="text-xs font-bold text-gray-900">{formatZAR(booking.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && !loading && (
          <div className="py-16 text-center">
            <p className="text-sm text-gray-400">No bookings found matching your search.</p>
          </div>
        )}
        {loading && (
          <div className="py-8 text-center text-sm text-gray-500">Loading bookings…</div>
        )}
        {error && (
          <div className="py-4 text-center text-sm text-red-600">Could not load bookings. {error}</div>
        )}
      </motion.div>

      <BookingDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};


// --- CUSTOMERS PAGE ---

export const CustomersPage = () => {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data, isLoading, mutate: mutateCustomers } = useSWR<{
    ok: boolean;
    customers?: Record<string, unknown>[];
  }>('/api/admin/customers?limit=400', fetcher);

  const [customerEditOpen, setCustomerEditOpen] = useState(false);
  const [customerEditLoading, setCustomerEditLoading] = useState(false);
  const [customerEditSaving, setCustomerEditSaving] = useState(false);
  const [customerEditForm, setCustomerEditForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address_suburb: '',
    address_city: '',
  });

  const customers = useMemo(() => {
    const rows = data?.ok ? data.customers ?? [] : [];
    const colors = ['#4F46E5', '#059669', '#D97706', '#7C3AED', '#DC2626'];
    return rows.map((c, i) => {
      const first = String(c.first_name ?? '');
      const last = String(c.last_name ?? '');
      const name = `${first} ${last}`.trim() || String(c.email ?? 'Customer');
      return {
        id: String(c.id),
        name,
        email: String(c.email ?? ''),
        phone: String(c.phone ?? ''),
        suburb: String(c.address_suburb ?? ''),
        city: String(c.address_city ?? ''),
        totalBookings: Number(c.total_bookings ?? 0),
        totalSpent: (Number(c.total_spent) || 0) / 100,
        lastBooking: '—',
        status: (Number(c.total_bookings) || 0) > 0 ? ('active' as const) : ('inactive' as const),
        initials: name
          .split(/\s+/)
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        color: colors[i % colors.length],
      } satisfies Customer;
    });
  }, [data]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const { data: custBookingsRes } = useSWR<{ ok: boolean; bookings?: Record<string, unknown>[] }>(
    selectedCustomer ? `/api/admin/bookings?limit=15&customer=${encodeURIComponent(selectedCustomer.id)}` : null,
    fetcher
  );
  const customerRecentBookings = useMemo(() => {
    const raw = custBookingsRes?.ok ? custBookingsRes.bookings ?? [] : [];
    return raw.map((row) => mapAdminBookingApiToRow(row as Parameters<typeof mapAdminBookingApiToRow>[0]));
  }, [custBookingsRes]);

  const openCustomerEdit = useCallback(async () => {
    if (!selectedCustomer) return;
    setCustomerEditOpen(true);
    setCustomerEditLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustomer.id}`, { credentials: 'include' });
      const j = await res.json();
      if (j.ok && j.customer) {
        const c = j.customer as Record<string, unknown>;
        setCustomerEditForm({
          first_name: String(c.first_name ?? ''),
          last_name: String(c.last_name ?? ''),
          email: String(c.email ?? ''),
          phone: String(c.phone ?? ''),
          address_suburb: String(c.address_suburb ?? ''),
          address_city: String(c.address_city ?? ''),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCustomerEditLoading(false);
    }
  }, [selectedCustomer]);

  const saveCustomerEdit = useCallback(() => {
    if (!selectedCustomer) return;
    setCustomerEditSaving(true);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/customers/${selectedCustomer.id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            first_name: customerEditForm.first_name.trim(),
            last_name: customerEditForm.last_name.trim(),
            email: customerEditForm.email.trim(),
            phone: customerEditForm.phone.trim() || undefined,
            address_suburb: customerEditForm.address_suburb.trim() || undefined,
            address_city: customerEditForm.address_city.trim() || undefined,
          }),
        });
        const j = await res.json();
        if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to save');
        await mutateCustomers();
        const c = j.customer as Record<string, unknown>;
        const first = String(c.first_name ?? '');
        const last = String(c.last_name ?? '');
        const name = `${first} ${last}`.trim() || String(c.email ?? 'Customer');
        setSelectedCustomer({
          id: String(c.id),
          name,
          email: String(c.email ?? ''),
          phone: String(c.phone ?? ''),
          suburb: String(c.address_suburb ?? ''),
          city: String(c.address_city ?? ''),
          totalBookings: selectedCustomer.totalBookings,
          totalSpent: selectedCustomer.totalSpent,
          lastBooking: selectedCustomer.lastBooking,
          status: selectedCustomer.status,
          initials: name
            .split(/\s+/)
            .filter(Boolean)
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
          color: selectedCustomer.color,
        });
        setCustomerEditOpen(false);
      } catch (e) {
        console.error(e);
      } finally {
        setCustomerEditSaving(false);
      }
    })();
  }, [selectedCustomer, customerEditForm, mutateCustomers]);

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="View and manage all your clients"
        action={
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Add Customer</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2.5 rounded-xl bg-gray-100 px-3 py-2">
              <Search className="h-3.5 w-3.5 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                aria-label="Search customers"
              />
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <p className="text-sm font-bold text-gray-900">
                <span>{filtered.length}</span>
                <span className="ml-1 font-normal text-gray-400">customers</span>
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map((customer) => (
                <motion.div
                  key={customer.id}
                  whileHover={{ backgroundColor: '#fafafa' }}
                  onClick={() => setSelectedCustomer(customer)}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 px-5 py-4 transition-colors',
                    selectedCustomer?.id === customer.id && 'bg-indigo-50'
                  )}
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: customer.color }}
                  >
                    {customer.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{customer.name}</p>
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                          customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        )}
                      >
                        {customer.status}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      <span>{customer.email}</span>
                      <span className="mx-1">{'\u00B7'}</span>
                      <span>{customer.suburb}</span>
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-gray-900">{formatZAR(customer.totalSpent)}</p>
                    <p className="text-[10px] text-gray-400">{customer.totalBookings} bookings</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {selectedCustomer ? (
            <motion.div
              key={selectedCustomer.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="sticky top-24 h-fit overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="border-b border-gray-100 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Customer Profile</p>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200"
                    aria-label="Close"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
                    style={{ backgroundColor: selectedCustomer.color }}
                  >
                    {selectedCustomer.initials}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">{selectedCustomer.name}</h3>
                    <p className="text-xs text-gray-500">{selectedCustomer.city}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-0 border-b border-gray-100">
                {[
                  { label: 'Total Bookings', value: selectedCustomer.totalBookings },
                  { label: 'Total Spent', value: formatZAR(selectedCustomer.totalSpent) },
                ].map((stat, i) => (
                  <div key={stat.label} className={cn('p-4 text-center', i === 0 && 'border-r border-gray-100')}>
                    <p className="text-lg font-extrabold text-gray-900">{stat.value}</p>
                    <p className="text-[10px] font-medium text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 p-5">
                {[
                  { icon: <Mail className="h-3.5 w-3.5" />, label: selectedCustomer.email },
                  { icon: <Phone className="h-3.5 w-3.5" />, label: selectedCustomer.phone },
                  {
                    icon: <MapPin className="h-3.5 w-3.5" />,
                    label: `${selectedCustomer.suburb}, ${selectedCustomer.city}`,
                  },
                  {
                    icon: <Calendar className="h-3.5 w-3.5" />,
                    label: `Last booking: ${selectedCustomer.lastBooking}`,
                  },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      {item.icon}
                    </div>
                    <span className="text-xs text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">Recent Bookings</p>
                <div className="space-y-2">
                  {customerRecentBookings.slice(0, 5).map((b) => (
                      <div key={b.id} className="flex items-center gap-2 rounded-xl bg-gray-50 p-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800">{b.service}</p>
                          <p className="text-[10px] text-gray-400">
                            {b.date} · {b.time}
                          </p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <span className="text-xs font-bold text-gray-800">{formatZAR(b.amount)}</span>
                          <BookingStatusBadge status={b.status} />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex gap-2 px-5 pb-5">
                <button
                  type="button"
                  onClick={() => void openCustomerEdit()}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white transition-colors hover:bg-indigo-700"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCustomer?.email) window.location.href = `mailto:${selectedCustomer.email}`;
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-gray-700 transition-colors hover:bg-gray-200"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm"
            >
              <Users className="h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-400">Select a customer to view their profile</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {customerEditOpen && selectedCustomer && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomerEditOpen(false)}
              className="fixed inset-0 bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900">Edit customer</h3>
                <button
                  type="button"
                  onClick={() => setCustomerEditOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-gray-100 text-gray-400"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {customerEditLoading ? (
                <p className="text-sm text-gray-500">Loading…</p>
              ) : (
                <>
                  {(
                    [
                      { label: 'First name', key: 'first_name' as const, type: 'text' },
                      { label: 'Last name', key: 'last_name' as const, type: 'text' },
                      { label: 'Email', key: 'email' as const, type: 'email' },
                      { label: 'Phone', key: 'phone' as const, type: 'tel' },
                      { label: 'Suburb', key: 'address_suburb' as const, type: 'text' },
                      { label: 'City', key: 'address_city' as const, type: 'text' },
                    ] as const
                  ).map((field) => (
                    <div key={field.key}>
                      <label className="mb-1.5 block text-xs font-bold text-gray-700">{field.label}</label>
                      <input
                        type={field.type}
                        value={customerEditForm[field.key]}
                        onChange={(e) =>
                          setCustomerEditForm((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  ))}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCustomerEditOpen(false)}
                      className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveCustomerEdit}
                      disabled={customerEditSaving}
                      className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
                    >
                      {customerEditSaving ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- CLEANERS PAGE ---

export const CleanersPage = () => {
  const router = useRouter();
  const { cleaners: rawCleaners, loading: cleanersLoading, error: cleanersError, mutate: mutateCleaners } =
    useAdminCleaners(300);

  const cleaners = useMemo(() => {
    const colors = ['#4F46E5', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2'];
    return (rawCleaners as Record<string, unknown>[]).map((c, i) => {
      const name = String(c.name ?? '');
      const areas = (c.areas as string[] | undefined) ?? [];
      return {
        id: String(c.id),
        name,
        email: String(c.email ?? ''),
        phone: String(c.phone ?? ''),
        initials: name
          .split(/\s+/)
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        color: colors[i % colors.length],
        rating: Number(c.average_rating ?? c.rating ?? 0),
        jobs: Number(c.completed_bookings ?? 0),
        revenue: (Number(c.total_revenue) || 0) / 100,
        available: !!c.is_available,
        status: (c.is_active ? 'active' : 'inactive') as Cleaner['status'],
        suburb: areas[0] ?? '',
        joinDate: String(c.created_at ?? '').split('T')[0],
      } satisfies Cleaner;
    });
  }, [rawCleaners]);

  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editCleanerId, setEditCleanerId] = useState<string | null>(null);
  const [editCleaner, setEditCleaner] = useState({ name: '', email: '', phone: '', suburb: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [newCleaner, setNewCleaner] = useState({ name: '', email: '', phone: '', suburb: '' });

  const filtered = cleaners.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.suburb.toLowerCase().includes(search.toLowerCase())
  );

  const [availLocal, setAvailLocal] = useState<Record<string, boolean>>({});
  const displayCleaners = filtered.map((c) => ({
    ...c,
    available: availLocal[c.id] !== undefined ? availLocal[c.id] : c.available,
  }));

  const toggleAvailability = (id: string) => {
    const c = cleaners.find((x) => x.id === id);
    if (!c) return;
    const cur = availLocal[id] !== undefined ? availLocal[id] : c.available;
    setAvailLocal((prev) => ({ ...prev, [id]: !cur }));
  };

  const handleAddCleaner = () => {
    if (!newCleaner.name || !newCleaner.phone || !newCleaner.suburb) return;
    void (async () => {
      try {
        const res = await fetch('/api/admin/cleaners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCleaner.name,
            email: newCleaner.email || undefined,
            phone: newCleaner.phone,
            areas: [newCleaner.suburb],
            auth_provider: 'otp',
          }),
        });
        const j = await res.json();
        if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to add cleaner');
        await mutateCleaners();
        setNewCleaner({ name: '', email: '', phone: '', suburb: '' });
        setShowAddForm(false);
      } catch (e) {
        console.error(e);
      }
    })();
  };

  const handleEditCleaner = () => {
    if (!editCleanerId || !editCleaner.name.trim() || !editCleaner.phone.trim() || !editCleaner.suburb.trim()) return;
    setEditSaving(true);
    void (async () => {
      try {
        const res = await fetch(`/api/admin/cleaners/${editCleanerId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editCleaner.name.trim(),
            email: editCleaner.email.trim() || undefined,
            phone: editCleaner.phone,
            areas: [editCleaner.suburb.trim()],
          }),
        });
        const j = await res.json();
        if (!res.ok || !j?.ok) throw new Error(j?.error || 'Failed to update cleaner');
        await mutateCleaners();
        setShowEditForm(false);
        setEditCleanerId(null);
      } catch (e) {
        console.error(e);
      } finally {
        setEditSaving(false);
      }
    })();
  };

  return (
    <div>
      <PageHeader
        title="Cleaners"
        subtitle="Manage your cleaning team"
        action={
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Add Cleaner</span>
          </button>
        }
      />

      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="fixed inset-0 bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900">Add New Cleaner</h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-gray-100 text-gray-400"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {(
                [
                  { label: 'Full Name', key: 'name' as const, placeholder: 'Thembi Sithole', type: 'text' },
                  { label: 'Email', key: 'email' as const, placeholder: 'thembi@shalean.co.za', type: 'email' },
                  { label: 'Phone', key: 'phone' as const, placeholder: '+27 82 000 0000', type: 'tel' },
                  { label: 'Suburb', key: 'suburb' as const, placeholder: 'Khayelitsha', type: 'text' },
                ] as const
              ).map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    <span>{field.label}</span>
                  </label>
                  <input
                    type={field.type}
                    value={newCleaner[field.key]}
                    onChange={(e) => setNewCleaner((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCleaner}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-bold text-white shadow-md"
                >
                  Add Cleaner
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditForm && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowEditForm(false);
                setEditCleanerId(null);
              }}
              className="fixed inset-0 bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900">Edit cleaner</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditCleanerId(null);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-gray-100 text-gray-400"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {(
                [
                  { label: 'Full Name', key: 'name' as const, placeholder: 'Thembi Sithole', type: 'text' },
                  { label: 'Email', key: 'email' as const, placeholder: 'thembi@shalean.co.za', type: 'email' },
                  { label: 'Phone', key: 'phone' as const, placeholder: '+27 82 000 0000', type: 'tel' },
                  { label: 'Suburb', key: 'suburb' as const, placeholder: 'Khayelitsha', type: 'text' },
                ] as const
              ).map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    <span>{field.label}</span>
                  </label>
                  <input
                    type={field.type}
                    value={editCleaner[field.key]}
                    onChange={(e) => setEditCleaner((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditCleanerId(null);
                  }}
                  className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditCleaner}
                  disabled={editSaving}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
                >
                  {editSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2.5 rounded-xl bg-gray-100 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cleaners..."
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
            aria-label="Search cleaners"
          />
        </div>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {displayCleaners.map((cleaner) => (
          <motion.div
            key={cleaner.id}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                  style={{ backgroundColor: cleaner.color }}
                >
                  {cleaner.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{cleaner.name}</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    {cleaner.rating > 0 ? (
                      <span className="text-[10px] font-bold text-amber-600">
                      <Star className="mb-0.5 mr-0.5 inline h-3 w-3 text-amber-500" aria-hidden />
                      {cleaner.rating}
                    </span>
                    ) : (
                      <span className="text-[10px] text-gray-400">No ratings yet</span>
                    )}
                    <span className="mx-0.5 text-gray-300">{'\u00B7'}</span>
                    <span className="text-[10px] text-gray-500">{cleaner.suburb}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[9px] font-bold',
                    cleaner.status === 'active'
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : cleaner.status === 'pending'
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-gray-200 bg-gray-50 text-gray-600'
                  )}
                >
                  {cleaner.status}
                </span>
                <button
                  type="button"
                  onClick={() => toggleAvailability(cleaner.id)}
                  className={cn(
                    'flex items-center gap-1 text-[10px] font-bold transition-colors',
                    cleaner.available ? 'text-green-600' : 'text-gray-400'
                  )}
                  aria-label={`Toggle availability for ${cleaner.name}`}
                >
                  {cleaner.available ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                  <span>{cleaner.available ? 'Available' : 'Busy'}</span>
                </button>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              {[
                { label: 'Jobs', value: cleaner.jobs },
                {
                  label: 'Revenue',
                  value: cleaner.revenue > 0 ? `R${(cleaner.revenue / 1000).toFixed(0)}k` : '—',
                },
                { label: 'Rating', value: cleaner.rating > 0 ? cleaner.rating : '—' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-gray-50 p-2 text-center">
                  <p className="text-sm font-extrabold text-gray-900">{stat.value}</p>
                  <p className="text-[9px] font-medium text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mb-4 space-y-1">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{cleaner.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{cleaner.phone}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditCleanerId(cleaner.id);
                  setEditCleaner({
                    name: cleaner.name,
                    email: cleaner.email,
                    phone: cleaner.phone,
                    suburb: cleaner.suburb,
                  });
                  setShowEditForm(true);
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-50 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/admin/schedule?cleanerId=${encodeURIComponent(cleaner.id)}&cleanerName=${encodeURIComponent(cleaner.name)}`
                  )
                }
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gray-100 py-2 text-xs font-bold text-gray-600 transition-colors hover:bg-gray-200"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Schedule</span>
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};


// --- QUOTES PAGE ---

export const QuotesPage = ({ onNewBooking }: { onNewBooking: () => void }) => {
  const { data: quotesRes, mutate: mutateQuotes } = useSWR<{ ok: boolean; quotes?: Record<string, unknown>[] }>(
    '/api/admin/quotes?limit=200',
    fetcher
  );
  const apiQuotes = useMemo(() => {
    const rows = quotesRes?.ok ? quotesRes.quotes ?? [] : [];
    return rows.map((q) => ({
      id: String(q.id),
      client: String((q as { customer_name?: string }).customer_name ?? ''),
      email: String((q as { customer_email?: string }).customer_email ?? ''),
      service: String((q as { service_type?: string }).service_type ?? ''),
      amount: (Number((q as { amount?: number }).amount) || 0) / 100,
      status: String((q as { status?: string }).status ?? 'draft') as QuoteStatus,
      createdDate: String((q as { created_at?: string }).created_at ?? '').split('T')[0],
      expiryDate: String((q as { valid_until?: string }).valid_until ?? (q as { expires_at?: string }).expires_at ?? '')
        .split('T')[0] || '—',
      notes: String((q as { notes?: string }).notes ?? ''),
    }));
  }, [quotesRes]);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  useEffect(() => {
    setQuotes(apiQuotes);
  }, [apiQuotes]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuote, setNewQuote] = useState({
    client: '',
    email: '',
    service: 'Standard Clean',
    amount: '',
    notes: '',
  });
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const handleSendQuote = (id: string) => {
    setSendingId(id);
    setTimeout(() => {
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'sent' as QuoteStatus } : q)));
      setSendingId(null);
    }, 1400);
  };

  const handleConvertToBooking = (id: string) => {
    setConvertingId(id);
    setTimeout(() => {
      setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status: 'accepted' as QuoteStatus } : q)));
      setConvertingId(null);
    }, 1200);
  };

  const handleCreateQuote = () => {
    if (!newQuote.client || !newQuote.email || !newQuote.amount) return;
    const today = new Date();
    const expiry = new Date(today);
    expiry.setDate(expiry.getDate() + 7);
    const created: Quote = {
      id: `QT-${String(quotes.length + 1).padStart(3, '0')}`,
      client: newQuote.client,
      email: newQuote.email,
      service: newQuote.service,
      amount: Number(newQuote.amount),
      status: 'draft',
      createdDate: today.toISOString().split('T')[0],
      expiryDate: expiry.toISOString().split('T')[0],
      notes: newQuote.notes,
    };
    setQuotes((prev) => [created, ...prev]);
    setNewQuote({ client: '', email: '', service: 'Standard Clean', amount: '', notes: '' });
    setShowCreateForm(false);
  };

  return (
    <div>
      <PageHeader
        title="Quotes"
        subtitle="Create and manage client quotes"
        action={
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md"
          >
            <Plus className="h-4 w-4" />
            <span>Create Quote</span>
          </button>
        }
      />

      <AnimatePresence>
        {showCreateForm && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateForm(false)}
              className="fixed inset-0 bg-black/40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900">Create Quote</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-xl bg-gray-100 text-gray-400"
                  aria-label="Close"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {(
                [
                  { label: 'Client Name', key: 'client' as const, placeholder: 'Naledi Dlamini', type: 'text' },
                  { label: 'Client Email', key: 'email' as const, placeholder: 'naledi@email.com', type: 'email' },
                  { label: 'Amount (R)', key: 'amount' as const, placeholder: '285', type: 'number' },
                ] as const
              ).map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    <span>{field.label}</span>
                  </label>
                  <input
                    type={field.type}
                    value={newQuote[field.key]}
                    onChange={(e) => setNewQuote((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  <span>Service</span>
                </label>
                <select
                  value={newQuote.service}
                  onChange={(e) => setNewQuote((prev) => ({ ...prev, service: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400"
                >
                  {['Standard Clean', 'Deep Clean', 'Move-In/Out', 'Office Clean', 'Window Clean'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-700">
                  <span>Notes</span>
                </label>
                <textarea
                  value={newQuote.notes}
                  onChange={(e) => setNewQuote((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Scope of work, special requirements..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateQuote}
                  className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-bold text-white shadow-md"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
        {quotes.map((quote) => (
          <motion.div key={quote.id} variants={fadeUp} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white">
                  {quote.client
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{quote.client}</p>
                    <QuoteStatusBadge status={quote.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    <span>{quote.service}</span>
                    <span className="mx-1">{'\u00B7'}</span>
                    <span>{quote.email}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-shrink-0 items-center gap-3">
                <div className="text-right">
                  <p className="text-base font-extrabold text-gray-900">{formatZAR(quote.amount)}</p>
                  <p className="text-[10px] text-gray-400">
                    <span>Exp: {quote.expiryDate}</span>
                  </p>
                </div>

                <div className="flex gap-2">
                  {(quote.status === 'draft' || quote.status === 'sent') && (
                    <button
                      type="button"
                      onClick={() => handleSendQuote(quote.id)}
                      disabled={sendingId === quote.id}
                      className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
                    >
                      {sendingId === quote.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>{quote.status === 'draft' ? 'Send' : 'Resend'}</span>
                    </button>
                  )}
                  {quote.status === 'accepted' && (
                    <button
                      type="button"
                      onClick={() => onNewBooking()}
                      className="flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-100"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Book Now</span>
                    </button>
                  )}
                  {quote.status === 'sent' && (
                    <button
                      type="button"
                      onClick={() => handleConvertToBooking(quote.id)}
                      disabled={convertingId === quote.id}
                      className="flex items-center gap-1.5 rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                    >
                      {convertingId === quote.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5" />
                      )}
                      <span>Convert</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {quote.notes && (
              <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-400">{quote.notes}</p>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

// --- PAYMENTS PAGE ---

export const PaymentsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');

  const { data: payRes } = useSWR<{ ok: boolean; payments?: Record<string, unknown>[] }>(
    '/api/admin/payments?limit=400&skip_verify=1',
    fetcher
  );

  const payments = useMemo((): Payment[] => {
    const rows = payRes?.ok ? payRes.payments ?? [] : [];
    return rows.map((p) => {
      const st = String(p.status ?? '');
      let ui: PaymentStatus = 'pending';
      if (st === 'completed') ui = 'paid';
      else if (st === 'failed') ui = 'failed';
      else if (st === 'processing' || st === 'pending') ui = 'pending';
      return {
        id: String(p.id),
        bookingId: String(p.booking_id ?? p.id),
        client: String(p.customer_name ?? ''),
        amount: (Number(p.amount) || 0) / 100,
        status: ui,
        method: String(p.payment_method ?? 'card'),
        paystackRef: String(p.transaction_id ?? ''),
        date: String(p.created_at ?? '').split('T')[0],
        service: String(p.service_type ?? '—'),
      };
    });
  }, [payRes]);

  const filtered = payments.filter((p) => {
    const matchSearch =
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.paystackRef.toLowerCase().includes(search.toLowerCase()) ||
      p.bookingId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalRevenue = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const pendingAmount = payments.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const failedCount = payments.filter((p) => p.status === 'failed').length;

  const PAY_TABS: { value: PaymentStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'paid', label: 'Paid' },
    { value: 'pending', label: 'Pending' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
  ];

  return (
    <div>
      <PageHeader title="Payments" subtitle="Track transactions and payment statuses" />

      <motion.div variants={stagger} initial="hidden" animate="show" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: 'Revenue Collected',
            value: formatZAR(totalRevenue),
            icon: <CheckCircle2 className="h-4 w-4" />,
            color: '#059669',
            bg: '#ECFDF5',
          },
          {
            label: 'Pending Payments',
            value: formatZAR(pendingAmount),
            icon: <Clock className="h-4 w-4" />,
            color: '#D97706',
            bg: '#FFFBEB',
          },
          {
            label: 'Failed Transactions',
            value: String(failedCount),
            icon: <AlertTriangle className="h-4 w-4" />,
            color: '#DC2626',
            bg: '#FEF2F2',
          },
        ].map((card) => (
          <motion.div key={card.label} variants={fadeUp} className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: card.bg, color: card.color }}
            >
              {card.icon}
            </div>
            <div>
              <p className="text-lg font-extrabold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-400">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-2.5 rounded-xl bg-gray-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by client, reference..."
              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              aria-label="Search payments"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {PAY_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                  statusFilter === tab.value ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Transaction ID', 'Booking', 'Client', 'Service', 'Amount', 'Method', 'Paystack Ref', 'Status', 'Date'].map(
                  (h) => (
                    <th key={h} className="whitespace-nowrap px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400">
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((pay) => (
                <tr key={pay.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-bold text-indigo-600">{pay.id}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-600">{pay.bookingId}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="whitespace-nowrap text-sm font-semibold text-gray-900">{pay.client}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-gray-700">{pay.service}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm font-bold text-gray-900">{formatZAR(pay.amount)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-600">{pay.method}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-gray-500">{pay.paystackRef}</span>
                      <button type="button" className="text-gray-300 transition-colors hover:text-indigo-500" aria-label="Open Paystack">
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <PayStatusBadge status={pay.status} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-500">{pay.date}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-gray-50 md:hidden">
          {filtered.map((pay) => (
            <div key={pay.id} className="px-4 py-4">
              <div className="mb-1 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{pay.client}</p>
                  <p className="text-xs text-gray-400">
                    {pay.service}
                    {' \u00B7 '}
                    {pay.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatZAR(pay.amount)}</p>
                  <PayStatusBadge status={pay.status} />
                </div>
              </div>
              <p className="mt-1 font-mono text-[10px] text-gray-400">{pay.paystackRef}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};


// --- REPORTS PAGE ---

export const ReportsPage = () => {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('year');
  const formatZARShort = (v: number) => `R${(v / 1000).toFixed(0)}k`;

  const rangeKey = period === 'month' ? 'month' : period === 'quarter' ? 'month' : 'year';
  const { dateFrom, dateTo } = useMemo(() => getDateRange(rangeKey === 'year' ? 'year' : 'month'), [rangeKey]);
  const qs = `date_from=${encodeURIComponent(dateFrom)}&date_to=${encodeURIComponent(dateTo)}`;
  const { data: chartRes } = useSWR<{ ok: boolean; data: { date: string; revenue: number; bookings: number }[] }>(
    `/api/admin/stats/chart?${qs}`,
    fetcher
  );
  const { data: svcRes } = useSWR<{ ok: boolean; data: { name: string; value: number }[] }>(
    `/api/admin/stats/service-breakdown?${qs}`,
    fetcher
  );
  const { stats: repStats } = useDashboardStats(rangeKey === 'year' ? 'year' : 'month');

  const monthlyRevenue = useMemo(() => {
    const pts = chartRes?.ok ? chartRes.data ?? [] : [];
    return pts.map((p) => ({
      month: p.date.slice(5),
      revenue: p.revenue / 100,
      bookings: p.bookings,
    }));
  }, [chartRes]);

  const pieData = useMemo(() => {
    const rows = svcRes?.ok ? svcRes.data ?? [] : [];
    const cols = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626'];
    const t = rows.reduce((s, r) => s + r.value, 0);
    return rows.map((r, i) => ({
      name: r.name,
      value: t ? Math.round((r.value / t) * 100) : 0,
      color: cols[i % cols.length],
    }));
  }, [svcRes]);

  const { cleaners: repCleanersRaw } = useAdminCleaners(12);
  const reportCleanerRows = useMemo(() => {
    const list = (repCleanersRaw as Record<string, unknown>[]).filter(
      (c) => (Number(c.completed_bookings) || 0) > 0
    );
    const maxJobs = Math.max(1, ...list.map((c) => Number(c.completed_bookings) || 0));
    const palette = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#DC2626', '#2563EB'];
    return list.slice(0, 6).map((c, i) => {
      const name = String(c.name ?? 'Cleaner');
      const initials = name
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || '?';
      const jobs = Number(c.completed_bookings) || 0;
      const revenue = (Number(c.total_revenue) || 0) / 100;
      const rating = c.average_rating != null ? Number(c.average_rating) : 0;
      return {
        id: String(c.id ?? i),
        name,
        initials,
        color: palette[i % palette.length],
        jobs,
        revenue,
        rating,
        pct: Math.round((jobs / maxJobs) * 100),
      };
    });
  }, [repCleanersRaw]);

  const chartYearLabel = useMemo(() => {
    try {
      return String(new Date(dateFrom).getFullYear());
    } catch {
      return String(new Date().getFullYear());
    }
  }, [dateFrom]);

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Insights into your business performance"
        action={
          <div className="flex items-center gap-2">
            {(['month', 'quarter', 'year'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all',
                  period === p
                    ? 'bg-indigo-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                )}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {repStats
          ? [
              {
                label: 'Total Revenue',
                value: formatCurrency(repStats.totalRevenue, false),
                change: repStats.revenueGrowth ?? 0,
                color: '#4F46E5',
              },
              {
                label: 'Total Bookings',
                value: String(repStats.totalBookings),
                change: repStats.bookingsGrowth ?? 0,
                color: '#059669',
              },
              {
                label: 'Avg Order Value',
                value: formatCurrency(repStats.avgBookingValue, false),
                change: repStats.avgValueGrowth ?? 0,
                color: '#D97706',
              },
              {
                label: 'Active Customers',
                value: String(repStats.activeCustomers),
                change: repStats.customersGrowth ?? 0,
                color: '#7C3AED',
              },
            ].map((kpi) => {
              return (
                <motion.div key={kpi.label} variants={fadeUp} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{kpi.label}</p>
                  <p className="mt-1 text-xl font-extrabold text-gray-900">{kpi.value}</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    {kpi.change >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={cn('text-xs font-bold', kpi.change >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {kpi.change >= 0 ? '+' : ''}
                      {kpi.change}%
                    </span>
                  </div>
                </motion.div>
              );
            })
          : null}
      </motion.div>

      <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Revenue & Bookings</h2>
              <p className="mt-0.5 text-xs text-gray-400">Performance — {chartYearLabel}</p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyRevenue}
                margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="rptRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatZARShort}
                  width={40}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const raw = typeof value === 'number' ? value : Number(value);
                    const n = String(name);
                    if (n === 'revenue' && Number.isFinite(raw))
                      return [new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(raw), 'Revenue'];
                    return [value, 'Bookings'];
                  }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    fontSize: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4F46E5"
                  strokeWidth={2}
                  fill="url(#rptRevGrad)"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold text-gray-900">Service Mix</h2>
          <div className="mb-4 flex justify-center">
            <div className="h-36 w-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.length ? pieData : [{ name: 'No data', value: 100, color: '#e5e7eb' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={66}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {(pieData.length ? pieData : [{ name: 'No data', value: 100, color: '#e5e7eb' }]).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-2">
            {(pieData.length ? pieData : [{ name: 'No bookings yet', value: 0, color: '#e5e7eb' }]).map((d) => (
              <div key={d.name} className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="flex-1 text-xs text-gray-600">{d.name}</span>
                <span className="text-xs font-bold text-gray-800">{pieData.length ? `${d.value}%` : '—'}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-gray-900">Cleaner Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {['Cleaner', 'Jobs', 'Revenue', 'Rating', 'Performance'].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap pb-3 px-3 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 first:pl-0"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reportCleanerRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-gray-500">
                    No cleaner job data for this period yet.
                  </td>
                </tr>
              ) : null}
              {reportCleanerRows.map((cleaner, i) => (
                <tr key={cleaner.id} className="transition-colors hover:bg-gray-50">
                  <td className="py-3.5 px-3 first:pl-0">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 text-center text-xs font-bold text-gray-300">{i + 1}</span>
                      <div
                        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: cleaner.color }}
                      >
                        {cleaner.initials}
                      </div>
                      <span className="whitespace-nowrap text-sm font-semibold text-gray-900">{cleaner.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="text-sm font-bold text-gray-900">{cleaner.jobs}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="text-sm font-bold text-gray-900">{formatZAR(cleaner.revenue)}</span>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-gray-900">{cleaner.rating || '—'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex min-w-[100px] items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${cleaner.pct}%`, backgroundColor: cleaner.color }}
                        />
                      </div>
                      <span className="text-[10px] font-medium text-gray-500">{cleaner.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-gray-900">Booking Volume</h2>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                formatter={(value) => [value, 'Bookings']}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                }}
              />
              <Bar dataKey="bookings" fill="#7C3AED" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};

// --- SETTINGS PAGE ---

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [paystackKey, setPaystackKey] = useState('pk_live_••••••••••••••••••••••••');
  const [zohoToken, setZohoToken] = useState('••••••••••••••••••••••••••••••••');
  const [resendKey, setResendKey] = useState('re_••••••••••••••••••••••••');
  const [emailFrom, setEmailFrom] = useState('bookings@shalean.co.za');
  const [notifications, setNotifications] = useState({
    newBooking: true,
    paymentReceived: true,
    cleanerAssigned: false,
    dailySummary: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const SETTINGS_TABS = [
    { id: 'profile', label: 'Profile', icon: <User className="h-3.5 w-3.5" /> },
    { id: 'paystack', label: 'Paystack', icon: <CreditCard className="h-3.5 w-3.5" /> },
    { id: 'zoho', label: 'Zoho Books', icon: <Building className="h-3.5 w-3.5" /> },
    { id: 'email', label: 'Email', icon: <Mail className="h-3.5 w-3.5" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="h-3.5 w-3.5" /> },
    { id: 'security', label: 'Security', icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  ];

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your admin platform" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="h-fit rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
          <nav aria-label="Settings navigation">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all',
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span className={activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="mb-0.5 text-sm font-extrabold text-gray-900">Admin Profile</h3>
                  <p className="text-xs text-gray-400">Update your personal information and business details</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 text-xl font-bold text-white">
                    SA
                  </div>
                  <div>
                    <button type="button" className="text-xs font-bold text-indigo-600 hover:underline">
                      Change photo
                    </button>
                    <p className="mt-0.5 text-[10px] text-gray-400">JPG, PNG up to 2MB</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { label: 'Business Name', value: 'Shalean Cleaning Services', type: 'text' as const },
                    { label: 'Admin Name', value: 'Shalean Admin', type: 'text' as const },
                    { label: 'Email', value: 'bookings@shalean.co.za', type: 'email' as const },
                    { label: 'Phone', value: '+27 21 000 0000', type: 'tel' as const },
                    { label: 'City', value: 'Cape Town', type: 'text' as const },
                    { label: 'Website', value: 'www.shalean.co.za', type: 'url' as const },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="mb-1.5 block text-xs font-bold text-gray-700">
                        <span>{field.label}</span>
                      </label>
                      <input
                        type={field.type}
                        defaultValue={field.value}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'paystack' && (
              <motion.div
                key="paystack"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="mb-0.5 text-sm font-extrabold text-gray-900">Paystack Configuration</h3>
                  <p className="text-xs text-gray-400">Connect your Paystack account to process payments</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <div>
                    <p className="text-xs font-bold text-green-800">Connected to Paystack</p>
                    <p className="text-[10px] text-green-600">Live mode · Last verified 20 Jun 2025</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Public Key', value: paystackKey, onChange: setPaystackKey },
                    {
                      label: 'Secret Key (encrypted)',
                      value: '••••••••••••••••••••••••••••••••',
                      onChange: () => {},
                    },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="mb-1.5 block text-xs font-bold text-gray-700">
                        <span>{field.label}</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm text-gray-700 outline-none transition-all focus:border-indigo-400"
                        />
                        <button
                          type="button"
                          className="rounded-xl bg-gray-100 p-2.5 text-gray-500 transition-colors hover:bg-gray-200"
                          aria-label="Copy key"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-gray-700">
                      <span>Webhook URL</span>
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <Globe className="h-3.5 w-3.5 text-gray-400" />
                      <code className="font-mono text-xs text-gray-600">https://shalean.co.za/api/payments/verify</code>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'zoho' && (
              <motion.div
                key="zoho"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="mb-0.5 text-sm font-extrabold text-gray-900">Zoho Books Integration</h3>
                  <p className="text-xs text-gray-400">Auto-create invoices when bookings are confirmed and paid</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">Token expires in 12 days</p>
                    <p className="text-[10px] text-amber-600">Refresh your Zoho OAuth token to avoid disruption</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Organization ID', value: '20095842' },
                    { label: 'Client ID', value: '1000.XXXXXXXXXXXXXXXX' },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="mb-1.5 block text-xs font-bold text-gray-700">
                        <span>{field.label}</span>
                      </label>
                      <input
                        type="text"
                        defaultValue={field.value}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm text-gray-700 outline-none transition-all focus:border-indigo-400"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-gray-700">
                      <span>Access Token</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={zohoToken}
                        onChange={(e) => setZohoToken(e.target.value)}
                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm text-gray-700 outline-none transition-all focus:border-indigo-400"
                      />
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="mb-0.5 text-sm font-extrabold text-gray-900">Email Configuration (Resend)</h3>
                  <p className="text-xs text-gray-400">Configure transactional emails via Resend</p>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
                  <div>
                    <p className="text-xs font-bold text-green-800">Resend connected</p>
                    <p className="text-[10px] text-green-600">1,842 emails sent this month</p>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    <span>API Key</span>
                  </label>
                  <input
                    type="text"
                    value={resendKey}
                    onChange={(e) => setResendKey(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 font-mono text-sm text-gray-700 outline-none transition-all focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-gray-700">
                    <span>From Address</span>
                  </label>
                  <input
                    type="email"
                    value={emailFrom}
                    onChange={(e) => setEmailFrom(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400"
                  />
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold text-gray-700">Email Templates</p>
                  <div className="space-y-2">
                    {['Booking Confirmation', 'Quote Email', 'Invoice Email', 'Cancellation Notice'].map((tmpl) => (
                      <div key={tmpl} className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-700">{tmpl}</p>
                        <button type="button" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">
                          <Edit3 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="mb-0.5 text-sm font-extrabold text-gray-900">Notification Preferences</h3>
                  <p className="text-xs text-gray-400">Choose when and how you receive admin alerts</p>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'newBooking' as const, label: 'New Booking', desc: 'Notify when a new booking is created' },
                    { key: 'paymentReceived' as const, label: 'Payment Received', desc: 'Notify when a payment is confirmed via Paystack' },
                    { key: 'cleanerAssigned' as const, label: 'Cleaner Assigned', desc: 'Notify when a cleaner is assigned to a booking' },
                    { key: 'dailySummary' as const, label: 'Daily Summary', desc: 'Receive a morning digest of upcoming bookings' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-4 rounded-xl bg-gray-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key],
                          }))
                        }
                        className={cn(
                          'relative flex h-6 w-11 flex-shrink-0 rounded-full transition-all',
                          notifications[item.key] ? 'bg-indigo-600' : 'bg-gray-300'
                        )}
                        role="switch"
                        aria-checked={notifications[item.key]}
                        aria-label={`Toggle ${item.label}`}
                      >
                        <span
                          className={cn(
                            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all',
                            notifications[item.key] ? 'left-6' : 'left-0.5'
                          )}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-5"
              >
                <div>
                  <h3 className="mb-0.5 text-sm font-extrabold text-gray-900">Security</h3>
                  <p className="text-xs text-gray-400">Manage access credentials and authentication</p>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Current Password', placeholder: '••••••••' },
                    { label: 'New Password', placeholder: '••••••••' },
                    { label: 'Confirm New Password', placeholder: '••••••••' },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="mb-1.5 block text-xs font-bold text-gray-700">
                        <span>{field.label}</span>
                      </label>
                      <input
                        type="password"
                        placeholder={field.placeholder}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none transition-all focus:border-indigo-400"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <ShieldCheck className="h-5 w-5 flex-shrink-0 text-indigo-600" />
                  <div>
                    <p className="text-xs font-bold text-indigo-800">Two-Factor Authentication</p>
                    <p className="text-[10px] text-indigo-600">Not enabled · Strongly recommended for admin accounts</p>
                  </div>
                  <button
                    type="button"
                    className="ml-auto flex-shrink-0 rounded-xl bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-200"
                  >
                    Enable
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
            <AnimatePresence>
              {saved && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Changes saved!</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              type="button"
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-shadow hover:shadow-lg"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

