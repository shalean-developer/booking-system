'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bell, Menu, User as UserIcon } from 'lucide-react';

type Tab = 'overview' | 'bookings' | 'reviews';

interface CustomerHeaderProps {
	activeTab: Tab;
	onTabChange?: (tab: Tab) => void;
	user?: any;
	customer?: { firstName?: string; lastName?: string } | null;
	onOpenMobileDrawer?: () => void;
}

export function CustomerHeader({ activeTab, onTabChange, user, customer, onOpenMobileDrawer }: CustomerHeaderProps) {
	const router = useRouter();

	const tabs: { id: Tab; label: string; href: string }[] = [
		{ id: 'overview', label: 'Overview', href: '/dashboard' },
		{ id: 'bookings', label: 'Bookings', href: '/dashboard/bookings' },
		{ id: 'reviews', label: 'Reviews', href: '/dashboard/reviews' },
	];

	const handleTabClick = (tab: Tab, href: string) => {
		if (onTabChange) onTabChange(tab);
		router.push(href);
	};

	const displayName = customer?.firstName
		? `${customer.firstName}${customer?.lastName ? ` ${customer.lastName}` : ''}`
		: user?.user_metadata?.first_name || user?.email || 'Account';

	return (
		<header className="sticky top-0 z-40 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b border-gray-200">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
				{/* Left: Brand */}
				<div className="flex items-center gap-3 min-w-0">
					<Link href="/dashboard" className="flex items-center gap-2">
						<div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
							<span className="text-primary font-bold">S</span>
						</div>
						<span className="hidden sm:inline text-base font-semibold text-gray-900 truncate">Dashboard</span>
					</Link>
				</div>

				{/* Center: Tabs removed per request */}

				{/* Right: Actions */}
				<div className="flex items-center gap-2">
					{/* Book button moved to welcome section on dashboard */}
					<Button variant="ghost" size="icon" className="inline-flex">
						<Bell className="h-5 w-5 text-gray-700" />
					</Button>
					<Button variant="outline" className="hidden md:inline-flex gap-2" asChild>
						<Link href="/dashboard">
							<UserIcon className="h-4 w-4" />
							<span className="max-w-[140px] truncate">{displayName}</span>
						</Link>
					</Button>
					{/* Mobile menu */}
					<Button variant="outline" size="icon" className="md:hidden" onClick={onOpenMobileDrawer} aria-label="Open menu">
						<Menu className="h-5 w-5" />
					</Button>
				</div>
			</div>
		</header>
	);
}


