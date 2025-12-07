'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  CreditCard, 
  RefreshCw, 
  Star, 
  FileText, 
  Settings,
  TrendingUp,
  Home
} from 'lucide-react';

const navItems = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: Home,
  },
  {
    label: 'Bookings',
    href: '/dashboard/bookings',
    icon: Calendar,
  },
  {
    label: 'Payments',
    href: '/dashboard/payments',
    icon: CreditCard,
  },
  {
    label: 'Plans',
    href: '/dashboard/plans',
    icon: RefreshCw,
  },
  {
    label: 'Reviews',
    href: '/dashboard/reviews',
    icon: Star,
  },
  {
    label: 'Tickets',
    href: '/dashboard/tickets',
    icon: FileText,
  },
  {
    label: 'Analytics',
    href: '/dashboard/analytics',
    icon: TrendingUp,
  },
];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || 
          (item.href !== '/dashboard' && pathname?.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'hover:bg-teal-50 hover:text-teal-700',
              'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
              isActive
                ? 'bg-teal-50 text-teal-700'
                : 'text-gray-600'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
