'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase-client';
import { getBookingPipelineLabel } from '@/lib/booking-status-labels';
import type {
  Booking,
  FaqItem,
  PageId,
  PaymentRow,
  PointsHistoryItem,
  SavedAddress,
  StatItem,
  TierRow,
} from './types';

export interface PortalNotification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface PortalUser {
  email: string;
  name: string;
  initial: string;
  phone: string;
  referralCode: string;
  rewardTier: string;
  rewardPoints: number;
  rewardTarget: number;
  rewardProgress: number;
}

type PortalValue = {
  user: PortalUser;
  notifications: PortalNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  bookings: Booking[];
  bookingsLoading: boolean;
  payments: PaymentRow[];
  cancelBooking: (id: string) => Promise<void>;
  rateBooking: (id: string, rating: number) => void;
  rescheduleBooking: (id: string, newDate: string, newTime: string, newCleaner?: string) => Promise<void>;
  stats: StatItem[];
  statsLoading: boolean;
  pointsHistory: PointsHistoryItem[];
  tiers: TierRow[];
  faqs: FaqItem[];
  redeemPoints: (cost: number, description: string) => void;
  addresses: SavedAddress[];
  saveUser: (updates: { name: string; phone: string }) => Promise<void>;
  profileSaving: boolean;
  profileSaved: boolean;
  toggleDefaultAddress: (id: string) => void;
  addAddress: (label: string, address: string) => void;
};

const PortalContext = createContext<PortalValue | null>(null);

const STATIC_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'How do I reschedule a booking?',
    answer:
      'Open My Bookings, tap the menu on a booking, and choose Reschedule. Pick a new date, time, and cleaner if needed.',
  },
  {
    id: 'faq-2',
    question: 'What is your cancellation policy?',
    answer:
      'You can cancel from My Bookings. Cancellations within 24 hours of the visit may incur a fee depending on your booking.',
  },
  {
    id: 'faq-3',
    question: 'How do rewards points work?',
    answer:
      'You earn points on completed cleans. Redeem them in Rewards for discounts on future bookings.',
  },
];

const STATIC_TIERS: TierRow[] = [
  {
    id: 'tier-bronze',
    name: 'Bronze',
    minPoints: 0,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  {
    id: 'tier-silver',
    name: 'Silver',
    minPoints: 500,
    color: 'text-slate-700',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
  },
  {
    id: 'tier-gold',
    name: 'Gold',
    minPoints: 1500,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
];

function mapApiNotifications(rows: unknown): PortalNotification[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row: Record<string, unknown>, i) => ({
    id: String(row.id ?? `n-${i}`),
    title: String(row.title ?? 'Notification'),
    body: String(row.body ?? row.message ?? ''),
    time: String(row.time ?? row.created_at ?? ''),
    read: Boolean(row.read ?? row.is_read),
  }));
}

