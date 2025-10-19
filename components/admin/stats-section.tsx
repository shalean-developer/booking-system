'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Users, Calendar, Briefcase, CheckCircle, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface Stats {
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    recent: number;
  };
  revenue: {
    total: number;
    recent: number;
  };
  customers: {
    total: number;
  };
  cleaners: {
    total: number;
    active: number;
  };
  applications: {
    total: number;
    pending: number;
  };
  quotes: {
    total: number;
    pending: number;
    contacted: number;
    converted: number;
  };
}

export function StatsSection() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('=== STATS SECTION DEBUG ===');
        console.log('Fetching session...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('Session found:', !!session);
        console.log('Session user:', session?.user?.email);
        
        if (!session) {
          throw new Error('No active session');
        }

        console.log('Making API call to /api/admin/stats...');
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          credentials: 'include', // Include cookies for server-side auth
        });
        
        console.log('API Response status:', response.status);
        console.log('API Response ok:', response.ok);
        
        const data = await response.json();
        console.log('API Response data:', data);

        if (!data.ok) {
          throw new Error(data.error || 'Failed to fetch stats');
        }

        setStats(data.stats);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load stats');
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{(stats.revenue.total / 100).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              R{(stats.revenue.recent / 100).toFixed(2)} last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bookings.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.bookings.recent} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers.total}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cleaners</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cleaners.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.cleaners.total} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.bookings.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Bookings</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.bookings.confirmed}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.bookings.completed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-orange-600">
            {stats.applications.pending}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {stats.applications.total} total applications received
          </p>
        </CardContent>
      </Card>

      {/* Quotes Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Quote Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <div className="text-2xl font-bold">{stats.quotes.total}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <div className="text-2xl font-bold text-yellow-600">{stats.quotes.pending}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contacted</p>
              <div className="text-2xl font-bold text-blue-600">{stats.quotes.contacted}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Converted</p>
              <div className="text-2xl font-bold text-green-600">{stats.quotes.converted}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

