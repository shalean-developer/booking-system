'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Users,
  Sparkles,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  LogOut,
  FileText,
  Banknote,
  Tags,
  CheckCircle2,
  BookOpen,
  Receipt,
  CircleDollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { safeLogout } from '@/lib/logout-utils';
import { fetcher } from '@/lib/swr-config';
import { useUser } from '@/hooks/use-user';
import { BookingModal, type BookingSuccessPayload } from './BookingModal';
import {
  BookingsPage,
  CustomersPage,
  CleanersPage,
  QuotesPage,
  PaymentsPage,
  ReportsPage,
  SettingsPage,
  type NewBookingRecord,
} from './DashboardPages';
import { PricingPage } from './PricingPage';
import { DashboardHome } from './dashboard-home';
import { RevenueDashboard } from './revenue-dashboard';
import type { NavId } from '@/components/admin/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  /** Full-page routes under `/admin/...`, not an SPA panel */
  id: NavId | 'schedule' | 'invoices' | 'blog';
  label: string;
  icon: React.ReactNode;
  badge?: number;
  badgeTitle?: string;
  /** When set, navigate with Next.js Link instead of swapping SPA view */
  href?: string;
}

// ─── Toast Notification ───────────────────────────────────────────────────────

const Toast = ({ message, onDone }: { message: string; onDone: () => void }) => {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 48, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.94 }}
      className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-2xl"
    >
      <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-400" />
      <span>{message}</span>
    </motion.div>
  );
};

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function initialsFromEmail(email: string | undefined): string {
  if (!email) return 'AD';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase().slice(0, 2);
  }
  return local.slice(0, 2).toUpperCase() || 'AD';
}

const Sidebar = ({
  activeNav,
  setActiveNav,
  isOpen,
  onClose,
  navItems,
  userLabel,
  userEmail,
  userInitials,
  onLogout,
  pathname,
}: {
  activeNav: NavId;
  setActiveNav: (id: NavId) => void;
  pathname: string;
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  userLabel: string;
  userEmail: string;
  userInitials: string;
  onLogout: () => void;
}) => (
  <aside
    className={cn(
      'fixed inset-y-0 left-0 z-50 flex w-64 flex-col',
      'bg-gradient-to-b from-[#4338CA] via-[#4F46E5] to-[#6D28D9]',
      'transition-transform duration-300 ease-in-out',
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    )}
  >
    <div className="flex flex-shrink-0 items-center justify-between px-5 py-5">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-extrabold leading-tight tracking-tight text-white">Shalean</p>
          <p className="text-[10px] font-medium text-white/50">Admin Portal</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/70 transition-colors hover:bg-white/20 lg:hidden"
        aria-label="Close menu"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Main navigation">
      <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Menu</p>
      {navItems.map((item) => {
        const isScheduleLink = Boolean(item.href);
        const routeActive = isScheduleLink && item.href
          ? pathname === item.href || pathname.startsWith(`${item.href}/`)
          : false;
        const spaActive = !isScheduleLink && activeNav === item.id;
        const isActive = routeActive || spaActive;
        const className = cn(
          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200',
          isActive
            ? 'bg-white/15 text-white shadow-sm'
            : 'text-white/60 hover:bg-white/8 hover:text-white/90'
        );
        const iconWrap = cn('flex-shrink-0', isActive ? 'text-white' : 'text-white/50');
        if (item.href) {
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={className}
            >
              <span className={iconWrap}>{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {routeActive && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-white/60" />}
            </Link>
          );
        }
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setActiveNav(item.id as NavId);
              onClose();
            }}
            className={className}
          >
            <span className={iconWrap}>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span
                title={item.badgeTitle}
                className="min-w-[18px] flex-shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 text-center text-[10px] font-bold text-white"
              >
                {item.badge}
              </span>
            )}
            {spaActive && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-white/60" />}
          </button>
        );
      })}
    </nav>

    <div className="flex-shrink-0 border-t border-white/10 px-3 pb-5 pt-3">
      <button
        type="button"
        onClick={onLogout}
        className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/8"
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/30 to-white/10">
          <span className="text-xs font-bold text-white">{userInitials}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-white">{userLabel}</p>
          <p className="truncate text-[10px] text-white/40">{userEmail}</p>
        </div>
        <LogOut className="h-3.5 w-3.5 flex-shrink-0 text-white/50" aria-hidden />
      </button>
    </div>
  </aside>
);

