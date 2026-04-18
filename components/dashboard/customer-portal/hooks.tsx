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
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { mutate as globalMutate } from 'swr';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useOffline } from '@/lib/hooks/use-offline';
import { offlineQueue } from '@/lib/utils/offline-queue';
import { getBookingPipelineLabel } from '@/lib/booking-status-labels';
import {
  isCancelledBooking,
  isCompletedBooking,
  isUpcomingBooking,
  normalizeCustomerFacingStatus,
} from '@/shared/dashboard-data';
import { getBookingRevenueCents } from '@/shared/finance-engine';
import { normalizeBookingTimeToSlotId } from '@/lib/booking-time-slots';
import { BOOKING_DEFAULT_CITY } from '@/lib/contact';
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
  /** DB customer id — used for referral signup links. */
  customerId: string | null;
  /** Populated only when `customers.referral_code` exists (see dashboard API). */
  referralCode: string | null;
  /** True when a real referral code is available — no synthetic codes. */
  referralEnabled: boolean;
  rewardTier: string | null;
  rewardPoints: number;
  /** Points threshold for the next tier when a tier ladder is configured. */
  rewardTarget: number | null;
  rewardProgress: number | null;
  /** Name of the next tier (null if already at the highest). */
  nextTierName: string | null;
  /** When true, show tier ladder / progress UI (requires backend tier data). */
  rewardsProgressEnabled: boolean;
}

/** Structured address from `customers` — used for checkout payloads (matches public booking engine). */
export type CustomerAddressParts = {
  line1: string;
  suburb: string;
  city: string;
};

type PortalValue = {
  user: PortalUser;
  notifications: PortalNotification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
  bookings: Booking[];
  bookingsLoading: boolean;
  payments: PaymentRow[];
  paymentsLoading: boolean;
  cancelBooking: (id: string) => Promise<void>;
  rateBooking: (
    id: string,
    payload: {
      overallRating: number;
      qualityRating: number;
      punctualityRating: number;
      professionalismRating: number;
      reviewText?: string;
    }
  ) => Promise<void>;
  rescheduleBooking: (
    id: string,
    newDate: string,
    newTime: string,
    cleanerId: string | null,
    teamName: string | null
  ) => Promise<void>;
  stats: StatItem[];
  statsLoading: boolean;
  refreshDashboard: () => Promise<void>;
  pointsHistory: PointsHistoryItem[];
  faqs: FaqItem[];
  addresses: SavedAddress[];
  saveUser: (updates: { name: string; phone: string }) => Promise<void>;
  profileSaving: boolean;
  profileSaved: boolean;
  toggleDefaultAddress: (id: string) => void;
  addAddress: (label: string, address: string) => void;
  customerAddressParts: CustomerAddressParts | null;
  /** Server KPIs — same as GET /api/dashboard/stats (single source of truth). */
  dashboardStats: DashboardStatsPayload | null;
  loadMoreBookings: () => void;
  hasMoreBookings: boolean;
  bookingsLoadingMore: boolean;
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
      'You earn points on completed cleans. Points are tracked on your profile when the job is marked complete.',
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
  if (pts <= 0) return [];
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

/** Future (or today) non-terminal bookings — aligns stats, tabs, and quick actions. */
export function isCustomerUpcomingBooking(b: Pick<Booking, 'dbStatus' | 'bookingDateIso'>): boolean {
  return isUpcomingBooking({ dbStatus: b.dbStatus, bookingDateIso: b.bookingDateIso });
}

export function sortBookingsByDateDesc(bookings: Booking[]): Booking[] {
  return [...bookings].sort((a, b) => {
    const da = a.bookingDateIso ?? '';
    const db = b.bookingDateIso ?? '';
    if (da !== db) return db.localeCompare(da);
    return b.id.localeCompare(a.id);
  });
}

function cleanerFromId(cleanerId: string | null | undefined): { name: string; initial: string } {
  if (!cleanerId) return { name: 'Cleaner', initial: 'C' };
  const c = cleanerId.replace(/-/g, '').slice(-2).toUpperCase() || 'C';
  return { name: 'Your cleaner', initial: c.slice(0, 1) };
}

function extraRoomsFromExtrasQuantities(q: unknown): number | null {
  if (!q || typeof q !== 'object') return null;
  let sum = 0;
  for (const [k, v] of Object.entries(q as Record<string, unknown>)) {
    if (typeof v !== 'number' || v <= 0) continue;
    if (/extra\s*room/i.test(k)) sum += v;
  }
  return sum > 0 ? sum : null;
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
  review_overall_rating?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  extras?: unknown;
  extras_quantities?: unknown;
  price_snapshot?: unknown;
  requires_team?: boolean | null;
  duration_minutes?: number | null;
  booking_teams?: { team_name: string | null }[] | null;
};

function parseExtrasIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}

