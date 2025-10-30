'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, BadgePercent } from 'lucide-react';

interface Booking {
	id: string;
	booking_date: string;
	booking_time: string;
	service_type: string;
	status: string;
	total_amount?: number;
	address_line1: string;
	address_suburb: string;
	address_city?: string;
}

interface CustomerBookingDetailsModalProps {
	booking: Booking | null;
	isOpen: boolean;
	onClose: () => void;
}

export function CustomerBookingDetailsModal({ booking, isOpen, onClose }: CustomerBookingDetailsModalProps) {
	if (!booking) return null;

	const fullAddress = [booking.address_line1, booking.address_suburb, booking.address_city].filter(Boolean).join(', ');

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<BadgePercent className="h-5 w-5 text-primary" />
						{booking.service_type}
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-3 text-sm">
					<div className="flex items-center gap-2 text-gray-700">
						<Calendar className="h-4 w-4" />
						<span>{new Date(booking.booking_date).toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
					</div>
					<div className="flex items-center gap-2 text-gray-700">
						<Clock className="h-4 w-4" />
						<span>{booking.booking_time}</span>
					</div>
					<div className="flex items-center gap-2 text-gray-700">
						<MapPin className="h-4 w-4" />
						<span>{fullAddress}</span>
					</div>
					{typeof booking.total_amount === 'number' && (
						<p className="text-base font-semibold text-gray-900">Total: R{(booking.total_amount / 100).toFixed(2)}</p>
					)}
					<p className="text-xs text-gray-500">Status: {booking.status}</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}


