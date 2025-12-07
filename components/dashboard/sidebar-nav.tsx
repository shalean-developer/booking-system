'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  CreditCard, 
  RefreshCw, 
  Star, 
  FileText, 
  TrendingUp,
  Home
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
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

interface NavLinkProps {
  item: NavItem;
  isActive: boolean;
}

const NavLink = memo(function NavLink({ item, isActive }: NavLinkProps) {
  const Icon = item.icon;
  
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors',
        'hover:bg-teal-50 hover:text-teal-700',
        'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
        isActive
          ? 'bg-teal-50 text-teal-700'
          : 'text-gray-600'
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
});

NavLink.displayName = 'NavLink';

export const SidebarNav = memo(function SidebarNav() {
  const pathname = usePathname();

  // Memoize active state calculation for each item
  const navItemsWithActiveState = useMemo(() => {
    return navItems.map((item) => ({
      ...item,
      isActive: pathname === item.href || 
        (item.href !== '/dashboard' && pathname?.startsWith(item.href)),
    }));
  }, [pathname]);

  return (
    <Card className="hidden lg:block w-full">
      <CardContent className="p-3">
        <nav className="space-y-0.5" aria-label="Dashboard navigation">
          {navItemsWithActiveState.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={item.isActive}
            />
          ))}
        </nav>
      </CardContent>
    </Card>
  );
});

SidebarNav.displayName = 'SidebarNav';