function parseExtrasQuantitiesRecord(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
  }
  return out;
}

function parseTeamNameFromRow(b: ApiBooking): string | null {
  const bt = b.booking_teams;
  if (Array.isArray(bt) && bt[0]?.team_name) return String(bt[0].team_name);
  return null;
}

function buildRoomSummary(b: ApiBooking): string | null {
  const snap = b.price_snapshot as Record<string, unknown> | null | undefined;
  const svc = snap?.service as { bedrooms?: number; bathrooms?: number } | undefined;
  const br =
    typeof b.bedrooms === 'number'
      ? b.bedrooms
      : typeof svc?.bedrooms === 'number'
        ? svc.bedrooms
        : null;
  const ba =
    typeof b.bathrooms === 'number'
      ? b.bathrooms
      : typeof svc?.bathrooms === 'number'
        ? svc.bathrooms
        : null;
  const qtyRaw =
    (b.extras_quantities as Record<string, unknown> | null | undefined) ??
    (snap?.extras_quantities as Record<string, unknown> | undefined);
  const extraRm = extraRoomsFromExtrasQuantities(qtyRaw);
  const st = (b.service_type || '').toLowerCase();
  const isCarpet = st.includes('carpet');
  const parts: string[] = [];
  if (br != null && br > 0) {
    parts.push(isCarpet ? `${br} fitted` : `${br} bed`);
  }
  if (ba != null && ba > 0) {
    parts.push(isCarpet ? `${ba} loose` : `${ba} bath`);
  }
  if (extraRm != null && extraRm > 0) {
    parts.push(`${extraRm} extra room${extraRm === 1 ? '' : 's'}`);
  }
  if (parts.length === 0) return null;
  return parts.join(' · ');
}

