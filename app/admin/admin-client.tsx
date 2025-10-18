'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { StatsSection } from '@/components/admin/stats-section';
import { BookingsSection } from '@/components/admin/bookings-section';
import { CustomersSection } from '@/components/admin/customers-section';
import { CleanersSection } from '@/components/admin/cleaners-section';
import { ApplicationsSection } from '@/components/admin/applications-section';
import { PricingSection } from '@/components/admin/pricing-section';
import { BlogSection } from '@/components/admin/blog-section';

type TabType = 'dashboard' | 'bookings' | 'customers' | 'cleaners' | 'applications' | 'pricing' | 'blog';

export function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  console.log('=== ADMIN CLIENT DEBUG ===');
  console.log('Active tab:', activeTab);
  console.log('StatsSection component:', StatsSection);

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
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'dashboard' && (
            <>
              {console.log('Rendering StatsSection...')}
              <StatsSection />
            </>
          )}
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

