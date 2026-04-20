'use client';

import { Home, Briefcase, Calendar, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CleanerMobileBottomNavProps {
  activeTab?: 'home' | 'jobs' | 'schedule' | 'earnings' | 'profile';
}

export function CleanerMobileBottomNav({ activeTab }: CleanerMobileBottomNavProps) {
  const pathname = usePathname();

  const getActiveTab = (): 'home' | 'jobs' | 'schedule' | 'earnings' | 'profile' => {
    const normalizedPath = pathname.split('?')[0].replace(/\/$/, '');

    if (
      normalizedPath.startsWith('/cleaner/dashboard/find-jobs') ||
      normalizedPath.startsWith('/cleaner/jobs')
    ) {
      return 'jobs';
    }
    if (
      normalizedPath.startsWith('/cleaner/dashboard/calendar') ||
      normalizedPath.startsWith('/cleaner/schedule')
    ) {
      return 'schedule';
    }
    if (
      normalizedPath.startsWith('/cleaner/earnings') ||
      normalizedPath.startsWith('/cleaner/dashboard/profile/payments')
    ) {
      return 'earnings';
    }
    if (normalizedPath.startsWith('/cleaner/dashboard/profile')) {
      return 'profile';
    }
    if (normalizedPath.startsWith('/cleaner/dashboard/my-jobs')) {
      return 'schedule';
    }
    if (normalizedPath === '/cleaner/dashboard' || normalizedPath === '/cleaner') {
      return 'home';
    }
    if (normalizedPath.startsWith('/cleaner/dashboard')) {
      return 'home';
    }
    return 'home';
  };

  const currentActiveTab = activeTab || getActiveTab();

  const tabs = [
    { id: 'home' as const, label: 'Home', icon: Home, href: '/cleaner/dashboard' },
    { id: 'jobs' as const, label: 'Jobs', icon: Briefcase, href: '/cleaner/jobs' },
    { id: 'schedule' as const, label: 'Schedule', icon: Calendar, href: '/cleaner/schedule' },
    { id: 'earnings' as const, label: 'Earnings', icon: Wallet, href: '/cleaner/earnings' },
    { id: 'profile' as const, label: 'Profile', icon: User, href: '/cleaner/dashboard/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom,0px)]">
      <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActiveTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1 transition-colors rounded-xl',
                isActive ? 'text-[#2563eb]' : 'text-gray-600 hover:text-gray-900'
              )}
              aria-label={tab.label}
            >
              <Icon
                className={cn(
                  'h-6 w-6 mb-0.5 pointer-events-none',
                  isActive ? 'text-[#2563eb]' : 'text-gray-500'
                )}
                strokeWidth={isActive ? 2.25 : 1.5}
              />
              <span
                className={cn(
                  'text-[10px] font-semibold truncate pointer-events-none max-w-[4.5rem] text-center leading-tight',
                  isActive ? 'text-[#2563eb]' : 'text-gray-600'
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

