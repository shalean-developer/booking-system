'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession, handleRefreshTokenError } from '@/lib/logout-utils';
import { devLog } from '@/lib/dev-logger';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// New Components
import { NewHeader } from '@/components/dashboard/new-header';
import { ServiceSummaryKPIs } from '@/components/dashboard/service-summary-kpis';
import { AppointmentSchedule } from '@/components/dashboard/appointment-schedule';
import { ServiceHistory } from '@/components/dashboard/service-history';
import { BillingOverview } from '@/components/dashboard/billing-overview';
import { SubscriptionPlans } from '@/components/dashboard/subscription-plans';
import { ServiceRequestPanel } from '@/components/dashboard/service-request-panel';
import { SupportWidget } from '@/components/dashboard/support-widget';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { MobileDrawer } from '@/components/dashboard/mobile-drawer';
import { ProfileQuickSetup } from '@/components/dashboard/profile-quick-setup';
import { DashboardErrorBoundary } from '@/components/dashboard/error-boundary';
import { SessionTimeoutWarning } from '@/components/dashboard/session-timeout-warning';
import { PullToRefreshIndicator } from '@/components/dashboard/pull-to-refresh-indicator';
import { OfflineIndicator } from '@/components/dashboard/offline-indicator';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { usePullToRefresh } from '@/lib/hooks/use-pull-to-refresh';
import { useOffline } from '@/lib/hooks/use-offline';
import { offlineQueue } from '@/lib/utils/offline-queue';
import { isRateLimitError, extractRateLimitInfo, formatRateLimitMessage } from '@/lib/utils/rate-limit-handler';
import { captureException, setUserContext } from '@/lib/utils/error-tracking';
import { performanceMonitor } from '@/lib/utils/performance-monitor';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  notes?: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  cleaner_id?: string | null;
  customer_reviewed?: boolean;
  customer_review_id?: string | null;
  payment_reference?: string | null;
}

interface CustomerData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  addressLine1?: string | null;
  addressSuburb?: string | null;
  addressCity?: string | null;
  totalBookings: number;
}

interface DashboardStats {
  upcomingAppointments: number;
  activeCleaningPlans: number;
  lastCleaningCompleted: string | null;
  balanceDue: number;
}

interface PaymentData {
  outstandingBalance: number;
  recentPayments: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending' | 'overdue';
    reference?: string | null;
  }>;
  nextInvoice: {
    id: string;
    date: string;
    amount: number;
    dueDate: string;
  } | null;
}

