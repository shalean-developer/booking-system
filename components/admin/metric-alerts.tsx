'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, TrendingUp, ArrowRight } from 'lucide-react';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  value?: number;
  threshold?: number;
}

interface MetricAlertsProps {
  stats: {
    bookings: {
      pending: number;
      accepted: number;
    };
    cleaners: {
      active: number;
      total: number;
    };
    applications: {
      pending: number;
    };
    revenue: {
      recent: number;
      total: number;
    };
  };
}

export function MetricAlerts({ stats }: MetricAlertsProps) {
  const alerts: Alert[] = [];

  // Check for pending bookings that need attention
  if (stats.bookings.pending > 10) {
    alerts.push({
      id: 'pending-bookings',
      type: 'warning',
      title: 'High Pending Bookings',
      message: `${stats.bookings.pending} pending bookings require attention`,
      value: stats.bookings.pending,
      threshold: 10,
    });
  }

  // Check for low active cleaner ratio
  const activeRatio = stats.cleaners.total > 0 
    ? (stats.cleaners.active / stats.cleaners.total) * 100 
    : 0;
  if (activeRatio < 50 && stats.cleaners.total > 0) {
    alerts.push({
      id: 'low-active-cleaners',
      type: 'warning',
      title: 'Low Active Cleaner Ratio',
      message: `Only ${activeRatio.toFixed(0)}% of cleaners are active`,
      value: activeRatio,
      threshold: 50,
    });
  }

  // Check for pending applications
  if (stats.applications.pending > 5) {
    alerts.push({
      id: 'pending-applications',
      type: 'info',
      title: 'Pending Applications',
      message: `${stats.applications.pending} applications awaiting review`,
      value: stats.applications.pending,
      threshold: 5,
    });
  }

  // Check for revenue decline
  const recentRevenueRatio = stats.revenue.total > 0
    ? (stats.revenue.recent / stats.revenue.total) * 100
    : 0;
  if (recentRevenueRatio < 10 && stats.revenue.total > 0) {
    alerts.push({
      id: 'low-recent-revenue',
      type: 'warning',
      title: 'Low Recent Revenue',
      message: `Only ${recentRevenueRatio.toFixed(1)}% of revenue from last 30 days`,
      value: recentRevenueRatio,
      threshold: 10,
    });
  }

  if (alerts.length === 0) {
    return null;
  }

  const getAlertColor = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <TrendingDown className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Metric Alerts</h3>
          {alerts.map((alert) => {
            const isClickable = alert.id === 'pending-applications';
            const handleClick = () => {
              if (isClickable) {
                window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'applications' }));
              }
            };
            
            return (
              <div
                key={alert.id}
                onClick={handleClick}
                className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertColor(alert.type)} ${
                  isClickable ? 'cursor-pointer hover:shadow-md transition-shadow group' : ''
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <div className="flex items-center gap-2">
                      {alert.value !== undefined && (
                        <Badge variant="secondary" className="ml-2">
                          {typeof alert.value === 'number' && alert.value % 1 !== 0
                            ? alert.value.toFixed(1)
                            : alert.value}
                        </Badge>
                      )}
                      {isClickable && (
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs mt-1 opacity-90">
                    {alert.message}
                    {isClickable && (
                      <span className="ml-1 text-primary font-medium group-hover:underline">
                        Click to review →
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
