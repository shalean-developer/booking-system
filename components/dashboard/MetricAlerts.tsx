/**
 * Enhanced MetricAlerts with color coding and collapsible overflow
 */

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, ChevronDown, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { MetricAlertSkeleton } from './Skeleton';
import type { Alert } from './types';

export interface MetricAlertsProps {
  alerts: Alert[];
  isLoading?: boolean;
  maxVisible?: number;
}

const AlertLevelIcon = {
  info: Info,
  warning: AlertTriangle,
  urgent: AlertCircle,
};

const AlertLevelColors = {
  info: {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    icon: 'text-sky-600',
    accent: 'border-l-sky-400',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'text-amber-600',
    accent: 'border-l-amber-400',
  },
  urgent: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: 'text-rose-600',
    accent: 'border-l-rose-500',
  },
};

const AlertLevelShadow = {
  info: 'shadow-sm',
  warning: 'shadow-sm',
  urgent: 'shadow-md',
};

export const MetricAlerts = memo(function MetricAlerts({ 
  alerts, 
  isLoading = false,
  maxVisible = 3 
}: MetricAlertsProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <MetricAlertSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const visibleAlerts = alerts.slice(0, maxVisible);
  const moreAlerts = alerts.length > maxVisible ? alerts.slice(maxVisible) : [];
  const moreCount = moreAlerts.length;

  const handleAction = (alert: Alert) => {
    if (alert.actionHref) {
      window.location.href = alert.actionHref;
    } else if (alert.actionLabel === 'Review') {
      // Dispatch event to change tab
      window.dispatchEvent(new CustomEvent('admin-tab-change', { 
        detail: alert.title.toLowerCase().includes('quote') ? 'quotes' : 'applications' 
      }));
    }
  };

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert, index) => {
        const colors = AlertLevelColors[alert.level];
        const shadow = AlertLevelShadow[alert.level];
        const Icon = AlertLevelIcon[alert.level];
        const isUrgent = alert.level === 'urgent';

        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`rounded-lg p-3 border ${colors.bg} ${colors.border} ${shadow} ${isUrgent ? 'border-l-4 ' + colors.accent : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${colors.icon}`} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {alert.title}
                    {alert.count && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">
                        ({alert.count})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {alert.message}
                  </div>
                </div>
              </div>
              {alert.actionLabel && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 ml-2"
                  onClick={() => handleAction(alert)}
                  aria-label={`${alert.actionLabel}: ${alert.title}`}
                >
                  {alert.actionLabel}
                </Button>
              )}
            </div>
          </motion.div>
        );
      })}

      {moreCount > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-center text-sm"
              aria-label={`View ${moreCount} more alerts`}
            >
              <ChevronDown className="h-4 w-4 mr-2" />
              +{moreCount} more alert{moreCount > 1 ? 's' : ''}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {moreAlerts.map((alert) => {
                const colors = AlertLevelColors[alert.level];
                const Icon = AlertLevelIcon[alert.level];

                return (
                  <div
                    key={alert.id}
                    className={`rounded-lg p-3 border ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className={`h-4 w-4 mt-0.5 ${colors.icon}`} aria-hidden="true" />
                      <div className="flex-1">
                        <div className="font-medium text-xs">
                          {alert.title}
                          {alert.count && (
                            <span className="ml-1 text-muted-foreground font-normal">
                              ({alert.count})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {alert.message}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
});

MetricAlerts.displayName = 'MetricAlerts';