function mapApiBooking(b: ApiBooking): Booking {
  const uiStatus = normalizeCustomerFacingStatus(b.status);
  const fromProfile = b.cleaner_profile;
  const fallback = cleanerFromId(b.cleaner_id);
  const name = fromProfile?.name?.trim() || fallback.name;
  const initial = name.trim().charAt(0).toUpperCase() || fallback.initial;
  const address = [b.address_line1, b.address_suburb, b.address_city].filter(Boolean).join(', ') || 'Address on file';
  const amount = Math.round(getBookingRevenueCents(b) / 100);
  const reviewed = Boolean(b.customer_reviewed);
  const rawRating = b.review_overall_rating;
  const stars =
    typeof rawRating === 'number' && !Number.isNaN(rawRating)
      ? Math.min(5, Math.max(1, Math.round(rawRating)))
      : undefined;
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
  const snap = b.price_snapshot as Record<string, unknown> | null | undefined;
  const snapExtras = snap?.extras as unknown;
  const extrasIds =
    parseExtrasIds(b.extras).length > 0 ? parseExtrasIds(b.extras) : parseExtrasIds(snapExtras);
  const extrasQuantities =
    Object.keys(parseExtrasQuantitiesRecord(b.extras_quantities)).length > 0
      ? parseExtrasQuantitiesRecord(b.extras_quantities)
      : parseExtrasQuantitiesRecord(snap?.extras_quantities);
  return {
    id: b.id,
    bookingDateIso: b.booking_date,
    bookingTimeSlotId: normalizeBookingTimeToSlotId(b.booking_time) || b.booking_time,
    service: formatServiceLabel(b.service_type),
    serviceTypeRaw: b.service_type,
    cleaner: name,
    cleanerInitial: initial,
    cleanerId: b.cleaner_id,
    requiresTeam: Boolean(b.requires_team),
    teamName: parseTeamNameFromRow(b),
    extrasIds,
    extrasQuantities,
    bedrooms: typeof b.bedrooms === 'number' ? b.bedrooms : null,
    bathrooms: typeof b.bathrooms === 'number' ? b.bathrooms : null,
    durationMinutes:
      typeof b.duration_minutes === 'number' && b.duration_minutes >= 30 ? b.duration_minutes : null,
    cleanerPhone: fromProfile?.phone ?? null,
    date: formatDisplayDate(b.booking_date),
    time: formatDisplayTime(b.booking_time),
    address,
    status: uiStatus,
    dbStatus: b.status,
    pipelineStatus: getBookingPipelineLabel(b.status),
    roomSummary: buildRoomSummary(b),
    price: `R${amount}`,
    priceNumber: amount,
    invoiceId,
    zohoInvoiceId: zoho || null,
    customerReviewed: reviewed,
    rating: isCompletedBooking(b.status) && reviewed && stars !== undefined ? stars : undefined,
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
  /** When present on the customer row, enables referral copy UI. */
  referralCode?: string | null;
};

/** Mirrors `GET /api/dashboard/stats` → `stats` (server is source of truth). */
export type DashboardStatsPayload = {
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  activePlans: number;
  rewardPoints: number;
  lastCleaningCompleted: string | null;
  balanceDue: number;
};

const BOOKINGS_PAGE_SIZE = 20;
const SWR_STATS_KEY = 'dashboard-stats';
const SWR_BOOKINGS_PREFIX = 'dashboard-bookings';

type DashboardBookingsPageResponse = {
  ok: boolean;
  error?: string;
  bookings: ApiBooking[];
  customer: ApiCustomer | null;
  pagination?: { limit: number; offset: number; totalCount: number; hasMore: boolean };
};

async function fetchDashboardStats(): Promise<{ ok: true; stats: DashboardStatsPayload }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('UNAUTH');
  const res = await fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } });
  const json = (await res.json()) as { ok?: boolean; stats?: DashboardStatsPayload; error?: string };
  if (!res.ok || !json?.ok || !json.stats) {
    throw new Error(json?.error || 'Stats failed');
  }
  return { ok: true, stats: json.stats };
}

