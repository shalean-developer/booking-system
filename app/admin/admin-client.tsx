'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminTopNav } from '@/components/admin/admin-top-nav';
import { AdminWelcome } from '@/components/admin/admin-welcome';
import { AdminQuickGrid } from '@/components/admin/admin-quick-grid';
import { AdminBottomCards } from '@/components/admin/admin-bottom-cards';
import { Loader2, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lazy load sections for better performance
const AdminDashboardView = dynamic(
  () => import('@/components/admin/admin-dashboard-view').then(m => ({ default: m.AdminDashboardView })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const AdminDashboardViewV2 = dynamic(
  () => import('@/components/admin/admin-dashboard-view-v2').then(m => ({ default: m.AdminDashboardViewV2 })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const DashboardPageNew = dynamic(
  () => import('@/components/admin/dashboard-page-new').then(m => ({ default: m.default })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const BookingsSection = dynamic(
  () => import('@/components/admin/bookings-section').then(m => ({ default: m.BookingsSection })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const CustomersSection = dynamic(
  () => import('@/components/admin/customers-section').then(m => ({ default: m.CustomersSection })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const CleanersSection = dynamic(
  () => import('@/components/admin/cleaners-section').then(m => ({ default: m.CleanersSection })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const ApplicationsSection = dynamic(
  () => import('@/components/admin/applications-section').then(m => ({ default: m.ApplicationsSection })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const PricingSection = dynamic(
  () => import('@/components/admin/pricing-section').then(m => ({ default: m.PricingSection })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const BlogSection = dynamic(
  () => import('@/components/admin/blog-section').then(m => ({ default: m.BlogSection })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const QuotesSection = dynamic(
  () => import('@/components/admin/quotes-section').then(m => ({ default: m.QuotesSection })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const ReviewsSection = dynamic(
  () => import('@/components/admin/reviews-section'),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const RecurringSchedulesSection = dynamic(
  () => import('@/components/admin/recurring-schedules-section').then(m => ({ default: m.RecurringSchedulesSection })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

const UsersSection = dynamic(
  () => import('@/components/admin/users-section').then(m => ({ default: m.UsersSection })),
  { 
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
    ssr: false 
  }
);

type TabType = 'dashboard' | 'bookings' | 'recurring' | 'customers' | 'cleaners' | 'applications' | 'pricing' | 'blog' | 'quotes' | 'reviews' | 'users';
type DashboardViewType = 'new' | 'v2';

interface AdminDashboardClientProps {
  userName: string;
  lastLogin?: string | null;
}

export function AdminDashboardClient({ userName, lastLogin }: AdminDashboardClientProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dashboardView, setDashboardView] = useState<DashboardViewType>('new');

  // Load initial tab from URL pathname or query parameter
  useEffect(() => {
    // Check pathname first - if on /admin/blog, set tab to 'blog'
    if (pathname?.includes('/admin/blog')) {
      setActiveTab('blog');
      return;
    }
    
    // Otherwise, check query parameter
    const tabParam = searchParams?.get('tab');
    if (tabParam && ['dashboard', 'bookings', 'recurring', 'customers', 'cleaners', 'applications', 'pricing', 'blog', 'quotes', 'reviews', 'users'].includes(tabParam)) {
      setActiveTab(tabParam as TabType);
    }
  }, [searchParams, pathname]);

  // Load dashboard view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('admin-dashboard-view') as DashboardViewType;
    if (savedView === 'new' || savedView === 'v2') {
      setDashboardView(savedView);
    }
  }, []);

  // Save dashboard view preference to localStorage
  useEffect(() => {
    localStorage.setItem('admin-dashboard-view', dashboardView);
  }, [dashboardView]);

  // Listen for tab change events from dashboard cards
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const tabName = event.detail;
      if (['dashboard', 'bookings', 'recurring', 'customers', 'cleaners', 'applications', 'pricing', 'blog', 'quotes', 'reviews', 'users'].includes(tabName)) {
        setActiveTab(tabName as TabType);
        // Smooth scroll to top of content
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener('admin-tab-change', handleTabChange as EventListener);
    return () => {
      window.removeEventListener('admin-tab-change', handleTabChange as EventListener);
    };
  }, []);

  const handleNavigate = (tab: string) => {
    setActiveTab(tab as TabType);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-16">
        {/* Top Navigation */}
        <AdminTopNav onNavigate={handleNavigate} activeTab={activeTab} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'dashboard' ? (
              <div className="space-y-4">
                {/* Dashboard View Switcher */}
                <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Dashboard View:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={dashboardView === 'new' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDashboardView('new')}
                      className="text-xs"
                    >
                      View New
                    </Button>
                    <Button
                      variant={dashboardView === 'v2' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDashboardView('v2')}
                      className="text-xs"
                    >
                      View V2
                    </Button>
                  </div>
                </div>
                {/* Render selected dashboard view */}
                {dashboardView === 'new' ? <DashboardPageNew /> : <AdminDashboardViewV2 />}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {activeTab === 'bookings' && <BookingsSection />}
                {activeTab === 'recurring' && <RecurringSchedulesSection />}
                {activeTab === 'quotes' && <QuotesSection />}
                {activeTab === 'customers' && <CustomersSection />}
                {activeTab === 'users' && <UsersSection />}
                {activeTab === 'cleaners' && <CleanersSection />}
                {activeTab === 'reviews' && <ReviewsSection />}
                {activeTab === 'pricing' && <PricingSection />}
                {activeTab === 'blog' && <BlogSection />}
                {activeTab === 'applications' && <ApplicationsSection />}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

