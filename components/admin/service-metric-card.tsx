'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ServiceMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export function ServiceMetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  badge,
}: ServiceMetricCardProps) {
  // Get badge styling based on variant
  const getBadgeClassName = (variant?: string) => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'secondary':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'outline':
        return 'border border-gray-300 text-gray-700 hover:bg-gray-50';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className="text-gray-500 h-4 w-4">{icon}</span>}
            <span>{title}</span>
          </div>
          {badge && (
            <Badge 
              variant={badge.variant || 'default'}
              className={`${getBadgeClassName(badge.variant)} text-xs font-medium px-2 py-0.5`}
            >
              {badge.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
          {subtitle && (
            <div className="text-sm text-gray-600 font-normal">{subtitle}</div>
          )}
          {trend && (
            <div className={`text-xs font-medium flex items-center gap-1 ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