function formatDisplayDate(isoDate: string): string {
  try {
    const d = new Date(isoDate + 'T12:00:00');
    return d.toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function formatDisplayTime(t: string | null | undefined): string {
  if (!t) return '';
  const parts = String(t).split(':');
  const h = parseInt(parts[0] || '0', 10);
  const m = (parts[1] || '00').slice(0, 2);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.padStart(2, '0')} ${ampm}`;
}

function formatPaymentDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function buildPointsHistory(pts: number): PointsHistoryItem[] {
  if (pts <= 0) {
    return [
      {
        id: 'ph-start',
        description: 'Complete a booking to start earning points',
        date: '—',
        points: 0,
        type: 'earned',
      },
    ];
  }
  return [
    {
      id: 'ph-balance',
      description: 'Rewards balance',
      date: new Date().toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      points: pts,
      type: 'earned',
    },
  ];
}

type ApiPaymentRow = {
  id: string;
  date: string;
  amount: number;
  reference?: string | null;
  status: 'paid' | 'pending';
};

function mapApiPayment(p: ApiPaymentRow, serviceById: Map<string, string>): PaymentRow {
  const ref = p.reference ? String(p.reference).replace(/[^a-zA-Z0-9]/g, '') : '';
  const invoiceId = ref
    ? `INV-${ref.slice(0, 14).toUpperCase()}`
    : `INV-${p.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  const zar = Math.round((Number(p.amount) || 0) / 100);
  return {
    id: p.id,
    service: serviceById.get(p.id) ?? 'Cleaning service',
    date: formatPaymentDate(p.date),
    amount: `R${zar}`,
    invoiceId,
    status: p.status === 'paid' ? 'paid' : 'pending',
  };
}

function formatServiceLabel(raw: string | null | undefined): string {
  if (!raw) return 'Cleaning';
  return raw
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function mapDbStatus(status: string | null | undefined): Booking['status'] {
  const s = (status || '').toLowerCase();
  if (s === 'cancelled' || s === 'canceled' || s === 'declined') return 'cancelled';
  if (s === 'completed') return 'completed';
  return 'upcoming';
}

function cleanerFromId(cleanerId: string | null | undefined): { name: string; initial: string } {
  if (!cleanerId) return { name: 'Cleaner', initial: 'C' };
  const c = cleanerId.replace(/-/g, '').slice(-2).toUpperCase() || 'C';
  return { name: 'Your cleaner', initial: c.slice(0, 1) };
}

type ApiBooking = {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  status: string;
  total_amount: number | null;
  address_line1: string | null;
  address_suburb: string | null;
  address_city: string | null;
  cleaner_id: string | null;
  customer_reviewed?: boolean | null;
  payment_reference?: string | null;
  paystack_ref?: string | null;
  zoho_invoice_id?: string | null;
  cleaner_profile?: { name: string; phone: string | null } | null;
};

function mapApiBooking(b: ApiBooking): Booking {
  const uiStatus = mapDbStatus(b.status);
  const fromProfile = b.cleaner_profile;
  const fallback = cleanerFromId(b.cleaner_id);
  const name = fromProfile?.name?.trim() || fallback.name;
  const initial = name.trim().charAt(0).toUpperCase() || fallback.initial;
  const address = [b.address_line1, b.address_suburb, b.address_city].filter(Boolean).join(', ') || 'Address on file';
  const amount =
    typeof b.total_amount === 'number'
      ? Math.round(b.total_amount / 100)
      : Math.round(Number(b.total_amount) || 0);
  const reviewed = Boolean(b.customer_reviewed);
  const payRef = (b.paystack_ref || b.payment_reference || '').toString();
  const ref = payRef.replace(/[^a-zA-Z0-9]/g, '');
  const zoho = b.zoho_invoice_id?.trim();
  const invoiceId = zoho
    ? zoho.startsWith('INV')
      ? zoho
      : `INV-${zoho}`
    : ref
      ? `INV-${ref.slice(0, 14).toUpperCase()}`
      : `INV-${b.id.replace(/-/g, '').slice(0, 10).toUpperCase()}`;
  return {
    id: b.id,
    service: formatServiceLabel(b.service_type),
    cleaner: name,
    cleanerInitial: initial,
    cleanerPhone: fromProfile?.phone ?? null,
    date: formatDisplayDate(b.booking_date),
    time: formatDisplayTime(b.booking_time),
    address,
    status: uiStatus,
    dbStatus: b.status,
    pipelineStatus: getBookingPipelineLabel(b.status),
    price: `R${amount}`,
    priceNumber: amount,
    invoiceId,
    zohoInvoiceId: zoho || null,
    rating: uiStatus === 'completed' && reviewed ? 5 : undefined,
  };
}

/** Shape matches `GET /api/dashboard/bookings` → `customer` */
type ApiCustomer = {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressSuburb?: string | null;
  addressCity?: string | null;
  totalBookings?: number | null;
  rewardsPoints?: number | null;
};

function buildStats(customer: ApiCustomer | null): StatItem[] {
  const total = customer?.totalBookings ?? 0;
  const pts = customer?.rewardsPoints ?? 0;
  return [
    {
      id: 'stat-bookings',
      label: 'Total Bookings',
      value: total,
      suffix: '',
      color: 'text-blue-600',
    },
    {
      id: 'stat-hours',
      label: 'Hours Cleaned',
      value: Math.max(0, Math.round(total * 2.5)),
      suffix: 'h',
      color: 'text-indigo-600',
    },
    {
      id: 'stat-rewards',
      label: 'Reward Points',
      value: pts,
      suffix: 'pts',
      color: 'text-amber-500',
    },
  ];
}

function rewardMeta(customer: ApiCustomer | null) {
  const pts = customer?.rewardsPoints ?? 0;
  const target = 500;
  const tier = pts >= target ? 'Silver' : 'Bronze';
  return {
    referralCode: customer?.id ? `SHL-${customer.id.replace(/-/g, '').slice(0, 8).toUpperCase()}` : 'SHL-REFERRAL',
    rewardTier: tier,
    rewardPoints: pts,
    rewardTarget: target,
    rewardProgress: Math.min(100, Math.round((pts / target) * 100)),
  };
}

export function useCounter(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const start = performance.now();
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export function CustomerPortalProvider({
  email,
  firstName,
  lastName,
  children,
}: {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  children: React.ReactNode;
}) {
  const baseUser = useMemo((): Omit<PortalUser, 'referralCode' | 'rewardTier' | 'rewardPoints' | 'rewardTarget' | 'rewardProgress'> => {
    const em = email?.trim() || '';
    const fn = firstName?.trim();
    const ln = lastName?.trim();
    const name = [fn, ln].filter(Boolean).join(' ') || 'Account';
    const initial = fn?.[0]?.toUpperCase() ?? em?.[0]?.toUpperCase() ?? 'U';
    return { email: em || 'you@example.com', name, initial, phone: '' };
  }, [email, firstName, lastName]);

  const [rewardExtras, setRewardExtras] = useState(() => rewardMeta(null));
  const [userBase, setUserBase] = useState(baseUser);
  useEffect(() => {
    setUserBase((prev) => ({
      ...baseUser,
      phone: prev.phone,
    }));
  }, [baseUser]);

  const user = useMemo(
    (): PortalUser => ({
      ...userBase,
      ...rewardExtras,
    }),
    [userBase, rewardExtras]
  );

  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [stats, setStats] = useState<StatItem[]>(() => buildStats(null));
  const [statsLoading, setStatsLoading] = useState(true);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>(() => buildPointsHistory(0));
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [portalCustomerId, setPortalCustomerId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setBookingsLoading(true);
    setStatsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setBookings([]);
        setPayments([]);
        setStats(buildStats(null));
        setRewardExtras(rewardMeta(null));
        setPointsHistory(buildPointsHistory(0));
        setAddresses([]);
        setPortalCustomerId(null);
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      const [bookRes, statsRes, payRes] = await Promise.all([
        fetch('/api/dashboard/bookings?limit=50', { headers }),
        fetch('/api/dashboard/stats', { headers }),
        fetch('/api/dashboard/payments', { headers }),
      ]);

      const bookJson = await bookRes.json();
      await statsRes.json();

      const apiCustomer = bookJson?.customer as ApiCustomer | null | undefined;
      setPortalCustomerId(apiCustomer?.id ?? null);
      if (apiCustomer) {
        setRewardExtras(rewardMeta(apiCustomer));
        const fn = apiCustomer.firstName?.trim();
        const ln = apiCustomer.lastName?.trim();
        setUserBase((prev) => ({
          ...prev,
          email: apiCustomer.email?.trim() || prev.email,
          name: [fn, ln].filter(Boolean).join(' ') || prev.name,
          initial: (fn?.[0] || ln?.[0] || prev.email?.[0] || prev.name?.[0] || 'U').toUpperCase(),
          phone: (apiCustomer.phone || '').trim() || prev.phone,
        }));
        const addrLine = [apiCustomer.addressLine1, apiCustomer.addressSuburb, apiCustomer.addressCity]
          .filter(Boolean)
          .join(', ');
        if (addrLine) {
          setAddresses([
            {
              id: 'addr-primary',
              label: 'Home',
              address: addrLine,
              isDefault: true,
            },
          ]);
        } else {
          setAddresses([]);
        }
        setPointsHistory(buildPointsHistory(apiCustomer.rewardsPoints ?? 0));
      } else {
        setRewardExtras(rewardMeta(null));
        setPointsHistory(buildPointsHistory(0));
        setAddresses([]);
      }

      const rows = Array.isArray(bookJson?.bookings) ? bookJson.bookings : [];
      const mappedBookings: Booking[] = rows.map((b: ApiBooking) => mapApiBooking(b));
      setBookings(mappedBookings);

      const serviceById = new Map(mappedBookings.map((b: Booking) => [b.id, b.service]));

      let payJson: { recentPayments?: ApiPaymentRow[] } = {};
      try {
        payJson = await payRes.json();
      } catch {
        payJson = {};
      }
      const recent = Array.isArray(payJson?.recentPayments) ? payJson.recentPayments : [];
      setPayments(recent.map((p: ApiPaymentRow) => mapApiPayment(p, serviceById)));

      setStats(buildStats(apiCustomer ?? null));
    } catch {
      toast.error('Could not load dashboard data');
      setBookings([]);
      setPayments([]);
    } finally {
      setBookingsLoading(false);
      setStatsLoading(false);
    }
  }, []);

  const loadDashboardRef = useRef(loadDashboard);
  loadDashboardRef.current = loadDashboard;

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (!portalCustomerId) return;

    // Unique name per subscription — reusing the same name after subscribe() can make
    // supabase-js return an already-joined channel (Strict Mode / fast remount), and
    // adding postgres_changes listeners then throws.
    const instanceId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const channel = supabase
      .channel(`customer-bookings-${portalCustomerId}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `customer_id=eq.${portalCustomerId}`,
        },
        () => {
          loadDashboardRef.current();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [portalCustomerId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;

        const res = await fetch('/api/dashboard/notifications', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (!json?.ok || !Array.isArray(json.notifications) || json.notifications.length === 0) {
          return;
        }
        if (!cancelled) {
          setNotifications(mapApiNotifications(json.notifications));
        }
      } catch {
        /* keep demo */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const cancelBooking = useCallback(async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error('Please sign in again');
        return;
      }
      const res = await fetch(`/api/dashboard/bookings/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!json?.ok) {
        toast.error(json?.error || 'Could not cancel booking');
        return;
      }
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                status: 'cancelled' as const,
                dbStatus: 'cancelled',
                pipelineStatus: getBookingPipelineLabel('cancelled'),
              }
            : b
        )
      );
      toast.success('Booking cancelled');
    } catch {
      toast.error('Could not cancel booking');
    }
  }, []);

  const rateBooking = useCallback((id: string, rating: number) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, rating } : b))
    );
    toast.success('Thanks for your review!');
  }, []);

  const rescheduleBooking = useCallback(
    async (id: string, newDate: string, newTime: string, newCleaner?: string) => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          toast.error('Please sign in again');
          return;
        }
        const res = await fetch('/api/dashboard/reschedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bookingId: id, date: newDate, time: newTime }),
        });
        const json = await res.json();
        if (!json?.ok) {
          toast.error(json?.error || 'Could not reschedule');
          return;
        }
        setBookings((prev) =>
          prev.map((b) => {
            if (b.id !== id) return b;
            const useNewCleaner =
              newCleaner &&
              !newCleaner.toLowerCase().includes('any available');
            const nextCleaner = useNewCleaner ? newCleaner : b.cleaner;
            const initial = nextCleaner.trim().charAt(0).toUpperCase() || b.cleanerInitial;
            return {
              ...b,
              date: formatDisplayDate(newDate),
              time: formatDisplayTime(newTime),
              cleaner: nextCleaner,
              cleanerInitial: initial,
            };
          })
        );
        toast.success('Booking rescheduled');
      } catch {
        toast.error('Could not reschedule');
      }
    },
    []
  );

  const redeemPoints = useCallback((cost: number, description: string) => {
    setRewardExtras((prev) => {
      const nextPts = Math.max(0, prev.rewardPoints - cost);
      const target = prev.rewardTarget;
      return {
        ...prev,
        rewardPoints: nextPts,
        rewardTier: nextPts >= target ? 'Silver' : 'Bronze',
        rewardProgress: Math.min(100, Math.round((nextPts / target) * 100)),
      };
    });
    setPointsHistory((h) => [
      {
        id: `ph-${Date.now()}`,
        description,
        date: new Date().toLocaleDateString('en-ZA', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        points: cost,
        type: 'redeemed',
      },
      ...h,
    ]);
    toast.success('Reward redeemed');
  }, []);

  const saveUser = useCallback(async (updates: { name: string; phone: string }) => {
    setProfileSaving(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        toast.error('Please sign in again');
        return;
      }
      const res = await fetch('/api/dashboard/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName: updates.name.trim(),
          phone: updates.phone.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!json?.ok) {
        toast.error(json?.error || 'Could not save profile');
        return;
      }
      const c = json.customer as {
        firstName?: string | null;
        lastName?: string | null;
        phone?: string | null;
      } | null;
      setUserBase((prev) => ({
        ...prev,
        name: updates.name.trim() || prev.name,
        phone: (c?.phone ?? updates.phone).trim() || prev.phone,
        initial: String(c?.firstName?.[0] || c?.lastName?.[0] || prev.initial || 'U').toUpperCase(),
      }));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3500);
      toast.success('Profile saved');
    } finally {
      setProfileSaving(false);
    }
  }, []);

  const toggleDefaultAddress = useCallback((id: string) => {
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  }, []);

  const addAddress = useCallback((label: string, address: string) => {
    setAddresses((prev) => {
      const next: SavedAddress = {
        id: `addr-${Date.now()}`,
        label,
        address,
        isDefault: prev.length === 0,
      };
      if (next.isDefault) {
        return [...prev.map((a) => ({ ...a, isDefault: false })), next];
      }
      return [...prev, next];
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      notifications,
      markRead,
      markAllRead,
      bookings,
      bookingsLoading,
      payments,
      cancelBooking,
      rateBooking,
      rescheduleBooking,
      stats,
      statsLoading,
      pointsHistory,
      tiers: STATIC_TIERS,
      faqs: STATIC_FAQS,
      redeemPoints,
      addresses,
      saveUser,
      profileSaving,
      profileSaved,
      toggleDefaultAddress,
      addAddress,
    }),
    [
      user,
      notifications,
      markRead,
      markAllRead,
      bookings,
      bookingsLoading,
      payments,
      cancelBooking,
      rateBooking,
      rescheduleBooking,
      stats,
      statsLoading,
      pointsHistory,
      redeemPoints,
      addresses,
      saveUser,
      profileSaving,
      profileSaved,
      toggleDefaultAddress,
      addAddress,
    ]
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('CustomerPortalProvider is required for useProfile');
  }
  return {
    user: ctx.user,
    addresses: ctx.addresses,
    saveUser: ctx.saveUser,
    saving: ctx.profileSaving,
    saved: ctx.profileSaved,
    toggleDefaultAddress: ctx.toggleDefaultAddress,
    addAddress: ctx.addAddress,
  };
}

