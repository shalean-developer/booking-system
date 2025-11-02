'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, UserPlus, Calendar, AlertCircle } from 'lucide-react';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'booking_completed' | 'new_customer' | 'new_booking' | 'alert';
  message: string;
  timestamp: string;
  metadata?: any;
}

interface RecentActivityWidgetProps {
  activities: ActivityItem[];
}

export function RecentActivityWidget({ activities }: RecentActivityWidgetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatActivityTimestamp = (timestamp: string): string => {
    if (!mounted) return 'Just now';
    
    try {
      if (!timestamp) return 'Just now';
      
      const date = parseISO(timestamp);
      if (!isValid(date)) return 'Just now';
      
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.warn('Error formatting timestamp:', error);
      return 'Just now';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'new_customer':
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case 'new_booking':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-gray-600" />;
    }
  };

  if (activities.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 text-sm">
            No recent activity.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
            >
              <div className="mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-900">{activity.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatActivityTimestamp(activity.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

