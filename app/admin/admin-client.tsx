'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/header';
import { Loader2 } from 'lucide-react';

// Lazy load sections for better performance
const StatsSection = dynamic(
  () => import('@/components/admin/stats-section').then(m => ({ default: m.StatsSection })),
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

type TabType = 'dashboard' | 'bookings' | 'customers' | 'cleaners' | 'applications' | 'pricing' | 'blog';

export function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your cleaning service business</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'bookings', label: 'Bookings' },
              { id: 'customers', label: 'Customers' },
              { id: 'cleaners', label: 'Cleaners' },
              { id: 'pricing', label: 'Pricing' },
              { id: 'blog', label: 'Blog' },
              { id: 'applications', label: 'Applications' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content - Only render active tab */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'dashboard' && <StatsSection />}
          {activeTab === 'bookings' && <BookingsSection />}
          {activeTab === 'customers' && <CustomersSection />}
          {activeTab === 'cleaners' && <CleanersSection />}
          {activeTab === 'pricing' && <PricingSection />}
          {activeTab === 'blog' && <BlogSection />}
          {activeTab === 'applications' && <ApplicationsSection />}
        </div>
      </div>
    </div>
  );
}

