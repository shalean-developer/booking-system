'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface Booking {
	id: string;
	service_type: string;
	status: string;
	created_at: string;
}

interface ActivityPanelProps {
	bookings: Booking[];
}

export function ActivityPanel({ bookings }: ActivityPanelProps) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const items = bookings
        .filter(b => new Date(b.created_at) >= thirtyDaysAgo)
        .slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

	return (
		<Card className="border-0 shadow-lg">
			<CardContent className="p-5">
				<h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                {items.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                            <Activity className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-600">No recent activity</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {items.map(item => (
                            <li key={item.id} className="rounded-lg border p-3">
                                <p className="text-sm text-gray-900"><span className="font-medium">{item.service_type}</span> • {item.status}</p>
                                <p className="text-xs text-gray-600">{new Date(item.created_at).toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                )}
			</CardContent>
		</Card>
	);
}


