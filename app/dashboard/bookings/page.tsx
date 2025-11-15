'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// import { Header } from '@/components/header';
import { CustomerHeader } from '@/components/dashboard/customer-header';
import { supabase } from '@/lib/supabase-client';
import { safeLogout, safeGetSession, handleRefreshTokenError } from '@/lib/logout-utils';
import { toast } from 'sonner';
import { 
  User, 
  Loader2,
  Briefcase,
  Home,
  Mail,
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { CustomerReviewDialog } from '@/components/review/customer-review-dialog';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { MobileDrawer } from '@/components/dashboard/mobile-drawer';
import { BookingsTab } from '@/components/dashboard/bookings-tab';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { QuickStartTasks } from '@/components/dashboard/quick-start-tasks';
import { ProfileQuickSetup } from '@/components/dashboard/profile-quick-setup';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service_type: string;
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

export default function BookingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  useEffect(() => {
    // NEW BOOKING FLOW HANDLER: If ref parameter is present, redirect to confirmation immediately
    // This handles cases where external services redirect here with a booking reference
    // Guest-friendly booking flow - redirects directly to confirmation, bypasses all auth
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    
    // If ref parameter exists, this is from the new guest booking flow
    // Redirect immediately to confirmation page - no authentication required
    if (refParam) {
      const confirmationUrl = `${window.location.origin}/booking/confirmation?ref=${encodeURIComponent(refParam)}`;
      console.log('✅ New booking flow: Ref parameter detected, redirecting to confirmation');
      console.log('✅ Ref:', refParam);
      console.log('✅ Redirecting to:', confirmationUrl);
      
      // Update sessionStorage for confirmation page
      sessionStorage.setItem('payment_complete', 'true');
      sessionStorage.setItem('redirect_target', confirmationUrl);
      sessionStorage.setItem('last_booking_ref', refParam);
      
      // Immediate redirect - bypasses all auth checks and dashboard logic
      // Guest booking flow goes directly to confirmation
      window.location.replace(confirmationUrl);
      return; // CRITICAL: Stop execution here - don't run any other code
    }
    
    // TEMPORARILY COMMENTED OUT: Dashboard redirect logic disabled to fix payment redirect
    // TODO: Re-enable after fixing direct redirect from payment success
    
    /*
    // CRITICAL: Check if payment was just completed and redirect to confirmation instead
    // This MUST run FIRST, before any auth checks or data fetching
    const redirectInProgress = sessionStorage.getItem('redirect_in_progress');
    const paymentComplete = sessionStorage.getItem('payment_complete');
    const redirectTarget = sessionStorage.getItem('redirect_target');
    
    // Check if we have a ref parameter in URL (indicates redirect from Paystack)
    const urlParams = new URLSearchParams(window.location.search);
    const refParam = urlParams.get('ref');
    
    // CRITICAL: Paystack redirects server-side AFTER payment succeeds
    // If Paystack redirects to /dashboard/bookings?ref=..., payment was successful
    // However, JavaScript callback might not have executed yet, so payment_complete might not be set
    // We should ONLY redirect if payment_complete is true OR if redirect_target matches the ref pattern
    
    // If we have a ref param AND payment_complete is true, redirect immediately
    if (refParam && paymentComplete === 'true') {
      const confirmationUrl = `${window.location.origin}/booking/confirmation?ref=${encodeURIComponent(refParam)}`;
      console.log('🔍 Dashboard bookings: Ref parameter + payment_complete detected, redirecting to confirmation');
      console.log('🔍 Ref from URL:', refParam);
      console.log('🔍 Constructed confirmation URL:', confirmationUrl);
      
      // Update sessionStorage with the correct URL (using ref from URL)
      sessionStorage.setItem('redirect_target', confirmationUrl);
      sessionStorage.setItem('last_booking_ref', refParam);
      
      // Immediate redirect
      window.location.replace(confirmationUrl);
      return;
    }
    
    // If we have a ref param but payment_complete is not set yet, verify payment was successful
    // Paystack only redirects here if payment succeeded, so ref param = payment succeeded
    // But we wait a moment for JavaScript callback to set payment_complete, then redirect
    if (refParam && paymentComplete !== 'true') {
      console.log('🔍 Dashboard bookings: Ref parameter detected but payment_complete not set yet');
      console.log('🔍 Ref from URL:', refParam);
      console.log('🔍 Paystack redirects here only after successful payment, so payment succeeded');
      console.log('🔍 Waiting briefly for JavaScript callback, then redirecting...');
      
      // Set payment complete flag (Paystack redirect = payment succeeded)
      sessionStorage.setItem('payment_complete', 'true');
      sessionStorage.setItem('last_booking_ref', refParam);
      
      // Wait a short moment for JavaScript callback to execute, then redirect
      // This gives the onPaymentSuccess callback time to save the booking
      setTimeout(() => {
        const confirmationUrl = `${window.location.origin}/booking/confirmation?ref=${encodeURIComponent(refParam)}`;
        sessionStorage.setItem('redirect_target', confirmationUrl);
        console.log('🔍 Redirecting to confirmation after brief wait:', confirmationUrl);
        window.location.replace(confirmationUrl);
      }, 500); // 500ms should be enough for callback to start
      return;
    }
    
    // If payment complete flag is set, redirect to confirmation
    if (paymentComplete === 'true' && redirectTarget && redirectInProgress !== 'true') {
      console.log('🔍 Dashboard bookings: Payment complete detected, redirecting to confirmation');
      console.log('🔍 Redirect target:', redirectTarget);
      
      // Mark redirect as in progress to prevent flickering
      sessionStorage.setItem('redirect_in_progress', 'true');
      
      // Single redirect - no setTimeout checks to prevent flickering
      try {
        window.location.replace(redirectTarget);
        console.log('✅ Redirect initiated from dashboard bookings');
      } catch (error) {
        console.error('❌ Redirect error:', error);
        // Clear flag on error
        sessionStorage.removeItem('redirect_in_progress');
      }
      return;
    } else if (redirectInProgress === 'true') {
      console.log('⏸️ Redirect already in progress, skipping duplicate redirect');
      return;
    }
    */

    const checkAuthAndFetchData = async () => {
      try {
        const session = await safeGetSession(supabase);
        
        // DISABLED: Redirect to login when not authenticated
        // User requested to stop this redirect behavior
        if (!session || !session.user) {
          console.log('Not authenticated - staying on page (redirect disabled)');
          setIsLoading(false);
          setError('Please log in to view your bookings');
          return;
        }
        
        const authUser = session.user;
        setUser(authUser);

        // Get session token for API call with error handling
        let apiSession;
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            if (handleRefreshTokenError(error)) {
              // DISABLED: Redirect to login on token error
              console.log('Token error - staying on page (redirect disabled)');
              setIsLoading(false);
              setError('Session expired. Please refresh the page.');
              return;
            }
            throw error;
          }
          apiSession = data.session;
        } catch (error: any) {
          if (handleRefreshTokenError(error)) {
            // DISABLED: Redirect to login on token error
            console.log('Token error in catch - staying on page (redirect disabled)');
            setIsLoading(false);
            setError('Session expired. Please refresh the page.');
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

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Failed to fetch bookings');
        }

        setCustomer(data.customer);
        setBookings(data.bookings);
        setIsLoading(false);

      } catch (err) {
        console.error('Bookings page error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  const handleOpenReviewDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewDialogOpen(true);
  };

  const handleReviewSuccess = async () => {
    try {
      let apiSession;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error && handleRefreshTokenError(error)) {
          return;
        }
        apiSession = data.session;
      } catch (error: any) {
        if (handleRefreshTokenError(error)) {
          return;
        }
        throw error;
      }
      
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pb-20 lg:pb-0">
        <CustomerHeader activeTab="bookings" user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading your bookings...</p>
          </div>
        </div>
        <MobileBottomNav activeTab="bookings" onTabChange={() => {}} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pb-20 lg:pb-0">
        <CustomerHeader activeTab="bookings" user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Bookings</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
        <MobileBottomNav activeTab="bookings" onTabChange={() => {}} />
      </div>
    );
  }

  const hasProfileDetails = Boolean(customer?.phone && customer?.addressLine1 && customer?.addressCity);
  const hasBookings = bookings.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pb-20 lg:pb-0">
      <CustomerHeader
        activeTab="bookings"
        user={user}
        customer={customer}
        onOpenMobileDrawer={() => setDrawerOpen(true)}
      />

      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Desktop Tabs */}
              <div className="hidden lg:block">
                <DashboardTabs activeTab="bookings" onTabChange={() => {}} />
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
                <p className="text-gray-600">Manage and view all your bookings</p>
              </div>

              {!hasProfileDetails && (
                <Card className="border border-dashed border-primary/40 bg-white shadow-sm mb-6">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">Complete your profile</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Add your phone and address so every booking is confirmed faster.
                      </p>
                    </div>
                    <div className="flex gap-2 sm:flex-row flex-col w-full sm:w-auto">
                      <Button className="flex-1 sm:flex-none" onClick={() => setProfileSheetOpen(true)}>
                        Add details
                      </Button>
                      <Button variant="outline" className="flex-1 sm:flex-none" asChild>
                        <Link href="/contact">Need help?</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="mb-6">
                <QuickStartTasks
                  badgeText="Stay on top of your schedule"
                  title={hasBookings ? 'Keep your bookings running smoothly' : 'Get your first booking on the calendar'}
                  subtitle="Use these shortcuts to plan your cleanings, adjust frequency, or reach our support team."
                  tasks={[
                    {
                      id: 'plan',
                      title: hasBookings ? 'Plan another clean' : 'Plan your first clean',
                      description: 'Choose a service and time that fits your week.',
                      cta: hasBookings ? 'Book again' : 'Book now',
                      icon: CalendarCheck,
                      href: '/booking/service/select',
                      variant: 'default',
                      completed: hasBookings,
                    },
                    {
                      id: 'recurring',
                      title: 'Set up a routine',
                      description: 'Prefer weekly or bi-weekly? We’ll help you lock in a recurring slot.',
                      cta: 'Request recurring service',
                      icon: RefreshCw,
                      href: '/contact',
                      variant: 'outline',
                      completed: false,
                    },
                    {
                      id: 'prep',
                      title: 'Read prep tips',
                      description: 'See how to prepare your home and what to expect on the day.',
                      cta: 'View tips',
                      icon: BookOpen,
                      href: '/faq',
                      variant: 'ghost',
                      completed: false,
                    },
                  ]}
                />
              </div>

              {/* Bookings Content */}
              <BookingsTab
                bookings={bookings}
                onOpenReviewDialog={handleOpenReviewDialog}
              />
            </div>

            {/* Sidebar - Profile & Quick Actions */}
            <DashboardSidebar
              user={user}
              customer={customer}
              onEditProfile={() => setProfileSheetOpen(true)}
            />
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
        activeTab="bookings"
        onTabChange={() => {}}
        onMoreClick={() => setDrawerOpen(true)}
      />

      <MobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        customer={customer}
        onEditProfile={() => {
          setDrawerOpen(false);
          setProfileSheetOpen(true);
        }}
      />

      <ProfileQuickSetup
        open={profileSheetOpen}
        onOpenChange={setProfileSheetOpen}
        customer={customer}
        onUpdated={(updated) =>
          setCustomer((prev) =>
            prev
              ? { ...prev, ...updated }
              : { ...updated, totalBookings: 0 }
          )
        }
      />
    </div>
  );
}
