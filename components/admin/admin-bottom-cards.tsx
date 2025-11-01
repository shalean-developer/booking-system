'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, TrendingUp, ArrowRight, Users, DollarSign, Loader2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import useSWR from 'swr';

interface BottomCardsProps {
  onNavigate?: (tab: string) => void;
}

interface Activity {
  id: string;
  booking_id: string;
  cleaner_name: string;
  old_status: string | null;
  new_status: string;
  action_type: string;
  created_at: string;
}

export function AdminBottomCards({ onNavigate }: BottomCardsProps) {
  // Fetch stats data
  const { data, error, isLoading } = useSWR<{
    ok: boolean;
    stats?: any;
    error?: string;
  }>(
    '/api/admin/stats',
    async (url) => {
      const response = await fetch(url, { credentials: 'include' });
      const data = await response.json();
      if (!data.ok) throw new Error(data.error || 'Failed to fetch stats');
      return data;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 60000,
      dedupingInterval: 5000,
    }
  );

  // Fetch recent activities
  const { data: activitiesData, isLoading: isLoadingActivities } = useSWR<{
    ok: boolean;
    activities?: Activity[];
    error?: string;
  }>(
    '/api/admin/activities?limit=5',
    async (url) => {
      const response = await fetch(url, { credentials: 'include' });
      if (response.status === 403 || response.status === 401) {
        return { ok: true, activities: [] };
      }
      const data = await response.json();
      if (!data.ok && (data.code === '42P01' || data.code === 'TABLE_NOT_FOUND')) {
        return { ok: true, activities: [] };
      }
      if (!data.ok) throw new Error(data.error || 'Failed to fetch activities');
      return data;
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30000,
      dedupingInterval: 5000,
    }
  );

  const stats = data?.stats || null;
  const activities = activitiesData?.activities || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Recent Activity */}
      <Card className="border border-gray-200 hover:border-primary/50 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">Today's Overview</h3>
          </div>
          <div className="space-y-3">
            {stats?.bookings && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.bookings.completed}</span>
              </div>
            )}
            {stats?.bookings && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Pending</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.bookings.pending}</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-4"
            onClick={() => onNavigate?.('bookings')}
          >
            View All Bookings
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Card 2: Key Metrics */}
      <Card className="border border-gray-200 hover:border-primary/50 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold text-gray-900">Key Metrics</h3>
          </div>
          <div className="space-y-3">
            {stats?.revenue && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Revenue</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 }).format(stats.revenue.total)}
                </span>
              </div>
            )}
            {stats?.customers && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Customers</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.customers.total}</span>
              </div>
            )}
            {stats?.cleaners && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Active Cleaners</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{stats.cleaners.active}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Recent Activities */}
      <Card className="border border-gray-200 hover:border-primary/50 transition-all md:col-span-1">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-semibold text-gray-900">Recent Activities</h3>
            </div>
            {activities.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activities.length}
              </Badge>
            )}
          </div>
          
          {isLoadingActivities ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-xs text-gray-500">
                No recent updates
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-xs text-gray-900 truncate">
                        {activity.cleaner_name}
                      </span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        {activity.new_status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.booking_id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {activities.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => onNavigate?.('dashboard')}
            >
              View All Activities
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