// ─── Top Bar ─────────────────────────────────────────────────────────────────

const TopBar = ({
  onMenuClick,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  activeNav,
  userInitials,
  notificationCount,
}: {
  onMenuClick: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: () => void;
  activeNav: NavId;
  userInitials: string;
  notificationCount: number;
}) => {
  const [todayLabel, setTodayLabel] = useState('');
  const refreshToday = useCallback(() => {
    setTodayLabel(
      new Date().toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);
  useEffect(() => {
    refreshToday();
    const id = setInterval(refreshToday, 60_000);
    return () => clearInterval(id);
  }, [refreshToday]);

  const PAGE_LABELS: Record<NavId, string> = {
    dashboard: 'Dashboard',
    revenue: 'Revenue',
    bookings: 'Bookings',
    customers: 'Customers',
    cleaners: 'Cleaners',
    quotes: 'Quotes',
    payments: 'Payments',
    reports: 'Reports & Analytics',
    settings: 'Settings',
    pricing: 'Pricing',
  };
  return (
    <header className="sticky top-0 z-30 flex-shrink-0 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-4 px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <span className="hidden text-xs font-bold text-gray-400 sm:block">{PAGE_LABELS[activeNav]}</span>

        <div className="max-w-sm flex-1">
          <div className="flex items-center gap-2.5 rounded-xl bg-gray-100 px-3 py-2">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSearchSubmit();
                }
              }}
              placeholder="Search bookings, clients…"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              aria-label="Search"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div
            className="hidden items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 sm:flex"
            title="Today (local time)"
          >
            <CalendarDays className="h-3.5 w-3.5 text-gray-500" aria-hidden />
            <span className="text-xs font-semibold text-gray-700">{todayLabel || '—'}</span>
          </div>
          <Link
            href="/admin"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
            title="Admin dashboard"
            aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Admin dashboard'}
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            )}
          </Link>
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
            <span className="text-xs font-bold text-white">{userInitials}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── Main AdminDashboard ──────────────────────────────────────────────────────

