'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession, handleRefreshTokenError } from '@/lib/logout-utils';
import { devLog } from '@/lib/dev-logger';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// New Components
import { NewHeader } from '@/components/dashboard/new-header';
import { CustomerDashboard } from '@/components/dashboard/customer-dashboard-ui';
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
  rewardsPoints?: number;
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
          // Close any open modals if needed in future
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

  return (
    <div className="min-h-screen bg-[#f8f9fb]" ref={pullToRefresh.containerRef}>
      {isRefreshing && (
        <div className="sticky top-0 z-[60] bg-teal-500 text-white text-center py-2 px-4 text-sm shadow-sm">
          Refreshing data...
        </div>
      )}

      <main id="main-content" className="min-w-0" role="main">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh] px-4">
            <div className="text-slate-500 text-sm font-medium">Loading your dashboard...</div>
          </div>
        ) : (
          <CustomerDashboard
            userEmail={user?.email ?? customer?.email ?? null}
            firstName={customer?.firstName ?? null}
            lastName={customer?.lastName ?? null}
            addressLine={
              [customer?.addressLine1, customer?.addressSuburb, customer?.addressCity]
                .filter(Boolean)
                .join(', ') || null
            }
          />
        )}
      </main>
    </div>
  );
}
