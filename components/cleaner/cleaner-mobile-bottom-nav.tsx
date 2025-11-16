'use client';

import { Home, Calendar, CalendarClock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CleanerMobileBottomNavProps {
  activeTab?: 'home' | 'bookings' | 'earnings' | 'profile';
}

export function CleanerMobileBottomNav({ activeTab }: CleanerMobileBottomNavProps) {
  const pathname = usePathname();
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    // Normalize pathname (remove trailing slash and query params)
    const normalizedPath = pathname.split('?')[0].replace(/\/$/, '');
    
    // Check more specific paths first
    if (normalizedPath.startsWith('/cleaner/dashboard/my-jobs')) {
      return 'bookings';
    }
    if (normalizedPath.startsWith('/cleaner/dashboard/profile/payments')) {
      return 'earnings';
    }
    if (normalizedPath.startsWith('/cleaner/dashboard/profile')) {
      return 'profile';
    }
    // legacy aliases
    if (normalizedPath.startsWith('/cleaner/dashboard/availability') || normalizedPath.startsWith('/cleaner/dashboard/more')) {
      return 'earnings';
    }
    if (normalizedPath === '/cleaner/dashboard' || normalizedPath.startsWith('/cleaner/dashboard')) {
      return 'home';
    }
    return 'home';
  };

  const currentActiveTab = activeTab || getActiveTab();

  const tabs = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: Home,
      href: '/cleaner/dashboard',
    },
    {
      id: 'bookings' as const,
      label: 'Bookings',
      icon: Calendar,
      href: '/cleaner/dashboard/my-jobs',
    },
    {
      id: 'earnings' as const,
      label: 'Earnings',
      icon: CalendarClock,
      href: '/cleaner/dashboard/profile/payments',
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: User,
      href: '/cleaner/dashboard/profile',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200">
      <div className="flex items-center justify-around py-2 px-2 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActiveTab === tab.id;
          
          return (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={(e) => {
                console.log('Navigation clicked:', tab.label, tab.href);
              }}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-2 min-w-0 flex-1 transition-colors cursor-pointer relative z-10',
                isActive
                  ? 'text-[#3b82f6]'
                  : 'text-gray-600 hover:text-gray-900'
              )}
              aria-label={tab.label}
            >
              <Icon 
                className={cn(
                  'h-5 w-5 mb-1 pointer-events-none',
                  isActive ? 'text-[#3b82f6]' : 'text-gray-600'
                )}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className={cn(
                'text-xs font-medium truncate pointer-events-none',
                isActive ? 'text-[#3b82f6]' : 'text-gray-600'
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