interface RecurringSchedule {
  id: string;
  service_type: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  preferred_time: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringSchedule[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const { isOnline } = useOffline({
    onOnline: async () => {
      // Sync offline queue when back online
      if (offlineQueue) {
        await offlineQueue.sync();
      }
    },
  });

  // Fetch data with retry logic
  const fetchDashboardData = useCallback(async (showLoading = true, retryCount = 0) => {
    const maxRetries = 3;
    const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s

    try {
      if (showLoading) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const session = await safeGetSession(supabase);
      
      if (!session || !session.user) {
        setIsLoading(false);
        setIsRefreshing(false);
        setError('UNAUTHENTICATED');
        return;
      }
      
      const authUser = session.user;
      setUser(authUser);
      
      // Set error tracking user context
      if (authUser?.id) {
        setUserContext(authUser.id, authUser.email, {
          email: authUser.email,
        });
      }

      // Get session token for API calls
      let apiSession;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          if (handleRefreshTokenError(error)) {
            setIsLoading(false);
            setIsRefreshing(false);
            setError('UNAUTHENTICATED');
            return;
          }
          throw error;
        }
        apiSession = data.session;
      } catch (error: unknown) {
        if (handleRefreshTokenError(error)) {
          setIsLoading(false);
          setIsRefreshing(false);
          setError('UNAUTHENTICATED');
          return;
        }
        throw error;
      }
      
      if (!apiSession) {
        throw new Error('No active session');
      }

      const headers = {
        'Authorization': `Bearer ${apiSession.access_token}`,
      };

      // Fetch all data in parallel with timeout and error handling
      const fetchWithTimeout = async (url: string, options: RequestInit, timeout = 20000): Promise<{ response: Response | null; error: string | null }> => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), timeout);
          
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          return { response, error: null };
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            devLog.warn(`Request timeout for ${url} after ${timeout}ms`);
            return { response: null, error: 'timeout' };
          }
          devLog.error(`Request error for ${url}:`, error);
          return { response: null, error: error instanceof Error ? error.message : 'network_error' };
        }
      };

      // Check for rate limiting in response
      const checkRateLimit = (response: Response | null) => {
        if (response && isRateLimitError(response)) {
          const rateLimitInfo = extractRateLimitInfo(response);
          if (rateLimitInfo) {
            const message = formatRateLimitMessage(rateLimitInfo);
            toast.error(message, { duration: 5000 });
          }
        }
      };

      // Fetch all data in parallel - allow partial failures
      const [bookingsResult, statsResult, paymentsResult, schedulesResult] = await Promise.allSettled([
        fetchWithTimeout('/api/dashboard/bookings?limit=50', { headers }),
        fetchWithTimeout('/api/dashboard/stats', { headers }),
        fetchWithTimeout('/api/dashboard/payments', { headers }),
        fetchWithTimeout('/api/dashboard/recurring-schedules', { headers }),
      ]);

      // Check for rate limiting in responses
      if (bookingsResult.status === 'fulfilled' && bookingsResult.value.response) {
        checkRateLimit(bookingsResult.value.response);
      }
      if (statsResult.status === 'fulfilled' && statsResult.value.response) {
        checkRateLimit(statsResult.value.response);
      }
      if (paymentsResult.status === 'fulfilled' && paymentsResult.value.response) {
        checkRateLimit(paymentsResult.value.response);
      }
      if (schedulesResult.status === 'fulfilled' && schedulesResult.value.response) {
        checkRateLimit(schedulesResult.value.response);
      }

      // Helper function to safely parse JSON from response
      const safeParseJson = async (response: Response): Promise<any | null> => {
        try {
          // Check if response is OK and has JSON content type
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            devLog.warn('Response is not JSON, content-type:', contentType, 'status:', response.status);
            return null;
          }

          // Clone the response before reading (body can only be read once)
          const clonedResponse = response.clone();
          const text = await clonedResponse.text();
          
          // Check if text starts with HTML (error page)
          const trimmedText = text.trim();
          if (trimmedText.startsWith('<!DOCTYPE') || trimmedText.startsWith('<html') || trimmedText.startsWith('<!')) {
            devLog.warn('Response is HTML, not JSON. Status:', response.status, 'URL:', response.url);
            return null;
          }

          // Try to parse as JSON
          return JSON.parse(text);
        } catch (err) {
          devLog.error('Error parsing JSON:', err);
          return null;
        }
      };

      // Process bookings (allow partial failure)
      if (bookingsResult.status === 'fulfilled' && bookingsResult.value.response) {
        try {
          const bookingsData = await safeParseJson(bookingsResult.value.response);
          if (bookingsData && bookingsResult.value.response.ok && bookingsData.ok) {
            setCustomer(bookingsData.customer);
            setBookings(bookingsData.bookings || []);
          }
        } catch (err) {
          devLog.error('Error processing bookings:', err);
        }
      }

      // Process stats (allow partial failure)
      if (statsResult.status === 'fulfilled' && statsResult.value.response) {
        try {
          const statsData = await safeParseJson(statsResult.value.response);
          if (statsData && statsResult.value.response.ok && statsData.ok) {
            setStats(statsData.stats);
          }
        } catch (err) {
          devLog.error('Error processing stats:', err);
        }
      }

      // Process payments (allow partial failure)
      if (paymentsResult.status === 'fulfilled' && paymentsResult.value.response) {
        try {
          const paymentsData = await safeParseJson(paymentsResult.value.response);
          if (paymentsData && paymentsResult.value.response.ok && paymentsData.ok) {
            setPaymentData(paymentsData);
          }
        } catch (err) {
          devLog.error('Error processing payments:', err);
        }
      }

      // Process recurring schedules (allow partial failure)
      if (schedulesResult.status === 'fulfilled' && schedulesResult.value.response) {
        try {
          const schedulesData = await safeParseJson(schedulesResult.value.response);
          if (schedulesData && schedulesResult.value.response.ok && schedulesData.ok) {
            setRecurringSchedules(schedulesData.schedules || []);
          }
        } catch (err) {
          devLog.error('Error processing schedules:', err);
        }
      }

      // Check if we got at least some data
      const hasAnyData = (bookingsResult.status === 'fulfilled' && bookingsResult.value.response) || 
                         (statsResult.status === 'fulfilled' && statsResult.value.response) || 
                         (paymentsResult.status === 'fulfilled' && paymentsResult.value.response) || 
                         (schedulesResult.status === 'fulfilled' && schedulesResult.value.response);

      // Only retry if we got no data at all and haven't exceeded retries
      if (!hasAnyData && retryCount < maxRetries && isOnline) {
        setTimeout(() => fetchDashboardData(showLoading, retryCount + 1), retryDelay);
        return;
      }

      setIsLoading(false);
      setIsRefreshing(false);

      // Log performance summary in development
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          const summary = performanceMonitor.getSummary();
          devLog.debug('[Performance] Dashboard load summary:', summary);
        }, 1000); // Wait a bit for metrics to settle
      }

      // Log performance summary in development
      if (process.env.NODE_ENV === 'development') {
        const summary = performanceMonitor.getSummary();
        devLog.debug('[Performance] Dashboard load summary:', summary);
      }

    } catch (err) {
      devLog.error('Dashboard error:', err);
      
      // Capture error for tracking
      if (err instanceof Error) {
        captureException(err, {
          component: 'DashboardPage',
          retryCount,
          hasData: bookings.length > 0 || stats !== null || paymentData !== null || recurringSchedules.length > 0,
        });
      }
      
      // Only show error if we have no data at all
      const hasData = bookings.length > 0 || stats !== null || paymentData !== null || recurringSchedules.length > 0;
      
      if (!hasData && retryCount < maxRetries && isOnline) {
        setTimeout(() => fetchDashboardData(showLoading, retryCount + 1), retryDelay);
      } else if (!hasData) {
        // Only set error if we truly have no data
        setError(err instanceof Error ? err.message : 'Failed to load dashboard. Some data may be unavailable.');
        setIsLoading(false);
        setIsRefreshing(false);
      } else {
        // We have some data, just finish loading
        setIsLoading(false);
        setIsRefreshing(false);
        if (showLoading) {
          toast.warning('Some dashboard data could not be loaded. Please refresh if needed.');
        }
      }
    }
  }, [router, isOnline]);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData(true);
  }, [router]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && !isLoading) {
        fetchDashboardData(false);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isOnline, isLoading, fetchDashboardData]);

  // Refresh on tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnline && !isLoading) {
        fetchDashboardData(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isOnline, isLoading, fetchDashboardData]);

  // Sync offline queue when back online
  useEffect(() => {
    if (isOnline && offlineQueue) {
      offlineQueue.sync().then(() => {
        // Refresh dashboard after sync
        if (!isLoading) {
          fetchDashboardData(false);
        }
      });
    }
  }, [isOnline, isLoading, fetchDashboardData]);

  // Real-time subscription to bookings changes
  useEffect(() => {
    if (!customer?.id || !isOnline) return;

    let debounceTimeout: NodeJS.Timeout;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    try {
      channel = supabase
        .channel(`customer-bookings-${customer.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `customer_id=eq.${customer.id}`,
          },
          () => {
            // Debounced refresh - wait 500ms before refreshing to batch multiple changes
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
              if (isOnline && !isLoading) {
                fetchDashboardData(false);
                toast.info('Booking updated', { duration: 2000 });
              }
            }, 500);
          }
        )
        .subscribe();

      return () => {
        clearTimeout(debounceTimeout);
        if (channel) {
          supabase.removeChannel(channel);
        }
      };
    } catch (e) {
      devLog.warn('Realtime unavailable:', e);
    }
  }, [customer?.id, isOnline, isLoading, fetchDashboardData]);

  const handleRefresh = useCallback(async () => {
    await fetchDashboardData(false);
    toast.success('Dashboard refreshed');
  }, [fetchDashboardData]);

  // Pull-to-refresh hook
  const pullToRefresh = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
    disabled: isLoading || isRefreshing || !isOnline,
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'r',
        ctrl: true,
        handler: handleRefresh,
        description: 'Refresh dashboard',
      },
      {
        key: '/',
        handler: () => {
          // Focus search if available, otherwise show help
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          } else {
            toast.info('Press Ctrl+R to refresh, / to search (when available)');
          }
        },
        description: 'Focus search',
      },
      {
        key: 'Escape',
        handler: () => {
          // Close any open modals/drawers
          if (drawerOpen) {
            setDrawerOpen(false);
          }
          if (profileSheetOpen) {
            setProfileSheetOpen(false);
          }
        },
        description: 'Close modals',
      },
    ],
    enabled: !isLoading && !error,
  });

  if (error) {
    if (error === 'UNAUTHENTICATED') {
      return (
        <div className="min-h-screen bg-white">
          <NewHeader user={user} customer={customer} />
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md mx-4">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Please Log In</h2>
                <p className="text-gray-600 mb-6">You need to be logged in to view your dashboard.</p>
                <div className="space-y-3">
                  <Button onClick={() => router.push('/login')} className="w-full">
                    Log In
                  </Button>
                  <Button onClick={() => router.push('/signup')} variant="outline" className="w-full">
                    Create Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/')}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function welcomeName(): string {
    return (user as any)?.firstName ?? "";
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white pb-32 lg:pb-0"
      ref={pullToRefresh.containerRef}
    >
      {/* Performance monitoring badge - hidden from customers */}

      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Pull-to-Refresh Indicator */}
      <PullToRefreshIndicator
        isPulling={pullToRefresh.isPulling}
        pullDistance={pullToRefresh.pullDistance}
        pullProgress={pullToRefresh.pullProgress}
        shouldShowIndicator={pullToRefresh.shouldShowIndicator}
        isRefreshing={pullToRefresh.isRefreshing}
      />
      
      <NewHeader 
        user={user}
        customer={customer}
        onOpenMobileDrawer={() => setDrawerOpen(true)}
        onRefresh={handleRefresh}
      />

      {/* Refreshing Indicator (only show if not using pull-to-refresh) */}
      {isRefreshing && !pullToRefresh.isRefreshing && (
        <div className="bg-teal-500 text-white text-center py-2 px-4 text-sm">
          Refreshing data...
        </div>
      )}

      <main id="main-content" className="py-6 sm:py-8" role="main">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 min-w-0">
          {/* Welcome Section */}
          <motion.div 
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {welcomeName()}! 👋
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600">
              Manage your bookings, payments, and cleaning plans all in one place
            </p>
          </motion.div>

          {/* Service Summary KPIs */}
          <DashboardErrorBoundary componentName="ServiceSummaryKPIs">
            <ServiceSummaryKPIs
              upcomingAppointments={stats?.upcomingAppointments ?? 0}
              activeCleaningPlans={stats?.activeCleaningPlans ?? 0}
              lastCleaningCompleted={stats?.lastCleaningCompleted ?? null}
              balanceDue={stats?.balanceDue ?? 0}
              isLoading={isLoading && !stats}
            />
          </DashboardErrorBoundary>

          {/* Main Content Grid */}
          <motion.div 
            className="grid lg:grid-cols-12 gap-4 sm:gap-6 mb-6 min-w-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Left Column - Sidebar Navigation */}
            <div className="hidden lg:block lg:col-span-3 min-w-0">
              <DashboardErrorBoundary componentName="SidebarNav">
                <div className="sticky top-16 z-10 h-fit max-h-[calc(100vh-4rem)] overflow-y-auto">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                  >
                    <SidebarNav />
                  </motion.div>
                </div>
              </DashboardErrorBoundary>
            </div>

            {/* Center Column - Main Content */}
            <div className="lg:col-span-6 space-y-6 min-w-0">
              {/* Service Request Panel */}
              <DashboardErrorBoundary componentName="ServiceRequestPanel">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="min-w-0"
                >
                  <ServiceRequestPanel />
                </motion.div>
              </DashboardErrorBoundary>

              {/* Appointment Schedule */}
              <DashboardErrorBoundary componentName="AppointmentSchedule">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <AppointmentSchedule
                    bookings={bookings}
                    isLoading={isLoading}
                    onReschedule={(bookingId) => {
                      router.push(`/booking/reschedule?id=${bookingId}`);
                    }}
                    onCancel={() => {
                      fetchDashboardData(false);
                    }}
                    onBookingUpdate={(updatedBookings) => {
                      // Optimistically update bookings list
                      setBookings(updatedBookings);
                      // Still refresh to ensure consistency
                      setTimeout(() => fetchDashboardData(false), 1000);
                    }}
                  />
                </motion.div>
              </DashboardErrorBoundary>

              {/* Service History */}
              <DashboardErrorBoundary componentName="ServiceHistory">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <ServiceHistory
                    bookings={bookings}
                    isLoading={isLoading}
                  />
                </motion.div>
              </DashboardErrorBoundary>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-3 space-y-6">
              {/* Billing Overview */}
              <DashboardErrorBoundary componentName="BillingOverview">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <BillingOverview
                    outstandingBalance={paymentData?.outstandingBalance ?? 0}
                    recentPayments={paymentData?.recentPayments ?? []}
                    nextInvoice={paymentData?.nextInvoice ?? null}
                    isLoading={isLoading && !paymentData}
                  />
                </motion.div>
              </DashboardErrorBoundary>

              {/* Subscription Plans */}
              <DashboardErrorBoundary componentName="SubscriptionPlans">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.4 }}
                >
                  <SubscriptionPlans
                    schedules={recurringSchedules}
                    isLoading={isLoading && recurringSchedules.length === 0}
                  />
                </motion.div>
              </DashboardErrorBoundary>

              {/* Support Widget */}
              <DashboardErrorBoundary componentName="SupportWidget">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <SupportWidget />
                </motion.div>
              </DashboardErrorBoundary>
            </div>
          </motion.div>

          {/* Empty State for New Users */}
          {!isLoading && !customer && (
            <Card className="border-2 border-dashed border-teal-300 bg-teal-50/30">
              <CardContent className="p-6 sm:p-8 text-center">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
                  Your dashboard is ready!
                </h2>
                <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-6">
                  Book your first service to see your appointments, history, and more here.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-sm sm:text-base h-10 sm:h-11">
                    <a href="/booking/service/select">Book Your First Service</a>
                  </Button>
                  <Button variant="outline" asChild className="text-sm sm:text-base h-10 sm:h-11">
                    <a href="/contact">Contact Support</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab="overview" 
        onTabChange={() => {}}
        onMoreClick={() => setDrawerOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        customer={customer}
        onEditProfile={() => setProfileSheetOpen(true)}
      />

      {/* Profile Quick Setup */}
      <ProfileQuickSetup
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        customer={customer}
        onUpdated={(updated) => {
          setCustomer((prev) =>
            prev
              ? { ...prev, ...updated }
              : {
                  ...updated,
                  totalBookings: 0,
                }
          );
        }}
      />
      
      {/* Session Timeout Warning */}
      <SessionTimeoutWarning warningMinutes={5} checkInterval={30} />
    </div>
  );
}
