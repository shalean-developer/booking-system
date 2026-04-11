'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CalendarDays,
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
  ChevronDown,
  FileText,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useDashboardStats } from '@/hooks/use-dashboard-stats';
import type { NavId } from '@/components/admin/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
  id: NavId;
  label: string;
  icon: React.ReactNode;
  badge?: number;
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

const Sidebar = ({
  activeNav,
  setActiveNav,
  isOpen,
  onClose,
  navItems,
}: {
  activeNav: NavId;
  setActiveNav: (id: NavId) => void;
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
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
      {navItems.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            setActiveNav(item.id);
            onClose();
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200',
            activeNav === item.id
              ? 'bg-white/15 text-white shadow-sm'
              : 'text-white/60 hover:bg-white/8 hover:text-white/90'
          )}
        >
          <span className={cn('flex-shrink-0', activeNav === item.id ? 'text-white' : 'text-white/50')}>
            {item.icon}
          </span>
          <span className="flex-1">{item.label}</span>
          {item.badge !== undefined && (
            <span className="min-w-[18px] flex-shrink-0 rounded-full bg-white/20 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
              {item.badge}
            </span>
          )}
          {activeNav === item.id && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-white/60" />}
        </button>
      ))}
    </nav>

    <div className="flex-shrink-0 border-t border-white/10 px-3 pb-5 pt-3">
      <div className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/8">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white/30 to-white/10">
          <span className="text-xs font-bold text-white">SA</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-white">Shalean Admin</p>
          <p className="truncate text-[10px] text-white/40">admin@shalean.co.za</p>
        </div>
        <LogOut className="h-3.5 w-3.5 flex-shrink-0 text-white/30" />
      </div>
    </div>
  </aside>
);

// ─── Top Bar ─────────────────────────────────────────────────────────────────

const TopBar = ({
  onMenuClick,
  onSearch,
  activeNav,
}: {
  onMenuClick: () => void;
  onSearch?: (q: string) => void;
  activeNav: NavId;
}) => {
  const [todayLabel, setTodayLabel] = useState('');
  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);

  const PAGE_LABELS: Record<NavId, string> = {
    dashboard: 'Dashboard',
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
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder="Search bookings, clients…"
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
              aria-label="Search"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden cursor-pointer items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 transition-colors hover:bg-gray-200 sm:flex">
            <CalendarDays className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-700">{todayLabel || '—'}</span>
            <ChevronDown className="h-3 w-3 text-gray-400" />
          </div>
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>
          <div className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
            <span className="text-xs font-bold text-white">SA</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// ─── Main AdminDashboard ──────────────────────────────────────────────────────

export function AdminDashboard() {
  const [activeNav, setActiveNav] = useState<NavId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newBookings, setNewBookings] = useState<NewBookingRecord[]>([]);

  const { stats: navStats } = useDashboardStats('month');

  const navItems = useMemo((): NavItem[] => {
    const b = navStats?.pendingBookings;
    const q = navStats?.pendingQuotes;
    const a = navStats?.pendingApplications;
    return [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
      { id: 'bookings', label: 'Bookings', icon: <CalendarDays className="h-4.5 w-4.5" />, badge: b },
      { id: 'customers', label: 'Customers', icon: <Users className="h-4.5 w-4.5" /> },
      { id: 'cleaners', label: 'Cleaners', icon: <Sparkles className="h-4.5 w-4.5" />, badge: a },
      { id: 'quotes', label: 'Quotes', icon: <FileText className="h-4.5 w-4.5" />, badge: q },
      { id: 'payments', label: 'Payments', icon: <DollarSign className="h-4.5 w-4.5" /> },
      { id: 'pricing', label: 'Pricing', icon: <DollarSign className="h-4.5 w-4.5" /> },
      { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-4.5 w-4.5" /> },
      { id: 'settings', label: 'Settings', icon: <Settings className="h-4.5 w-4.5" /> },
    ];
  }, [navStats]);

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
    if (activeNav === 'bookings') {
      return (
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <BookingsPage onNewBooking={() => setBookingModalOpen(true)} newBookings={newBookings} />
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
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navItems={navItems}
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
        <TopBar onMenuClick={() => setSidebarOpen(true)} activeNav={activeNav} />

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
