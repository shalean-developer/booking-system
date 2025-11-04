'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface Stats {
  bookings: {
    today?: number;
    pending?: number;
    completed?: number;
  };
}

interface RecentActivityWidgetProps {
  stats: Stats;
}

export function RecentActivityWidget({ stats }: RecentActivityWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTimeAgo = (minutes: number) => {
    if (minutes < 1) return 'less than a minute ago';
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `about ${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return 'earlier today';
  };

  // Mock recent activity based on stats
  const todayBookings = stats.bookings.today || 0;
  const activities = [
    {
      id: '1',
      icon: Calendar,
      iconColor: 'text-purple-600',
      text: `${todayBookings} new bookings today`,
      timeAgo: formatTimeAgo(0),
    },
    {
      id: '2',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      text: `${stats.bookings.pending || 0} pending bookings need attention`,
      timeAgo: formatTimeAgo(60),
    },
    {
      id: '3',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      text: `${stats.bookings.completed || 0} bookings completed`,
      timeAgo: formatTimeAgo(120),
    },
  ];

  return (
    <Card className="w-full">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>Recent Activity</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`flex-shrink-0 mt-0.5 ${activity.iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.timeAgo}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
      )}
    </Card>
  );
}
