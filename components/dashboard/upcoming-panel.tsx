'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MessageSquare } from 'lucide-react';

interface Booking {
	id: string;
	booking_date: string;
	booking_time: string;
	service_type: string;
	notes?: string | null;
}

interface UpcomingPanelProps {
	bookings: Booking[];
}

export function UpcomingPanel({ bookings }: UpcomingPanelProps) {
	const items = bookings
		.filter(b => new Date(b.booking_date) >= new Date())
		.sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime())
		.slice(0, 3);

	return (
		<Card className="border-0 shadow-lg">
			<CardContent className="p-5">
				<h3 className="text-lg font-bold text-gray-900 mb-4">Upcoming Bookings</h3>
				{items.length === 0 ? (
					<div className="text-center py-8">
						<div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
							<Calendar className="h-6 w-6 text-gray-400" />
						</div>
						<p className="text-sm text-gray-600">No upcoming tasks</p>
					</div>
				) : (
					<ul className="space-y-3">
					{items.map(item => (
							<li key={item.id} className="flex items-center justify-between rounded-lg border p-3">
							<div>
									<p className="text-sm font-medium text-gray-900">{item.service_type}</p>
									<p className="text-xs text-gray-600">
										{new Date(item.booking_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })} • {item.booking_time}
									</p>
								{item.notes && (
									<div className="mt-2 flex items-start gap-2 text-xs text-gray-700">
										<MessageSquare className="h-3.5 w-3.5 mt-0.5 text-gray-500" />
										<p className="line-clamp-2">{item.notes}</p>
									</div>
								)}
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}


