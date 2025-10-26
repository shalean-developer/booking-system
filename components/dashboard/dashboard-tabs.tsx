'use client';

import Link from 'next/link';
import { Home, Calendar, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardTabsProps {
  activeTab: 'overview' | 'bookings' | 'reviews';
  onTabChange: (tab: 'overview' | 'bookings' | 'reviews') => void;
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  const tabs = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: Home,
    },
    {
      id: 'bookings' as const,
      label: 'My Bookings',
      icon: Calendar,
    },
    {
      id: 'reviews' as const,
      label: 'Reviews & Ratings',
      icon: Star,
    },
  ];

  return (
    <div className="border-b border-gray-200 mb-6 hidden lg:block">
      <nav className="flex space-x-1 overflow-x-auto" aria-label="Dashboard Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          // Determine href based on tab id
          const href = 
            tab.id === 'overview' ? '/dashboard' :
            tab.id === 'bookings' ? '/dashboard/bookings' : 
            '/dashboard/reviews';
          
          return (
            <Link
              key={tab.id}
              href={href}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
