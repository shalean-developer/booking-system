'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Calendar, User, MapPin, CreditCard, DollarSign, Ticket, Share2, Star, Sparkles } from 'lucide-react';

type ItemId = 'home' | 'profile' | 'bookings';

const primaryItems: Array<{ id: ItemId; href: string; label: string; icon: any }> = [
  { id: 'home', href: '/dashboard', label: 'Home', icon: Home },
  { id: 'bookings', href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
];

const upcomingItems = [
  { label: 'Profile', icon: User },
  { label: 'Preferred cleaners', icon: Star },
  { label: 'Saved locations', icon: MapPin },
  { label: 'Payments', icon: CreditCard },
  { label: 'Credits', icon: DollarSign },
  { label: 'Vouchers', icon: Ticket },
  { label: 'Refer & earn', icon: Share2 },
];

export function LeftRail() {
	const pathname = usePathname();

	return (
		<aside className="hidden lg:block w-56 shrink-0 space-y-4" aria-label="Dashboard Navigation">
			<nav className="rounded-xl border bg-white shadow-sm p-3">
				<ul className="space-y-1">
          {primaryItems.map(({ id, href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={id}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                    isActive ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
				</ul>
			</nav>
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4">
        <div className="flex items-start gap-2">
          <div className="mt-0.5">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Coming soon</p>
            <p className="text-xs text-gray-600 mt-1">
              We’re building more tools to help you manage your home in one place.
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-700">
              {upcomingItems.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <item.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
		</aside>
	);
}

