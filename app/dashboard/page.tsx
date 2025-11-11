'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  Info,
  ShieldCheck,
  CalendarCheck,
  MessageCircle,
} from 'lucide-react';
import { CustomerReviewDialog } from '@/components/review/customer-review-dialog';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { MobileDrawer } from '@/components/dashboard/mobile-drawer';
import { OverviewTab } from '@/components/dashboard/overview-tab';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { StatCard } from '@/components/dashboard/StatCard';
import { UpcomingPanel } from '@/components/dashboard/upcoming-panel';
import { MessagesPanel } from '@/components/dashboard/messages-panel';
import { ActivityPanel } from '@/components/dashboard/activity-panel';
import { LeftRail } from '@/components/dashboard/left-rail';
import { CustomerHeader } from '@/components/dashboard/customer-header';
import { UnifiedBookings } from '@/components/dashboard/unified-bookings';
import { QuickStartTasks } from '@/components/dashboard/quick-start-tasks';
import { ProfileQuickSetup } from '@/components/dashboard/profile-quick-setup';

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
  phone?: string | null;
  addressLine1?: string | null;
  addressSuburb?: string | null;
  addressCity?: string | null;
  totalBookings: number;
}

// Hook to detect reduced motion preference (replaces framer-motion's useReducedMotion)
function useReducedMotion() {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setShouldReduceMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return shouldReduceMotion;
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
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

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
          <CustomerHeader 
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab)}
            user={user}
            customer={customer}
            onOpenMobileDrawer={() => setDrawerOpen(true)}
          />
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
        <CustomerHeader 
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          user={user}
          customer={customer}
          onOpenMobileDrawer={() => setDrawerOpen(true)}
        />
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

  const hasProfileDetails = Boolean(customer?.phone && customer?.addressLine1 && customer?.addressCity);
  const hasBookings = bookings.length > 0;

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
          <div
            className={`mb-4 sm:mb-8 ${shouldReduceMotion ? '' : 'animate-fade-in-up'}`}
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
            {!isLoading && !customer && (
              <Card className="mt-4 border-2 border-dashed border-primary/40 bg-primary/5">
                <CardContent className="p-5 sm:p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      <Info className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                        Your dashboard is almost ready
                      </h2>
                      <p className="text-sm text-gray-600">
                        As soon as you make your first booking, we’ll populate your stats and history here. Need a hand? Our team is happy to help.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col lg:flex-row">
                    <Button className="sm:w-full lg:w-auto" asChild>
                      <Link href="/booking/service/select">Book your first service</Link>
                    </Button>
                    <Button variant="outline" className="sm:w-full lg:w-auto" asChild>
                      <Link href="/contact">Contact support</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

              {!isLoading && (
            <div className="space-y-4 sm:space-y-6 mb-6">
              <QuickStartTasks
                badgeText="Getting Started"
                title="Make the most of your dashboard"
                subtitle="Work through these steps to set up your profile, book a visit, and reach our team any time."
                tasks={[
                  {
                    id: 'profile',
                    title: hasProfileDetails ? 'Profile set up' : 'Add your details',
                    description: hasProfileDetails
                      ? 'Update your saved contact info any time.'
                      : 'Store your contact info so we can reach you quickly.',
                    cta: hasProfileDetails ? 'View details' : 'Add details',
                    icon: ShieldCheck,
                    onClick: () => setProfileSheetOpen(true),
                    variant: hasProfileDetails ? 'outline' : 'default',
                    completed: hasProfileDetails,
                  },
                  {
                    id: 'book',
                    title: hasBookings ? 'Plan your next clean' : 'Book your first clean',
                    description: 'Pick a service, date, and we’ll match you with a pro.',
                    cta: hasBookings ? 'Book again' : 'Book now',
                    icon: CalendarCheck,
                    href: '/booking/service/select',
                    variant: 'default',
                    completed: hasBookings,
                  },
                  {
                    id: 'support',
                    title: 'Ask us anything',
                    description: 'Need help deciding? Chat with our friendly support team.',
                    cta: 'Contact support',
                    icon: MessageCircle,
                    href: '/contact',
                    variant: 'ghost',
                    completed: false,
                  },
                ]}
              />
            </div>
          )}

          <div className="lg:flex lg:items-start lg:gap-6">
            {/* Left navigation rail (desktop) */}
            <LeftRail />

            {/* Main content column */}
            <div className="flex-1 min-w-0">
              <div className={shouldReduceMotion ? '' : 'animate-fade-in-up-delayed'}>
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
              </div>
            </div>

            {/* Right column reserved (empty for now) */}
          </div>
        </div>
      </section>

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
        onEditProfile={() => setProfileSheetOpen(true)}
      />

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
    </div>
  );
}

