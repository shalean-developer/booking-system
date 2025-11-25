'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { AlertCircle, FileText, Briefcase, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PendingAlertsProps {
  pendingQuotes?: number;
  pendingApplications?: number;
  pendingBookings?: number;
  isLoading?: boolean;
}

export function PendingAlerts({
  pendingQuotes = 0,
  pendingApplications = 0,
  pendingBookings = 0,
  isLoading,
}: PendingAlertsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Pending Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-12 bg-gray-100 animate-pulse rounded" />
            <div className="h-12 bg-gray-100 animate-pulse rounded" />
            <div className="h-12 bg-gray-100 animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalPending = pendingQuotes + pendingApplications + pendingBookings;

  if (totalPending === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-green-500" />
            Pending Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">All caught up! No pending items.</p>
        </CardContent>
      </Card>
    );
  }

  const alerts = [
    {
      title: 'Pending Quotes',
      count: pendingQuotes,
      href: '/admin/quotes?status=pending',
      icon: FileText,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      title: 'Pending Applications',
      count: pendingApplications,
      href: '/admin/applications?status=pending',
      icon: Briefcase,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: 'Pending Bookings',
      count: pendingBookings,
      href: '/admin/bookings?status=pending',
      icon: Calendar,
      color: 'bg-yellow-100 text-yellow-800',
    },
  ].filter((alert) => alert.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Pending Items
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alert.icon;
            return (
              <Link
                key={alert.title}
                href={alert.href}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded ${alert.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{alert.title}</div>
                    <div className="text-xs text-muted-foreground">Requires attention</div>
                  </div>
                </div>
                <Badge variant="outline" className={alert.color}>
                  {alert.count}
                </Badge>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}










