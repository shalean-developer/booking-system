'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  FileText, 
  ThumbsDown, 
  TrendingDown, 
  XCircle,
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'success';
  type: string;
  title: string;
  message: string;
  count?: number;
  percentage?: number;
  details?: any[];
  action?: {
    label: string;
    href: string;
  };
  timestamp: string;
}

interface AlertsResponse {
  ok: boolean;
  alerts: Alert[];
  summary: {
    total: number;
    critical: number;
    warning: number;
    info: number;
  };
}

export function CriticalAlertsPanel() {
  const { data, error, isLoading, mutate } = useSWR<AlertsResponse>(
    '/api/admin/alerts',
    async (url) => {
      const response = await fetch(url, { credentials: 'include' });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch alerts');
      return result;
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // Auto-refresh every 60 seconds
    }
  );
  
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const alerts = data?.alerts || [];
  const summary = data?.summary || { total: 0, critical: 0, warning: 0, info: 0 };

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const handleAction = (href: string) => {
    if (href.includes('#')) {
      // Scroll to section within page
      const [path, hash] = href.split('#');
      if (hash) {
        window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'dashboard' }));
        setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else if (href.startsWith('/admin/')) {
      // Navigate to admin tab
      const tab = href.split('/')[2];
      window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: tab }));
    }
  };

  const getSeverityColors = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200 border-l-4',
          text: 'text-red-900',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800 border-red-300'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200 border-l-4',
          text: 'text-yellow-900',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200 border-l-4',
          text: 'text-blue-900',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800 border-blue-300'
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200 border-l-4',
          text: 'text-green-900',
          icon: 'text-green-600',
          badge: 'bg-green-100 text-green-800 border-green-300'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200 border-l-4',
          text: 'text-gray-900',
          icon: 'text-gray-600',
          badge: 'bg-gray-100 text-gray-800 border-gray-300'
        };
    }
  };

  const getAlertIcon = (type: string, severity: Alert['severity']) => {
    const iconClass = "h-5 w-5";
    
    if (severity === 'critical') {
      return <AlertTriangle className={iconClass} />;
    }
    
    switch (type) {
      case 'unassigned_bookings':
        return <Clock className={iconClass} />;
      case 'low_availability':
        return <Users className={iconClass} />;
      case 'old_quotes':
        return <FileText className={iconClass} />;
      case 'negative_review':
        return <ThumbsDown className={iconClass} />;
      case 'high_cancellations':
      case 'revenue_drop':
        return <TrendingDown className={iconClass} />;
      default:
        return <AlertTriangle className={iconClass} />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-4">Failed to load alerts</p>
            <Button onClick={() => mutate()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (visibleAlerts.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 bg-green-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-green-900">All Clear!</h3>
              <p className="text-xs text-green-700">No critical alerts at this time.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-orange-500">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="text-base font-semibold text-gray-900">Critical Alerts</h3>
            <Badge variant="outline" className="border-orange-300 text-orange-700">
              {summary.total}
            </Badge>
          </div>
          {summary.critical > 0 && (
            <Badge className="bg-red-600 text-white">Critical: {summary.critical}</Badge>
          )}
        </div>
        
        <div className="space-y-2">
          <AnimatePresence>
            {visibleAlerts.map((alert, index) => {
              const colors = getSeverityColors(alert.severity);
              
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className={`p-4 rounded-lg ${colors.bg} ${colors.border} ${colors.text}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>
                          {getAlertIcon(alert.type, alert.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{alert.title}</h4>
                            {alert.count !== undefined && (
                              <Badge className={colors.badge} variant="outline">
                                {alert.count}
                              </Badge>
                            )}
                            {alert.percentage !== undefined && (
                              <Badge className={colors.badge} variant="outline">
                                {alert.percentage.toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs opacity-90 mb-2">{alert.message}</p>
                          
                          {alert.details && alert.details.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {alert.details.slice(0, 3).map((detail: any, idx: number) => (
                                <div key={idx} className="text-xs opacity-75">
                                  {detail.customer_name && (
                                    <span className="font-medium">{detail.customer_name}</span>
                                  )}
                                  {detail.first_name && (
                                    <span className="font-medium">{detail.first_name} {detail.last_name}</span>
                                  )}
                                  {detail.booking_date && detail.booking_time && (
                                    <span className="ml-2 text-xs">
                                      {format(parseISO(detail.booking_date), 'MMM dd')} at {detail.booking_time}
                                    </span>
                                  )}
                                  {detail.rating && (
                                    <span className="ml-2 text-xs">Rating: {detail.rating}/5</span>
                                  )}
                                </div>
                              ))}
                              {alert.details.length > 3 && (
                                <div className="text-xs opacity-75 italic">
                                  +{alert.details.length - 3} more...
                                </div>
                              )}
                            </div>
                          )}
                          
                          {alert.action && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(alert.action!.href)}
                              className={`mt-2 h-7 text-xs px-3 ${colors.text} hover:${colors.bg}`}
                            >
                              {alert.action.label}
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDismiss(alert.id)}
                        className="flex-shrink-0 p-1 hover:bg-white/50 rounded transition-colors"
                        aria-label="Dismiss alert"
                      >
                        <XCircle className="h-4 w-4 opacity-70" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

