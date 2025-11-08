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
    <Card className="relative w-full text-sm sm:text-base">
      <CardHeader 
        className="px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors sm:px-4 sm:py-3"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between text-sm font-semibold sm:text-base">
          <div className="flex flex-col items-center gap-1 sm:flex-row sm:text-left sm:gap-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="leading-tight">Recent Activity</span>
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
        <div className="space-y-2.5">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start gap-2.5 text-xs sm:gap-3 sm:text-sm">
                <div className={`mt-0.5 flex-shrink-0 ${activity.iconColor}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{activity.text}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">{activity.timeAgo}</p>
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
