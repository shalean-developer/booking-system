'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AvatarWithInitials } from '@/components/admin/avatar-with-initials';
import { StatusBadge } from '@/components/admin/status-badge';
import { UserCheck, MessageSquare, User, ArrowRight, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
  const router = useRouter();

  if (cleaners.length === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-card border border-gray-200">
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

  const getStatusVariant = (status: string): any => {
    switch (status) {
      case 'available':
        return 'completed';
      case 'busy':
        return 'in_progress';
      case 'offline':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-card border border-gray-200 hover:shadow-card-hover transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Active Cleaners
          </CardTitle>
          {cleaners.length > 0 && (
            <button
              onClick={() => router.push('/admin/cleaners')}
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {cleaners.map((cleaner) => (
            <div
              key={cleaner.id}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <AvatarWithInitials 
                    name={cleaner.name} 
                    size="md"
                    variant="blue"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">{cleaner.name}</div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <StatusBadge status={getStatusVariant(cleaner.status)} />
                      {cleaner.currentBookings !== undefined && cleaner.currentBookings > 0 && (
                        <span className="text-xs text-gray-600">
                          ({cleaner.currentBookings} booking{cleaner.currentBookings !== 1 ? 's' : ''})
                        </span>
                      )}
                      {cleaner.rating && (
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          <span className="font-medium">{cleaner.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {/* Handle message */}}
                    aria-label={`Message ${cleaner.name}`}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => router.push(`/admin/cleaners?id=${cleaner.id}`)}
                    aria-label={`View ${cleaner.name} profile`}
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

