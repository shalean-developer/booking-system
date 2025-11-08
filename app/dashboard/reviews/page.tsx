'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Star,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react';
import { CustomerHeader } from '@/components/dashboard/customer-header';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { MobileDrawer } from '@/components/dashboard/mobile-drawer';
import { ReviewsTab } from '@/components/dashboard/reviews-tab';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
import { QuickStartTasks } from '@/components/dashboard/quick-start-tasks';
import { ProfileQuickSetup } from '@/components/dashboard/profile-quick-setup';

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

export default function ReviewsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasBookings, setHasBookings] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const session = await safeGetSession(supabase);
        
        if (!session || !session.user) {
          console.log('Not authenticated - redirecting to login');
          router.push('/login');
          return;
        }
        
        const authUser = session.user;
        setUser(authUser);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
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
          throw new Error(data.error || 'Failed to fetch customer data');
        }

        setCustomer(data.customer);
        setHasBookings((data.bookings || []).length > 0);
        setIsLoading(false);

      } catch (err) {
        console.error('Reviews page error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load reviews');
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pb-20 lg:pb-0">
        <CustomerHeader activeTab="reviews" user={user} customer={customer} onOpenMobileDrawer={() => setDrawerOpen(true)} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading your reviews...</p>
          </div>
        </div>
        <MobileBottomNav activeTab="reviews" onTabChange={() => {}} onMoreClick={() => setDrawerOpen(true)} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pb-20 lg:pb-0">
        <CustomerHeader activeTab="reviews" user={user} customer={customer} onOpenMobileDrawer={() => setDrawerOpen(true)} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Reviews</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
        <MobileBottomNav activeTab="reviews" onTabChange={() => {}} onMoreClick={() => setDrawerOpen(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pb-20 lg:pb-0">
      <CustomerHeader
        activeTab="reviews"
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
              <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Desktop Tabs */}
              <div className="hidden lg:block">
                <DashboardTabs activeTab="reviews" onTabChange={() => {}} />
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews & Ratings</h1>
                <p className="text-gray-600">View your reviews and ratings</p>
              </div>

              {(!customer?.phone || !customer?.addressLine1 || !customer?.addressCity) && (
                <Card className="border border-dashed border-primary/40 bg-white shadow-sm mb-6">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900">Complete your profile</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Add your contact details once so cleaners can reach you after each visit.
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
                  badgeText="Boost your feedback"
                  title="Get ready to share helpful reviews"
                  subtitle="A little preparation makes it easy to give your cleaner shout-outs or highlight areas to improve."
                  tasks={[
                    {
                      id: 'learn',
                      title: 'See how reviews help your cleaner',
                      description: 'Discover what to mention so your cleaner knows exactly what worked.',
                      cta: 'Review tips',
                      icon: Star,
                      href: '/faq',
                      variant: 'outline',
                      completed: false,
                    },
                    {
                      id: 'reminder',
                      title: hasBookings ? 'Remember to review your next visit' : 'Book before you review',
                      description: hasBookings
                        ? 'We’ll send a quick reminder after each completed booking.'
                        : 'Schedule a clean to unlock ratings and reviews.',
                      cta: hasBookings ? 'View upcoming cleans' : 'Book now',
                      icon: MessageSquare,
                      href: hasBookings ? '/dashboard/bookings' : '/booking/service/select',
                      variant: 'default',
                      completed: false,
                    },
                    {
                      id: 'photos',
                      title: 'Collect before & after photos',
                      description: 'Photos make your feedback crystal clear and help your cleaner wow you next time.',
                      cta: 'Photo tips',
                      icon: ImageIcon,
                      href: '/faq',
                      variant: 'ghost',
                      completed: false,
                    },
                  ]}
                />
              </div>

              {/* Reviews Content */}
              <ReviewsTab />
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab="reviews" onTabChange={() => {}} onMoreClick={() => setDrawerOpen(true)} />

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
