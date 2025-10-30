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
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden" role="navigation" aria-label="Customer dashboard bottom navigation">
      <div className="flex items-center justify-around py-2 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActiveTab === tab.id;
          
          if (tab.href) {
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  'flex flex-col items-center justify-center py-2 px-3 min-w-[64px] flex-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md',
                  isActive
                    ? 'text-primary'
                    : 'text-gray-600'
                )}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onTabChange?.(tab.id)}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 mb-0.5',
                    isActive && 'text-primary'
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    'text-[11px] leading-4 font-medium truncate',
                    isActive ? 'text-primary' : 'text-gray-600'
                  )}
                >
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
                  'flex flex-col items-center justify-center py-2 px-3 min-w-[64px] flex-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md',
                  'text-gray-600'
                )}
                aria-label={tab.label}
              >
                <Icon className="h-5 w-5 mb-0.5" aria-hidden="true" />
                <span className="text-[11px] leading-4 font-medium truncate">
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