export function AdminDashboard() {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { user } = useUser();
  const [activeNav, setActiveNav] = useState<NavId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newBookings, setNewBookings] = useState<NewBookingRecord[]>([]);
  const [headerSearch, setHeaderSearch] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('nav') === 'revenue') {
      setActiveNav('revenue');
    }
  }, []);

  const { data: pendingRes, mutate: mutatePendingCounts } = useSWR<{
    ok: boolean;
    pendingQuotes?: number;
    pendingApplications?: number;
    pendingBookings?: number;
  }>('/api/admin/pending-counts', fetcher);

  const { data: notifData } = useSWR<{ ok: boolean; count?: number }>(
    '/api/admin/notifications/unread-count',
    fetcher
  );
  const notificationCount = notifData?.ok ? notifData.count ?? 0 : 0;

  const userEmail = user?.email ?? '';
  const userLabel =
    (typeof user?.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim()) ||
    userEmail.split('@')[0] ||
    'Admin';
  const userInitials = initialsFromEmail(userEmail);

  const handleLogout = useCallback(() => {
    void safeLogout(supabase, router, { redirectPath: '/login?returnTo=/admin' });
  }, [router]);

  const navItems = useMemo((): NavItem[] => {
    const b = pendingRes?.ok ? pendingRes.pendingBookings : undefined;
    const q = pendingRes?.ok ? pendingRes.pendingQuotes : undefined;
    const a = pendingRes?.ok ? pendingRes.pendingApplications : undefined;
    return [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
      { id: 'revenue', label: 'Revenue', icon: <CircleDollarSign className="h-4.5 w-4.5" /> },
      { id: 'bookings', label: 'Bookings', icon: <CalendarDays className="h-4.5 w-4.5" />, badge: b },
      {
        id: 'schedule',
        label: 'Schedule',
        icon: <Clock className="h-4.5 w-4.5" />,
        href: '/admin/schedule',
      },
      { id: 'customers', label: 'Customers', icon: <Users className="h-4.5 w-4.5" /> },
      {
        id: 'cleaners',
        label: 'Cleaners',
        icon: <Sparkles className="h-4.5 w-4.5" />,
        badge: a,
        badgeTitle: a ? 'Pending cleaner applications' : undefined,
      },
      { id: 'quotes', label: 'Quotes', icon: <FileText className="h-4.5 w-4.5" />, badge: q },
      { id: 'payments', label: 'Payments', icon: <Banknote className="h-4.5 w-4.5" /> },
      {
        id: 'invoices',
        label: 'Invoices',
        icon: <Receipt className="h-4.5 w-4.5" />,
        href: '/admin/invoices',
      },
      { id: 'pricing', label: 'Pricing', icon: <Tags className="h-4.5 w-4.5" /> },
      {
        id: 'blog',
        label: 'Blog Management',
        icon: <BookOpen className="h-4.5 w-4.5" />,
        href: '/admin/blog',
      },
      { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-4.5 w-4.5" /> },
      { id: 'settings', label: 'Settings', icon: <Settings className="h-4.5 w-4.5" /> },
    ];
  }, [pendingRes]);

  const handleSearchSubmit = useCallback(() => {
    setActiveNav('bookings');
    setSidebarOpen(false);
  }, []);

  const handleBookingSuccess = (booking: BookingSuccessPayload) => {
    const cleanerName = booking.cleanerLabel ?? booking.cleanerId ?? '—';
    const serviceLabel = booking.serviceLabel ?? booking.serviceType ?? '—';
    const pending = Boolean(booking.paymentPending);
    const record: NewBookingRecord = {
      id: booking.id,
      client: booking.clientName,
      email: booking.clientEmail,
      service: serviceLabel,
      cleaner: cleanerName,
      cleanerId: booking.cleanerId,
      date: booking.date,
      time: booking.time,
      amount: booking.amount,
      status: pending ? 'pending' : 'confirmed',
      paymentStatus: pending ? 'pending' : 'paid',
      address: booking.address,
      suburb: booking.suburb,
    };
    setNewBookings((prev) => [record, ...prev]);
    void mutatePendingCounts();
    setToast(
      pending
        ? `Booking ${booking.id} created — complete payment in Paystack or from Bookings.`
        : `Booking ${booking.id} confirmed.`
    );
  };

  const handleNavigate = (id: NavId) => {
    setActiveNav(id);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    if (activeNav === 'revenue') {
      return (
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <RevenueDashboard embedded />
        </main>
      );
    }
    if (activeNav === 'bookings') {
      return (
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <BookingsPage
            onNewBooking={() => setBookingModalOpen(true)}
            newBookings={newBookings}
            syncSearch={headerSearch}
          />
        </main>
      );
    }
    if (activeNav === 'customers') {
      return (
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <CustomersPage />
        </main>
      );
    }
    if (activeNav === 'cleaners') {
      return (
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <CleanersPage />
        </main>
      );
    }
    if (activeNav === 'quotes') {
      return (
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <QuotesPage onNewBooking={() => setBookingModalOpen(true)} />
        </main>
      );
    }
    if (activeNav === 'payments') {
      return (
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <PaymentsPage />
        </main>
      );
    }
    if (activeNav === 'reports') {
      return (
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <ReportsPage />
        </main>
      );
    }
    if (activeNav === 'settings') {
      return (
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <SettingsPage />
        </main>
      );
    }
    if (activeNav === 'pricing') {
      return (
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <PricingPage />
        </main>
      );
    }
    return (
      <DashboardHome
        onNewBooking={() => setBookingModalOpen(true)}
        onNavigate={handleNavigate}
        newBookingCount={newBookings.length}
      />
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6f8]">
      <Sidebar
        activeNav={activeNav}
        setActiveNav={handleNavigate}
        pathname={pathname}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={navItems}
        userLabel={userLabel}
        userEmail={userEmail || '—'}
        userInitials={userInitials}
        onLogout={handleLogout}
      />

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          searchQuery={headerSearch}
          onSearchChange={setHeaderSearch}
          onSearchSubmit={handleSearchSubmit}
          activeNav={activeNav}
          userInitials={userInitials}
          notificationCount={notificationCount}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeNav}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </div>

      <BookingModal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)} onSuccess={handleBookingSuccess} />

      <AnimatePresence>{toast && <Toast key="toast" message={toast} onDone={() => setToast(null)} />}</AnimatePresence>
    </div>
  );
}
