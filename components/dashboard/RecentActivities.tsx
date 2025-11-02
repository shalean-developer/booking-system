/**
 * Recent Activities component
 */

import React, { memo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar, UserPlus, FileText, Star } from 'lucide-react';
import type { ActivityFeedItem } from './types';

export interface RecentActivitiesProps {
  activities?: ActivityFeedItem[];
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  booking: Calendar,
  cleaner: UserPlus,
  quote: FileText,
  application: FileText,
  review: Star,
};

export const RecentActivities = memo(function RecentActivities({
  activities = [],
}: RecentActivitiesProps) {
  return (
    <Card className="p-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => {
              const Icon = activityIcons[activity.type] || Calendar;
              return (
                <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{activity.title}</div>
                    <div className="text-xs text-muted-foreground">{activity.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">{activity.timestamp}</div>
                  </div>
                  {activity.status && (
                    <div className="text-xs px-2 py-1 bg-gray-100 rounded flex-shrink-0">
                      {activity.status}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm">No recent activities</div>
            <div className="text-xs mt-2">Quick actions:
              <button
                className="text-primary hover:underline ml-2"
                onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'bookings' }))}
              >
                Assign Cleaner
              </button>
              <span className="mx-2">•</span>
              <button
                className="text-primary hover:underline"
                onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'applications' }))}
              >
                Review Applications
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

RecentActivities.displayName = 'RecentActivities';

