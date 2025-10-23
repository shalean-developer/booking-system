'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, Users, Calendar, Briefcase, CheckCircle, FileText, TrendingUp, Percent, Receipt, Activity, Repeat, UserPlus } from 'lucide-react';

interface Stats {
  bookings: {
    total: number;
    recent: number;
    pending: number;
    confirmed: number;
    completed: number;
  };
  revenue: {
    total: number;
    recent: number;
    cleanerEarnings: number;
    recentCleanerEarnings: number;
    companyEarnings: number;
    recentCompanyEarnings: number;
    serviceFees: number;
    recentServiceFees: number;
    profitMargin: number;
    recentProfitMargin: number;
    avgBookingValue: number;
    recentAvgBookingValue: number;
  };
  customers: {
    total: number;
    repeat: number;
    retentionRate: number;
  };
  cleaners: {
    total: number;
    active: number;
    utilization: number;
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
        const response = await fetch('/api/admin/stats', {
          credentials: 'include', // Include cookies for server-side auth
        });
        
        const data = await response.json();

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
      {/* Row 1: Financial Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{stats.revenue.total.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              R{stats.revenue.recent.toFixed(2)} last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R{stats.revenue.companyEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              R{stats.revenue.recentCompanyEarnings.toFixed(2)} last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.revenue.profitMargin}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.revenue.recentProfitMargin}% last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Fees</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{stats.revenue.serviceFees.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              R{stats.revenue.recentServiceFees.toFixed(2)} last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Operational Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Active Cleaners</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cleaners.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.cleaners.total} total cleaners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cleaner Utilization</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.cleaners.utilization}
            </div>
            <p className="text-xs text-muted-foreground">
              bookings per cleaner (last 30 days)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cleaner Earnings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{stats.revenue.cleanerEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              R{stats.revenue.recentCleanerEarnings.toFixed(2)} last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Growth Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Customer Retention</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.customers.retentionRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.customers.repeat} repeat customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{stats.revenue.avgBookingValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              R{stats.revenue.recentAvgBookingValue.toFixed(2)} recent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cleaner Pipeline</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.applications.pending}
            </div>
            <p className="text-xs text-muted-foreground">
              pending applications
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

