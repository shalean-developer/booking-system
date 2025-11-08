'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerBookingDetailsModal } from './customer-booking-details-modal';

type Segment = 'upcoming' | 'completed' | 'cancelled';

interface Booking {
	id: string;
	booking_date: string;
	booking_time: string;
	service_type: string;
	status: string;
	total_amount?: number;
	created_at: string;
	address_line1: string;
	address_suburb: string;
}

interface UnifiedBookingsProps {
	bookings: Booking[];
}

export function UnifiedBookings({ bookings }: UnifiedBookingsProps) {
    const [segment, setSegment] = useState<Segment>('upcoming');
    const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);
    const serviceTypeToSlug = (service: string): string => {
        const normalized = service.toLowerCase();
        if (normalized.includes('move')) return 'move-in-out';
        if (normalized.includes('standard')) return 'standard';
        if (normalized.includes('deep')) return 'deep';
        if (normalized.includes('airbnb')) return 'airbnb';
        return 'standard';
    };
    const segments: { id: Segment; label: string }[] = [
        { id: 'upcoming', label: 'Upcoming' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' },
    ];

	const upcoming = useMemo(
		() =>
			bookings
				.filter(b => new Date(b.booking_date) >= new Date())
				.sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()),
		[bookings]
	);

	const completedBookings = useMemo(
		() => bookings.filter(b => b.status === 'completed').slice().sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()),
		[bookings]
	);

	const cancelledBookings = useMemo(
		() => bookings.filter(b => b.status === 'cancelled' || b.status === 'canceled').slice().sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()),
		[bookings]
	);

		const renderBookingItem = (b: Booking) => (
			<div key={b.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow mb-4 sm:mb-5 last:mb-0">
			<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-1 sm:mb-2">
						<h3 className="text-sm sm:text-base font-semibold text-gray-900">{b.service_type}</h3>
						<Badge 
							variant={b.status === 'completed' ? 'default' : 'outline'}
							className={cn('text-xs',
								b.status === 'completed' && 'bg-green-100 text-green-800 border-green-200',
								b.status === 'accepted' && 'bg-blue-100 text-blue-800 border-blue-200',
								b.status === 'pending' && 'bg-yellow-100 text-yellow-800 border-yellow-200'
							)}
						>
							{b.status}
						</Badge>
                </div>
                    <div className="space-y-1 text-xs sm:text-sm text-gray-600">
						<div className="flex items-center gap-2">
							<Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
							<span className="sm:hidden">{new Date(b.booking_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}</span>
							<span className="hidden sm:inline">{new Date(b.booking_date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
						</div>
						<div className="flex items-center gap-2">
							<Clock className="h-3 w-3 sm:h-4 sm:w-4" />
							<span>{b.booking_time}</span>
						</div>
						<div className="flex items-center gap-2">
							<MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
							<span className="sm:hidden">{b.address_suburb}</span>
							<span className="hidden sm:inline">{b.address_line1}, {b.address_suburb}</span>
						</div>
					</div>
				</div>
				<div className="text-left sm:text-right">
					{typeof b.total_amount === 'number' ? (
						<p className="text-lg sm:text-2xl font-bold text-primary">R{(b.total_amount / 100).toFixed(2)}</p>
					) : (
						<p className="text-lg sm:text-2xl font-bold text-gray-400">—</p>
					)}
					<p className="text-xs text-gray-500 mt-1">Booked {new Date(b.created_at).toLocaleDateString()}</p>
				</div>
			</div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setDetailsBooking(b)}>
                    View details
                </Button>
				<Button variant="outline" size="sm" asChild>
					<Link href={{ pathname: `/booking/service/${serviceTypeToSlug(b.service_type)}/schedule`, query: { rescheduleId: b.id } }}>Reschedule</Link>
				</Button>
                <Button variant="secondary" size="sm" asChild>
                    <Link href={{ pathname: `/booking/service/${serviceTypeToSlug(b.service_type)}/schedule`, query: { rebookId: b.id } }}>Rebook</Link>
                </Button>
			</div>
		</div>
	);

    return (
        <>
        <Card className="border-0 shadow-lg">
			<CardContent className="p-4 sm:p-6">
				<div>
				<div className="mb-4 sm:mb-6">
					<h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3">Bookings</h2>
                    <div role="tablist" aria-label="Bookings segments" className="inline-flex rounded-lg border bg-white p-1">
                        {segments.map(seg => (
							<button
								key={seg.id}
								type="button"
								role="tab"
								aria-selected={segment === seg.id}
								className={cn(
									'px-3 py-1.5 text-sm rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
									segment === seg.id ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'
								)}
								onClick={() => setSegment(seg.id)}
							>
								{seg.label}
							</button>
						))}
				</div>

				{segment === 'upcoming' && (
					<div className="space-y-4 sm:space-y-5">
						{upcoming.length === 0 ? (
							<div className="text-center py-12 space-y-4">
								<p className="text-base font-semibold text-gray-900">No upcoming bookings yet</p>
								<p className="text-sm text-gray-600 px-6">
									Choose a service and we’ll handle the rest. Not sure which option fits? Chat with our team.
								</p>
								<div className="flex flex-col sm:flex-row sm:justify-center gap-2 px-6 pb-4">
									<Button asChild className="sm:min-w-[180px]">
										<Link href="/booking/service/select">Book a Service</Link>
									</Button>
									<Button variant="outline" asChild className="sm:min-w-[180px]">
										<Link href="/contact">Talk to support</Link>
									</Button>
								</div>
							</div>
						) : (
							upcoming.slice(0, 5).map(renderBookingItem)
						)}
					</div>
				)}

				{segment === 'completed' && (
					<div className="space-y-4 sm:space-y-5">
						{completedBookings.length === 0 ? (
							<div className="text-center py-12 space-y-4">
								<p className="text-base font-semibold text-gray-900">No completed bookings yet</p>
								<p className="text-sm text-gray-600 px-6">
									When your cleans are finished, you’ll find the details here for quick rebooking.
								</p>
								<Button asChild className="sm:min-w-[160px]">
									<Link href="/booking/service/select">Schedule a clean</Link>
								</Button>
							</div>
						) : (
							completedBookings.slice(0, 10).map(renderBookingItem)
						)}
					</div>
				)}

				{segment === 'cancelled' && (
					<div className="space-y-4 sm:space-y-5">
						{cancelledBookings.length === 0 ? (
							<div className="text-center py-12 space-y-4">
								<p className="text-base font-semibold text-gray-900">No cancelled bookings</p>
								<p className="text-sm text-gray-600 px-6">
									If you ever cancel an appointment, we’ll log it here so you can reschedule when you’re ready.
								</p>
								<Button variant="outline" asChild className="sm:min-w-[160px]">
									<Link href="/contact">Need help rescheduling?</Link>
								</Button>
							</div>
						) : (
							cancelledBookings.slice(0, 10).map(renderBookingItem)
						)}
					</div>
        )}
                </div>
                </div>
            </CardContent>
        </Card>
        <CustomerBookingDetailsModal booking={detailsBooking} isOpen={!!detailsBooking} onClose={() => setDetailsBooking(null)} />
        </>
	);
}


