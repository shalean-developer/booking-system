'use client';

import { Home, Calendar, Star, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileBottomNavProps {
  activeTab?: 'overview' | 'bookings' | 'reviews' | 'more';
  onTabChange?: (tab: 'overview' | 'bookings' | 'reviews' | 'more') => void;
  onMoreClick?: () => void;
}

export function MobileBottomNav({ activeTab, onTabChange, onMoreClick }: MobileBottomNavProps) {
  const pathname = usePathname();
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname === '/dashboard') return 'overview';
    if (pathname === '/dashboard/bookings') return 'bookings';
    if (pathname === '/dashboard/reviews') return 'reviews';
    return 'overview';
  };

  const currentActiveTab = activeTab || getActiveTab();

  const tabs = [
    {
      id: 'overview' as const,
      label: 'Overview',
      icon: Home,
      href: '/dashboard',
    },
    {
      id: 'bookings' as const,
      label: 'Bookings',
      icon: Calendar,
      href: '/dashboard/bookings',
    },
    {
      id: 'reviews' as const,
      label: 'Reviews',
      icon: Star,
      href: '/dashboard/reviews',
    },
    {
      id: 'more' as const,
      label: 'More',
      icon: MoreHorizontal,
      href: null, // No href for more button
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActiveTab === tab.id;
          
          if (tab.href) {
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-gray-600'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 mb-1',
                  isActive && 'text-primary'
                )} />
                <span className={cn(
                  'text-xs font-medium truncate',
                  isActive ? 'text-primary' : 'text-gray-600'
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          } else {
            return (
              <button
                key={tab.id}
                onClick={onMoreClick}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors',
                  'text-gray-600'
                )}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium truncate">
                  {tab.label}
                </span>
              </button>
            );
          }
        })}
      </div>
    </div>
  );
}
