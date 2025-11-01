'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, Clock, ArrowRight, Search, Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Activity {
  id: string;
  booking_id: string;
  cleaner_name: string;
  old_status: string | null;
  new_status: string;
  action_type: string;
  created_at: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCleaner, setFilterCleaner] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/admin/activities?limit=20', {
        credentials: 'include',
      });
      
      // Handle unauthorized responses gracefully
      if (response.status === 403 || response.status === 401) {
        console.warn('Activity feed: Admin access required. User may not be authenticated or may not have admin role.');
        setActivities([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (!data.ok) {
        // If table doesn't exist, show empty state with helpful message
        if (data.code === '42P01' || data.code === 'TABLE_NOT_FOUND' || data.details || data.message) {
          setActivities([]);
          setError(null);
          setIsLoading(false);
          return;
        }
        // Handle unauthorized errors gracefully
        if (data.error?.includes('Unauthorized') || response.status === 403) {
          console.warn('Activity feed: Admin access required. User may not be authenticated or may not have admin role.');
          setActivities([]);
          setError(null);
          setIsLoading(false);
          return;
        }
        // For other errors, log but don't crash - show empty state
        console.error('Failed to fetch activities:', data.error);
        setActivities([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setActivities(data.activities || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivities, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 10) return 'Just now';
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accepted':
      case 'on_my_way':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'on_my_way': 'On My Way',
      'in-progress': 'In Progress',
      'completed': 'Completed',
    };
    return statusMap[status?.toLowerCase()] || status;
  };

  // Filter activities based on search and filters
  const filteredActivities = activities.filter((activity) => {
    // Search by booking ID or cleaner name
    const matchesSearch = !searchQuery || 
      activity.booking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.cleaner_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by cleaner name
    const matchesCleaner = !filterCleaner || 
      activity.cleaner_name.toLowerCase() === filterCleaner.toLowerCase();
    
    // Filter by status
    const matchesStatus = !filterStatus || 
      activity.new_status.toLowerCase() === filterStatus.toLowerCase();
    
    return matchesSearch && matchesCleaner && matchesStatus;
  });

  // Get unique cleaner names for filter dropdown
  const uniqueCleaners = [...new Set(activities.map(a => a.cleaner_name))].sort();
  const uniqueStatuses = [...new Set(activities.map(a => a.new_status))].sort();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600 text-sm">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activities
          {activities.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activities.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        {activities.length > 0 && (
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by booking ID or cleaner name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterCleaner}
                onChange={(e) => setFilterCleaner(e.target.value)}
                className="h-9 rounded-md border border-gray-300 px-3 py-1 text-sm bg-white"
              >
                <option value="">All Cleaners</option>
                {uniqueCleaners.map((cleaner) => (
                  <option key={cleaner} value={cleaner}>{cleaner}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 rounded-md border border-gray-300 px-3 py-1 text-sm bg-white"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>{getStatusLabel(status)}</option>
                ))}
              </select>
              {(filterCleaner || filterStatus || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilterCleaner('');
                    setFilterStatus('');
                    setSearchQuery('');
                  }}
                  className="h-9"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            {filteredActivities.length !== activities.length && (
              <p className="text-xs text-gray-500">
                Showing {filteredActivities.length} of {activities.length} activities
              </p>
            )}
          </div>
        )}
        {activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Clock className="h-16 w-16 text-gray-300" />
                <CheckCircle className="h-6 w-6 text-gray-200 absolute -top-1 -right-1" />
              </div>
              <div className="space-y-2">
                <p className="text-gray-700 font-medium text-lg">No recent activities</p>
                <p className="text-sm text-gray-500 max-w-sm">
                  Activities will appear here when cleaners update booking status. You'll see when bookings are accepted, in progress, or completed.
                </p>
                <p className="text-xs text-gray-400 mt-3 italic">
                  Tip: Check back after cleaners start working on bookings to see real-time updates.
                </p>
              </div>
            </div>
          </div>
        ) : filteredActivities.length === 0 && (searchQuery || filterCleaner || filterStatus) ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-2">No activities match your filters</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterCleaner('');
                setFilterStatus('');
                setSearchQuery('');
              }}
              className="mt-2"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {filteredActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900">
                      {activity.cleaner_name}
                    </span>
                    {activity.old_status && (
                      <>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getStatusColor(activity.old_status)}`}
                        >
                          {getStatusLabel(activity.old_status)}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      </>
                    )}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(activity.new_status)}`}
                    >
                      {getStatusLabel(activity.new_status)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">
                      Booking {activity.booking_id.slice(0, 8)}...
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(activity.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

