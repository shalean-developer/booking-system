'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// import { Header } from '@/components/header';
import { supabase } from '@/lib/supabase-client';
import { safeLogout, safeGetSession, handleRefreshTokenError } from '@/lib/logout-utils';
import { toast } from 'sonner';
import { 
  User, 
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { CustomerReviewDialog } from '@/components/review/customer-review-dialog';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { MobileDrawer } from '@/components/dashboard/mobile-drawer';
import { OverviewTab } from '@/components/dashboard/overview-tab';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { StatCard } from '@/components/dashboard/stat-card';
import { UpcomingPanel } from '@/components/dashboard/upcoming-panel';
import { MessagesPanel } from '@/components/dashboard/messages-panel';
import { ActivityPanel } from '@/components/dashboard/activity-panel';
import { LeftRail } from '@/components/dashboard/left-rail';
import { CustomerHeader } from '@/components/dashboard/customer-header';
import { UnifiedBookings } from '@/components/dashboard/unified-bookings';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
  notes?: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  cleaner_id: string;
  customer_reviewed?: boolean;
  customer_review_id?: string | null;
}

interface CustomerData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  totalBookings: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'reviews'>('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Derive active tab from current route for consistent state across desktop and mobile
  useEffect(() => {
    if (pathname === '/dashboard') {
      setActiveTab('overview');
    } else if (pathname === '/dashboard/bookings') {
      setActiveTab('bookings');
    } else if (pathname === '/dashboard/reviews') {
      setActiveTab('reviews');
    }
  }, [pathname]);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        // Check authentication using safe session check
        const session = await safeGetSession(supabase);
        
        if (!session || !session.user) {
          console.log('Not authenticated - will show login prompt');
          setIsLoading(false);
          setError('UNAUTHENTICATED'); // Special error code
          return;
        }
        
        const authUser = session.user;

        console.log('User authenticated:', authUser.email);
        setUser(authUser);

        // Fetch bookings and customer data
        console.log('Fetching dashboard bookings from API...');

        // Get session token for API call
        let apiSession;
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            // Handle refresh token errors gracefully
            if (handleRefreshTokenError(error)) {
              // Storage was cleared, redirect to login
              console.log('Refresh token error - redirecting to login');
              setIsLoading(false);
              setError('UNAUTHENTICATED');
              return;
            }
            throw error;
          }
          apiSession = data.session;
        } catch (error: any) {
          // Handle refresh token errors gracefully
          if (handleRefreshTokenError(error)) {
            console.log('Refresh token error - redirecting to login');
            setIsLoading(false);
            setError('UNAUTHENTICATED');
            return;
          }
          throw error;
        }
        
        if (!apiSession) {
          throw new Error('No active session');
        }

        const response = await fetch('/api/dashboard/bookings', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });
        console.log('API Response status:', response.status);
        console.log('API Response ok:', response.ok);

        const data = await response.json();
        console.log('API Response data:', data);

        if (!response.ok || !data.ok) {
          console.error('API returned error:', data);
          throw new Error(data.error || 'Failed to fetch bookings');
        }

        setCustomer(data.customer);
        setBookings(data.bookings);
        setIsLoading(false);

      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  const handleSignOut = async () => {
    await safeLogout(supabase, router, {
      timeout: 5000, // 5 seconds timeout (reduced from 10s)
      onSuccess: () => {
        console.log('🏁 Dashboard logout completed successfully');
        toast.success('Successfully signed out');
      },
      onError: (error) => {
        console.error('❌ Dashboard logout failed:', error);
        // Show user-friendly error message with toast
        toast.warning('Logout completed with some issues, but you have been signed out.');
      },
      onTimeout: () => {
        console.warn('⏰ Dashboard logout timed out - user will be redirected anyway');
        // Show user-friendly timeout message with toast
        toast.info('Logout is taking longer than expected, but you will be redirected shortly.');
      }
    });
  };

  const handleOpenReviewDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewDialogOpen(true);
  };

  const handleReviewSuccess = async () => {
    // Refresh bookings after successful review
    try {
      const { data: { session: apiSession } } = await supabase.auth.getSession();
      if (!apiSession) return;

      const response = await fetch('/api/dashboard/bookings', {
        headers: {
          'Authorization': `Bearer ${apiSession.access_token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Error refreshing bookings:', err);
    }
  };

  // Calculate stats
  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    return bookingDate >= new Date();
  }).length;

  const completedBookings = bookings.filter(b => b.status === 'completed').length;

  // Get pending reviews (completed bookings not yet reviewed)
  const pendingReviews = bookings.filter(
    b => b.status === 'completed' && 
         !b.customer_reviewed && 
         b.cleaner_id && 
         b.cleaner_id !== 'manual'
  );

  // While loading, render the base layout with skeletons for a smoother experience

  if (error) {
    // Special case: Not authenticated
    if (error === 'UNAUTHENTICATED') {
      return (
        <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md mx-4">
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 text-primary mx-auto mb-4" />
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
    
    // Other errors - existing error UI
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <p className="text-sm text-gray-500 mb-6">Check browser console for detailed error information</p>
              <Button onClick={() => router.push('/')}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pb-32 lg:pb-0">
      <CustomerHeader 
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        user={user}
        customer={customer}
        onOpenMobileDrawer={() => setDrawerOpen(true)}
      />

      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
            className="mb-4 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0 order-1 sm:order-none">
                <h1 className="text-xl sm:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 truncate">
                  Welcome back, {customer?.firstName || user?.user_metadata?.first_name || 'there'}! <span className="hidden sm:inline">👋</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Manage your bookings and profile from your dashboard
                </p>
              </div>
              <div className="hidden sm:block flex-shrink-0 order-0 sm:order-none">
                <Button className="w-full sm:w-auto" asChild>
                  <Link href="/booking/service/select">Book a Service</Link>
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="lg:flex lg:items-start lg:gap-6">
            {/* Left navigation rail (desktop) */}
            <LeftRail />

            {/* Main content column */}
            <div className="flex-1 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.4, delay: shouldReduceMotion ? 0 : 0.2 }}
              >
                {/* Stat Cards - responsive grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <StatCard icon={User} label="Total Bookings" value={bookings.length} />
                  <StatCard icon={Loader2} label="Pending" value={bookings.filter(b => b.status === 'pending').length} />
                  <StatCard icon={AlertCircle} label="Upcoming" value={bookings.filter(b => new Date(b.booking_date) >= new Date()).length} />
                  <StatCard icon={AlertCircle} label="Completed" value={bookings.filter(b => b.status === 'completed').length} />
                </div>

                {/* Overview content (pending reviews etc.), recent list suppressed */}
                <OverviewTab
                  customer={customer}
                  bookings={bookings}
                  upcomingBookings={upcomingBookings}
                  completedBookings={completedBookings}
                  onOpenReviewDialog={handleOpenReviewDialog}
                  isLoading={isLoading}
                  hideRecentList
                />

                {/* Left: Bookings module. Right: Upcoming + Activity stacked */}
                <div className="mt-6 lg:grid lg:grid-cols-3 lg:gap-6">
                  <div className="lg:col-span-2">
                    <UnifiedBookings bookings={bookings} />
                  </div>
                  <div className="space-y-6 mt-6 lg:mt-0 lg:col-span-1">
                    <div className="hidden md:block">
                      <MessagesPanel bookings={bookings} />
                    </div>
                    <div className="hidden md:block">
                      <ActivityPanel bookings={bookings} />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right column reserved (empty for now) */}
          </div>
        </div>
      </section>

      {/* Mobile bottom CTA - Book a Service */}
      <div className="md:hidden fixed left-4 right-4 bottom-24 z-30">
        <Button className="w-full h-10 rounded-full text-sm" asChild>
          <Link href="/booking/service/select">Book a Service</Link>
        </Button>
      </div>

      {/* Review Dialog */}
      <CustomerReviewDialog
        booking={selectedBooking}
        open={reviewDialogOpen}
        onClose={() => {
          setReviewDialogOpen(false);
          setSelectedBooking(null);
        }}
        onSuccess={handleReviewSuccess}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          if (tab !== 'more') {
            setActiveTab(tab);
          }
        }}
        onMoreClick={() => setDrawerOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        customer={customer}
      />
    </div>
  );
}

