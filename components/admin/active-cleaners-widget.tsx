'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserCheck, CheckCircle2, Clock } from 'lucide-react';

interface ActiveCleaner {
  id: string;
  name: string;
  status: 'available' | 'busy' | 'offline';
  currentBookings?: number;
  rating?: number;
}

interface ActiveCleanersWidgetProps {
  cleaners: ActiveCleaner[];
}

export function ActiveCleanersWidget({ cleaners }: ActiveCleanersWidgetProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge className="bg-green-100 text-green-800">Available</Badge>;
      case 'busy':
        return <Badge className="bg-blue-100 text-blue-800">Busy</Badge>;
      case 'offline':
        return <Badge className="bg-gray-100 text-gray-800">Offline</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (cleaners.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Active Cleaners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 text-sm">
            No active cleaners at the moment.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Active Cleaners
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cleaners.map((cleaner) => (
            <div
              key={cleaner.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
            >
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {getInitials(cleaner.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{cleaner.name}</div>
                  <div className="flex items-center gap-3 mt-1">
                    {getStatusBadge(cleaner.status)}
                    {cleaner.currentBookings !== undefined && cleaner.currentBookings > 0 && (
                      <span className="text-xs text-gray-600">
                        ({cleaner.currentBookings} booking{cleaner.currentBookings !== 1 ? 's' : ''})
                      </span>
                    )}
                    {cleaner.rating && (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        <span className="text-amber-500">★</span>
                        <span className="font-medium">{cleaner.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

