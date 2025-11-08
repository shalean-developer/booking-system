'use client';

import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Inbox } from 'lucide-react';

interface BookingWithNote {
	id: string;
	created_at: string;
	service_type: string;
	notes?: string | null;
}

interface MessagesPanelProps {
	bookings: BookingWithNote[];
}

export function MessagesPanel({ bookings }: MessagesPanelProps) {
	const items = bookings
		.filter(b => (b.notes ?? '').trim().length > 0)
		.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
		.slice(0, 5);

	return (
		<Card className="border-0 shadow-lg">
			<CardContent className="p-5">
				<h3 className="text-lg font-bold text-gray-900 mb-4">Incoming Messages</h3>
				{items.length === 0 ? (
					<div className="text-center py-8 space-y-3">
						<div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
							<Inbox className="h-6 w-6 text-gray-400" />
						</div>
						<p className="text-sm text-gray-700">Cleaner notes and updates will show up here.</p>
						<p className="text-xs text-gray-500">
							Need to share special instructions? Add them when you book or let our team know after scheduling.
						</p>
					</div>
				) : (
					<ul className="space-y-3">
						{items.map(item => (
							<li key={item.id} className="rounded-lg border p-3">
								<div className="flex items-start gap-2">
									<MessageSquare className="h-4 w-4 mt-0.5 text-gray-500" />
									<div className="min-w-0">
										<p className="text-sm font-medium text-gray-900 truncate">{item.service_type}</p>
										{item.notes && (
											<p className="text-xs text-gray-700 mt-1 line-clamp-2">{item.notes}</p>
										)}
										<p className="text-[11px] text-gray-500 mt-1">
											{new Date(item.created_at).toLocaleString()}
										</p>
									</div>
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}