export function useNotifications() {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('CustomerPortalProvider is required for useNotifications');
  }
  return {
    notifications: ctx.notifications,
    markRead: ctx.markRead,
    markAllRead: ctx.markAllRead,
  };
}

export function useBookings() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('CustomerPortalProvider is required for useBookings');
  return {
    bookings: ctx.bookings,
    loading: ctx.bookingsLoading,
    cancelBooking: ctx.cancelBooking,
    rateBooking: ctx.rateBooking,
    rescheduleBooking: ctx.rescheduleBooking,
  };
}

export function useStats() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('CustomerPortalProvider is required for useStats');
  return {
    stats: ctx.stats,
    loading: ctx.statsLoading,
  };
}

export function usePayments() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('CustomerPortalProvider is required for usePayments');
  return {
    payments: ctx.payments,
    loading: ctx.bookingsLoading,
  };
}

export function useRewards() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('CustomerPortalProvider is required for useRewards');
  return {
    pointsHistory: ctx.pointsHistory,
    tiers: ctx.tiers,
    redeemPoints: ctx.redeemPoints,
  };
}

export function useFaqs() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('CustomerPortalProvider is required for useFaqs');
  return { faqs: ctx.faqs };
}

export function useQuickActions() {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('CustomerPortalProvider is required for useQuickActions');
  }
  const upcomingCount = ctx.bookings.filter((b) => b.status === 'upcoming').length;
  const pts = ctx.user.rewardPoints;
  return useMemo(
    () => ({
      actions: [
        {
          id: 'qa-upcoming',
          label: 'Upcoming',
          sublabel: upcomingCount === 0 ? 'None scheduled' : upcomingCount === 1 ? '1 booking' : `${upcomingCount} bookings`,
          page: 'bookings' as PageId,
          bgClass: 'bg-blue-50',
          colorClass: 'text-blue-600',
        },
        {
          id: 'qa-book',
          label: 'Book Again',
          sublabel: 'New booking',
          page: 'book' as PageId,
          bgClass: 'bg-indigo-50',
          colorClass: 'text-indigo-600',
        },
        {
          id: 'qa-rewards',
          label: 'Rewards',
          sublabel: `${pts} pts`,
          page: 'rewards' as PageId,
          bgClass: 'bg-amber-50',
          colorClass: 'text-amber-600',
        },
      ],
    }),
    [upcomingCount, pts]
  );
}
