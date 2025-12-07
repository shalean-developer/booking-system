'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bell, Menu, User as UserIcon, Home, RefreshCw } from 'lucide-react';

type Tab = 'overview' | 'bookings' | 'reviews';

interface CustomerHeaderProps {
	activeTab: Tab;
	onTabChange?: (tab: Tab) => void;
	user?: any;
	customer?: { firstName?: string; lastName?: string } | null;
	onOpenMobileDrawer?: () => void;
	onRefresh?: () => void;
}

export function CustomerHeader({ activeTab, onTabChange, user, customer, onOpenMobileDrawer, onRefresh }: CustomerHeaderProps) {
	const router = useRouter();

	const displayName = customer?.firstName
		? `${customer.firstName}${customer?.lastName ? ` ${customer.lastName}` : ''}`
		: user?.user_metadata?.first_name || user?.email || 'Account';

	return (
		<>
			{/* Blue Header - Cleaner Dashboard Style */}
			<header className="fixed top-0 left-0 right-0 z-50 bg-[#3b82f6] text-white">
				<div className="mx-auto max-w-md px-4 h-16 flex items-center justify-between">
					{/* Left: Brand/Home */}
					<Link href="/dashboard" className="flex items-center gap-2">
						<Home className="h-6 w-6" strokeWidth={2} />
						<span className="text-lg font-semibold">Home</span>
					</Link>

					{/* Right: Actions */}
					<div className="flex items-center gap-2">
						{onRefresh && (
							<button
								onClick={onRefresh}
								className="rounded-md border border-white/30 text-white text-xs px-2 py-1 hover:bg-white/10 transition-colors"
								aria-label="Refresh"
							>
								<RefreshCw className="h-4 w-4 inline mr-1" />
								Refresh
							</button>
						)}
						<Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
							<Bell className="h-5 w-5" />
						</Button>
						{/* Mobile menu */}
						<Button 
							variant="ghost" 
							size="icon" 
							className="text-white hover:bg-white/10" 
							onClick={onOpenMobileDrawer} 
							aria-label="Open menu"
						>
							<Menu className="h-5 w-5" />
						</Button>
					</div>
				</div>
			</header>

			{/* Greeting Banner - Below Header */}
			<div className="bg-[#3b82f6] text-white py-6 px-4 pt-24">
				<p className="text-base max-w-md mx-auto">
					Hi{displayName ? `, ${displayName}` : ''}. Here's what's going on today.
				</p>
			</div>
		</>
	);
}


