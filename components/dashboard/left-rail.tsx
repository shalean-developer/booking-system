'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Calendar, User, MapPin, CreditCard, DollarSign, Ticket, Share2, Star } from 'lucide-react';

type ItemId = 'home' | 'profile' | 'bookings' | 'sweepstars' | 'locations' | 'payments' | 'sweepcred' | 'vouchers' | 'refer';

const items: Array<{ id: ItemId; href?: string; label: string; icon: any; disabled?: boolean }> = [
    { id: 'home', href: '/dashboard', label: 'Home', icon: Home },
    { id: 'profile', label: 'Profile', icon: User, disabled: true },
    { id: 'bookings', href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
    { id: 'sweepstars', label: 'Cleaners', icon: Star, disabled: true },
    { id: 'locations', label: 'Locations', icon: MapPin, disabled: true },
    { id: 'payments', label: 'Payments', icon: CreditCard, disabled: true },
    { id: 'sweepcred', label: 'Credits', icon: DollarSign, disabled: true },
    { id: 'vouchers', label: 'Vouchers', icon: Ticket, disabled: true },
    { id: 'refer', label: 'Refer & Earn', icon: Share2, disabled: true },
];

export function LeftRail() {
	const pathname = usePathname();

	return (
		<aside className="hidden lg:block w-56 shrink-0" aria-label="Dashboard Navigation">
			<nav className="rounded-xl border bg-white shadow-sm p-3">
				<ul className="space-y-1">
                    {items.map(({ id, href, label, icon: Icon, disabled }) => {
                        const isActive = href ? pathname === href : false;
						return (
							<li key={id}>
                                {disabled || !href ? (
                                    <div
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400'
                                        )}
                                        aria-disabled="true"
                                    >
                                        <Icon className="h-4 w-4" aria-hidden="true" />
                                        <span className="truncate">{label}</span>
                                        <span className="ml-auto text-[10px]">Coming soon</span>
                                    </div>
                                ) : (
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
                                )}
							</li>
						);
					})}
				</ul>
			</nav>
		</aside>
	);
}