async function fetchBookingsPage(offset: number): Promise<DashboardBookingsPageResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('UNAUTH');
  const res = await fetch(
    `/api/dashboard/bookings?limit=${BOOKINGS_PAGE_SIZE}&offset=${offset}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  let json: DashboardBookingsPageResponse;
  try {
    json = (await res.json()) as DashboardBookingsPageResponse;
  } catch {
    throw new Error('BOOKINGS_JSON_PARSE');
  }
  if (res.status === 401) throw new Error('UNAUTH');
  if (!res.ok || !json?.ok) {
    const err = new Error(
      typeof json?.error === 'string' ? json.error : `Bookings HTTP ${res.status}`
    );
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }
  return json;
}

function invalidateDashboardCache() {
  void globalMutate(SWR_STATS_KEY);
  void globalMutate(
    (key) => Array.isArray(key) && key[0] === SWR_BOOKINGS_PREFIX
  );
}

function rewardMeta(customer: ApiCustomer | null) {
  const pts = Math.max(0, Math.round(Number(customer?.rewardsPoints) || 0));
  const code = customer?.referralCode?.trim();
  const referralEnabled = Boolean(code);
  return {
    referralCode: referralEnabled ? code! : null,
    referralEnabled,
    rewardTier: null as string | null,
    rewardPoints: pts,
    rewardTarget: null as number | null,
    rewardProgress: null as number | null,
    nextTierName: null as string | null,
    rewardsProgressEnabled: false,
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
  const baseUser = useMemo((): Omit<
    PortalUser,
    | 'customerId'
    | 'referralCode'
    | 'referralEnabled'
    | 'rewardTier'
    | 'rewardPoints'
    | 'rewardTarget'
    | 'rewardProgress'
    | 'nextTierName'
    | 'rewardsProgressEnabled'
  > => {
    const em = email?.trim() || '';
    const fn = firstName?.trim();
    const ln = lastName?.trim();
    const name = [fn, ln].filter(Boolean).join(' ') || 'Account';
    const initial =
      name !== 'Account'
        ? (name.trim()[0] ?? em[0] ?? 'U').toUpperCase()
        : (em[0] ?? 'U').toUpperCase();
    return { email: em || 'you@example.com', name, initial, phone: '' };
  }, [email, firstName, lastName]);

  const [rewardExtras, setRewardExtras] = useState(() => rewardMeta(null));
  const [userBase, setUserBase] = useState(baseUser);
  const [portalCustomerId, setPortalCustomerId] = useState<string | null>(null);

  useEffect(() => {
    setUserBase((prev) => ({
      ...baseUser,
      phone: prev.phone,
    }));
  }, [baseUser]);

  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryItem[]>(() => buildPointsHistory(0));
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [customerAddressParts, setCustomerAddressParts] = useState<CustomerAddressParts | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthToken(data.session?.access_token ?? null);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthToken(session?.access_token ?? null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const {
    data: statsResponse,
    error: statsError,
    isLoading: statsLoadingSwr,
    isValidating: statsValidating,
    mutate: mutateStats,
  } = useSWR(authReady && authToken ? SWR_STATS_KEY : null, fetchDashboardStats, {
    revalidateOnFocus: true,
    dedupingInterval: 3000,
    keepPreviousData: true,
  });

  const {
    data: bookingsPages,
    error: bookingsError,
    isLoading: bookingsInitialLoading,
    isValidating: bookingsValidating,
    size,
    setSize,
    mutate: mutateBookings,
  } = useSWRInfinite(
    (pageIndex, previousPageData) => {
      if (!authReady || !authToken) return null;
      if (previousPageData?.pagination && !previousPageData.pagination.hasMore) return null;
      const offset = pageIndex * BOOKINGS_PAGE_SIZE;
      return [SWR_BOOKINGS_PREFIX, authToken, offset] as const;
    },
    (key) => {
      const offset = key[2];
      return fetchBookingsPage(offset);
    },
    {
      revalidateOnFocus: true,
      dedupingInterval: 3000,
      parallel: false,
      shouldRetryOnError: false,
    }
  );

  useEffect(() => {
    if (!authToken) void setSize(0);
  }, [authToken, setSize]);

  const dashboardStats = statsResponse?.stats ?? null;

  const bookings = useMemo(() => {
    if (!bookingsPages?.length) return [];
    const rows: Booking[] = [];
    for (const page of bookingsPages) {
      if (!page?.bookings?.length) continue;
      for (const b of page.bookings) {
        rows.push(mapApiBooking(b as ApiBooking));
      }
    }
    return sortBookingsByDateDesc(rows);
  }, [bookingsPages]);

  const lastBookingsPage = bookingsPages?.[bookingsPages.length - 1];
  const hasMoreBookings = Boolean(lastBookingsPage?.pagination?.hasMore);
  const bookingsLoadingMore = Boolean(bookingsValidating && !bookingsInitialLoading && size > 1);
  const bookingsLoading =
    !authReady || (Boolean(authToken) && (bookingsInitialLoading || statsLoadingSwr));
  const statsLoading = !authReady || (Boolean(authToken) && (statsLoadingSwr || statsValidating));

  const loadMoreBookings = useCallback(() => {
    if (hasMoreBookings) void setSize((s) => s + 1);
  }, [hasMoreBookings, setSize]);

  const refreshDashboard = useCallback(async () => {
    await Promise.all([mutateStats(), mutateBookings()]);
  }, [mutateStats, mutateBookings]);

  const refreshDashboardRef = useRef(refreshDashboard);
  refreshDashboardRef.current = refreshDashboard;

  useEffect(() => {
    if (statsError) toast.error('Could not load dashboard stats');
  }, [statsError]);

  useEffect(() => {
    if (bookingsError) toast.error('Could not load bookings');
  }, [bookingsError]);

  const customerSyncKey = (() => {
    const c = bookingsPages?.[0]?.customer;
    if (!c) return '';
    return [
      c.id,
      c.email ?? '',
      c.phone ?? '',
      c.firstName ?? '',
      c.lastName ?? '',
      c.addressLine1 ?? '',
      c.addressSuburb ?? '',
      c.addressCity ?? '',
    ].join('|');
  })();

  useEffect(() => {
    if (!authToken) {
      setPortalCustomerId(null);
      setRewardExtras(rewardMeta(null));
      setPointsHistory(buildPointsHistory(0));
      setAddresses([]);
      setCustomerAddressParts(null);
      setPayments([]);
      return;
    }
    const first = bookingsPages?.[0];
    const apiCustomer = first?.customer ?? null;
    if (!apiCustomer) {
      setPortalCustomerId(null);
      setRewardExtras(rewardMeta(null));
      setPointsHistory(buildPointsHistory(dashboardStats?.rewardPoints ?? 0));
      setAddresses([]);
      setCustomerAddressParts(null);
      return;
    }
    setPortalCustomerId(apiCustomer.id);
    setRewardExtras(rewardMeta(apiCustomer));
    const fn = apiCustomer.firstName?.trim();
    const ln = apiCustomer.lastName?.trim();
    setUserBase((prev) => {
      const displayName = [fn, ln].filter(Boolean).join(' ').trim();
      const resolvedName = displayName || prev.name;
      const initialChar =
        resolvedName && resolvedName !== 'Account'
          ? resolvedName.trim().charAt(0)
          : fn?.[0] || ln?.[0] || prev.email?.[0] || 'U';
      return {
        ...prev,
        email: apiCustomer.email?.trim() || prev.email,
        name: resolvedName || 'Account',
        initial: initialChar.toUpperCase(),
        phone: (apiCustomer.phone || '').trim() || prev.phone,
      };
    });
    const addrLine = [apiCustomer.addressLine1, apiCustomer.addressSuburb, apiCustomer.addressCity]
      .filter(Boolean)
      .join(', ');
    const line1 = (apiCustomer.addressLine1 || '').trim();
    const suburb = (apiCustomer.addressSuburb || '').trim();
    const city = (apiCustomer.addressCity || '').trim();
    if (line1) {
      setCustomerAddressParts({
        line1,
        suburb: suburb || BOOKING_DEFAULT_CITY,
        city: city || BOOKING_DEFAULT_CITY,
      });
    } else {
      setCustomerAddressParts(null);
    }
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
  }, [authToken, customerSyncKey]);

  useEffect(() => {
    if (dashboardStats) {
      setRewardExtras((prev) => ({ ...prev, rewardPoints: dashboardStats.rewardPoints }));
      setPointsHistory(buildPointsHistory(dashboardStats.rewardPoints));
    }
  }, [dashboardStats?.rewardPoints]);

  useEffect(() => {
    if (!authToken) {
      setPayments([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard/payments', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const payJson = (await res.json()) as { recentPayments?: ApiPaymentRow[] };
        const recent = Array.isArray(payJson?.recentPayments) ? payJson.recentPayments : [];
        const serviceById = new Map(bookings.map((b) => [b.id, b.service]));
        if (!cancelled) {
          setPayments(recent.map((p: ApiPaymentRow) => mapApiPayment(p, serviceById)));
        }
      } catch {
        if (!cancelled) setPayments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authToken, bookings]);

  const user = useMemo(
    (): PortalUser => ({
      ...userBase,
      ...rewardExtras,
      customerId: portalCustomerId,
    }),
    [userBase, rewardExtras, portalCustomerId]
  );

  const stats = useMemo((): StatItem[] => {
    const s = dashboardStats;
    if (!s) {
      return [
        {
          id: 'stat-upcoming',
          label: 'Upcoming',
          value: 0,
          suffix: '',
          color: 'text-blue-600',
        },
        {
          id: 'stat-plans',
          label: 'Active Plans',
          value: 0,
          suffix: '',
          color: 'text-indigo-600',
        },
        {
          id: 'stat-rewards',
          label: 'Reward Points',
          value: 0,
          suffix: ' pts',
          color: 'text-amber-500',
        },
      ];
    }
    return [
      {
        id: 'stat-upcoming',
        label: 'Upcoming',
        value: s.upcomingCount,
        suffix: '',
        color: 'text-blue-600',
      },
      {
        id: 'stat-plans',
        label: 'Active Plans',
        value: s.activePlans,
        suffix: '',
        color: 'text-indigo-600',
      },
      {
        id: 'stat-rewards',
        label: 'Reward Points',
        value: s.rewardPoints,
        suffix: ' pts',
        color: 'text-amber-500',
      },
    ];
  }, [dashboardStats]);

  useOffline({
    onOnline: async () => {
      if (offlineQueue) {
        await offlineQueue.sync();
      }
      void refreshDashboardRef.current();
    },
  });

  useEffect(() => {
    if (!portalCustomerId) return;

    const instanceId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    let debounce: ReturnType<typeof setTimeout> | undefined;

    const bump = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        invalidateDashboardCache();
      }, 400);
    };

    const channel = supabase
      .channel(`customer-dashboard-${portalCustomerId}-${instanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `customer_id=eq.${portalCustomerId}`,
        },
        bump
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recurring_schedules',
          filter: `customer_id=eq.${portalCustomerId}`,
        },
        bump
      )
      .subscribe();

    return () => {
      clearTimeout(debounce);
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
      invalidateDashboardCache();
      toast.success('Booking cancelled');
    } catch {
      toast.error('Could not cancel booking');
    }
  }, []);

  const rateBooking = useCallback(
    async (
      id: string,
      payload: {
        overallRating: number;
        qualityRating: number;
        punctualityRating: number;
        professionalismRating: number;
        reviewText?: string;
      }
    ) => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          toast.error('Please sign in again');
          return;
        }
        const res = await fetch(`/api/bookings/${encodeURIComponent(id)}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            overallRating: payload.overallRating,
            qualityRating: payload.qualityRating,
            punctualityRating: payload.punctualityRating,
            professionalismRating: payload.professionalismRating,
            reviewText: payload.reviewText?.trim() || '',
            photos: [],
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!json?.ok) {
          toast.error(json?.error || 'Could not submit review');
          return;
        }
        await refreshDashboardRef.current();
        toast.success('Thanks for your review!');
      } catch {
        toast.error('Could not submit review');
      }
    },
    []
  );

  const rescheduleBooking = useCallback(
    async (
      id: string,
      newDate: string,
      newTime: string,
      cleanerId: string | null,
      teamName: string | null
    ) => {
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
          body: JSON.stringify({
            bookingId: id,
            date: newDate,
            time: newTime,
            cleanerId,
            teamName,
          }),
        });
        const json = await res.json();
        if (!json?.ok) {
          toast.error(json?.error || 'Could not reschedule');
          return;
        }
        await refreshDashboardRef.current();
        toast.success('Booking rescheduled');
      } catch {
        toast.error('Could not reschedule');
      }
    },
    []
  );

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
      paymentsLoading: bookingsLoading,
      cancelBooking,
      rateBooking,
      rescheduleBooking,
      stats,
      statsLoading,
      refreshDashboard,
      pointsHistory,
      faqs: STATIC_FAQS,
      addresses,
      saveUser,
      profileSaving,
      profileSaved,
      toggleDefaultAddress,
      addAddress,
      customerAddressParts,
      dashboardStats,
      loadMoreBookings,
      hasMoreBookings,
      bookingsLoadingMore,
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
      refreshDashboard,
      pointsHistory,
      addresses,
      customerAddressParts,
      saveUser,
      profileSaving,
      profileSaved,
      toggleDefaultAddress,
      addAddress,
      dashboardStats,
      loadMoreBookings,
      hasMoreBookings,
      bookingsLoadingMore,
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
    customerAddressParts: ctx.customerAddressParts,
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
    loadMoreBookings: ctx.loadMoreBookings,
    hasMoreBookings: ctx.hasMoreBookings,
    loadingMore: ctx.bookingsLoadingMore,
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
    loading: ctx.paymentsLoading,
  };
}

export function useRefreshDashboard() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('CustomerPortalProvider is required for useRefreshDashboard');
  return ctx.refreshDashboard;
}

export function useRewards() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('CustomerPortalProvider is required for useRewards');
  return {
    pointsHistory: ctx.pointsHistory,
  };
}

export function useFaqs() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('CustomerPortalProvider is required for useFaqs');
  return { faqs: ctx.faqs };
}

export type CustomerDashboardStats = {
  upcomingCount: number;
  completedCount: number;
  cancelledCount: number;
  activePlans: number;
  rewardPoints: number;
};

/** Lists from paginated bookings; KPIs from `GET /api/dashboard/stats` only (no client-derived counts). */
export function useCustomerDashboardData() {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('CustomerPortalProvider is required for useCustomerDashboardData');
  }
  const sorted = useMemo(() => sortBookingsByDateDesc(ctx.bookings), [ctx.bookings]);
  const upcomingBookings = useMemo(
    () => sorted.filter(isCustomerUpcomingBooking),
    [sorted]
  );
  const completedBookings = useMemo(
    () => sorted.filter((b) => isCompletedBooking(b.dbStatus)),
    [sorted]
  );
  const cancelledBookings = useMemo(
    () => sorted.filter((b) => isCancelledBooking(b.dbStatus)),
    [sorted]
  );
  const s = ctx.dashboardStats;
  const stats: CustomerDashboardStats = {
    upcomingCount: s?.upcomingCount ?? 0,
    completedCount: s?.completedCount ?? 0,
    cancelledCount: s?.cancelledCount ?? 0,
    activePlans: s?.activePlans ?? 0,
    rewardPoints: s?.rewardPoints ?? 0,
  };

  return {
    bookings: sorted,
    upcomingBookings,
    completedBookings,
    cancelledBookings,
    stats,
    profile: ctx.user,
    isLoading: ctx.bookingsLoading || ctx.statsLoading,
    refetch: ctx.refreshDashboard,
    loadMoreBookings: ctx.loadMoreBookings,
    hasMoreBookings: ctx.hasMoreBookings,
    bookingsLoadingMore: ctx.bookingsLoadingMore,
  };
}

export function useQuickActions() {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    throw new Error('CustomerPortalProvider is required for useQuickActions');
  }
  const upcomingCount = ctx.dashboardStats?.upcomingCount ?? 0;
  const pts = ctx.dashboardStats?.rewardPoints ?? ctx.user.rewardPoints;
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
