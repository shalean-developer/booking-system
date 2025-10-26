'use client';

import { Home, Calendar, Briefcase, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CleanerMobileBottomNavProps {
  activeTab?: 'dashboard' | 'my-jobs' | 'find-jobs' | 'more';
}

export function CleanerMobileBottomNav({ activeTab }: CleanerMobileBottomNavProps) {
  const pathname = usePathname();
  
  // Determine active tab based on current path
  const getActiveTab = () => {
    if (pathname === '/cleaner/dashboard') return 'dashboard';
    if (pathname === '/cleaner/dashboard/my-jobs') return 'my-jobs';
    if (pathname === '/cleaner/dashboard/find-jobs') return 'find-jobs';
    if (pathname === '/cleaner/dashboard/more') return 'more';
    return 'dashboard';
  };

  const currentActiveTab = activeTab || getActiveTab();

  const tabs = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: Home,
      href: '/cleaner/dashboard',
    },
    {
      id: 'my-jobs' as const,
      label: 'My Jobs',
      icon: Calendar,
      href: '/cleaner/dashboard/my-jobs',
    },
    {
      id: 'find-jobs' as const,
      label: 'Find Jobs',
      icon: Briefcase,
      href: '/cleaner/dashboard/find-jobs',
    },
    {
      id: 'more' as const,
      label: 'More',
      icon: MoreHorizontal,
      href: '/cleaner/dashboard/more',
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 sm:hidden">
      <div className="flex items-center justify-around py-2 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentActiveTab === tab.id;
          
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
        })}
      </div>
    </div>
  );
}

