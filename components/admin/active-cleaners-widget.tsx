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
      <Card className="w-full">
        <CardHeader 
          className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Active Cleaners
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Loading...</p>
            </div>
          </CardContent>
        )}
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Active Cleaners
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {cleaners.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No active cleaners</p>
            </div>
          ) : (
            cleaners.map((cleaner) => (
              <div
                key={cleaner.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold text-sm">
                  {getInitials(cleaner.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {cleaner.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getStatusColor(cleaner.status)}`}>
                      {cleaner.status === 'available' ? 'Available' : 'Busy'}
                    </Badge>
                    {cleaner.status === 'busy' && cleaner.currentBookings && (
                      <span className="text-xs text-gray-600">
                        ({cleaner.currentBookings} bookings)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600">
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
