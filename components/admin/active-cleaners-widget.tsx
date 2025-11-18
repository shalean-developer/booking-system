'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Star, ChevronDown, ChevronUp } from 'lucide-react';

interface Cleaner {
  id: string;
  name: string;
  status: 'available' | 'busy';
  currentBookings?: number;
  rating: number;
}

interface ActiveCleanersWidgetProps {
  totalCleaners?: number;
}

export function ActiveCleanersWidget({ totalCleaners }: ActiveCleanersWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCleaners = async () => {
      try {
        const response = await fetch('/api/admin/cleaners/status', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.ok && data.cleaners) {
          setCleaners(data.cleaners.slice(0, 10)); // Limit to 10 for display
        }
      } catch (error) {
        console.error('Error fetching cleaners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCleaners();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCleaners, 30000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    return status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <Card className="relative w-full text-sm sm:text-base">
        <CardHeader 
          className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors sm:px-4 sm:py-3"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="flex items-center justify-between text-sm font-semibold sm:text-base">
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:text-left sm:gap-2">
              <User className="h-4 w-4 sm:h-5 sm:w-5" />
              <div className="flex flex-col items-center sm:flex-row sm:items-center">
                <span className="leading-tight">Available Cleaners Today</span>
                <span className="text-xs font-normal text-gray-500 sm:ml-1 sm:text-sm">
                  ({isLoading ? 0 : cleaners.length})
                </span>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
            )}
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent className="absolute left-0 right-0 top-full z-50 rounded-b-lg border-t border-gray-200 bg-white pt-0 shadow-lg">
            <div className="py-6 text-center text-xs text-gray-500 sm:py-8 sm:text-sm">
              <p>Loading...</p>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="relative w-full text-sm sm:text-base">
      <CardHeader 
        className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors sm:px-4 sm:py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-sm font-semibold sm:text-base">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:text-left sm:gap-2">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
              <div className="flex flex-col items-center sm:flex-row sm:items-center">
                <span className="leading-tight">Available Cleaners Today</span>
                <span className="text-xs font-normal text-gray-500 sm:ml-1 sm:text-sm">
                  ({isLoading ? 0 : cleaners.length})
                </span>
              </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-gray-500 sm:h-4 sm:w-4" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="absolute left-0 right-0 top-full z-50 max-h-[320px] overflow-y-auto rounded-b-lg border-t border-gray-200 bg-white pt-0 shadow-lg">
        <div className="space-y-2.5">
          {cleaners.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-500 sm:py-8 sm:text-sm">
              <User className="mx-auto mb-2 h-7 w-7 text-gray-400 sm:h-8 sm:w-8" />
              <p>No cleaners available today</p>
            </div>
          ) : (
            cleaners.map((cleaner) => (
              <div
                key={cleaner.id}
                className="flex items-center gap-2.5 rounded-lg bg-gray-50 p-2 text-xs transition-colors hover:bg-gray-100 sm:gap-3 sm:p-3 sm:text-sm"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm">
                  {getInitials(cleaner.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="truncate font-medium text-gray-900">
                      {cleaner.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] sm:text-xs ${getStatusColor(cleaner.status)}`}>
                      {cleaner.status === 'available' ? 'Available' : 'Busy'}
                    </Badge>
                    {cleaner.status === 'busy' && cleaner.currentBookings && (
                      <span className="text-[11px] text-gray-600 sm:text-xs">
                        ({cleaner.currentBookings} bookings)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-600 sm:text-xs">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{cleaner.rating.toFixed(1)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      )}
    </Card>
  );
}
