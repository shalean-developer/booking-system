'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface PerformanceMetrics {
  avgResponseTime: number;
  apiCallsToday: number;
  cacheHitRate: number;
  errorRate: number;
}

interface PerformanceWidgetProps {
  metrics?: PerformanceMetrics;
}

export function PerformanceWidget({ metrics }: PerformanceWidgetProps) {
  // Mock data if metrics not provided
  const data = metrics || {
    avgResponseTime: 120, // ms
    apiCallsToday: 1542,
    cacheHitRate: 87, // %
    errorRate: 0.3, // %
  };

  const getResponseTimeColor = (ms: number) => {
    if (ms < 100) return 'text-green-600';
    if (ms < 200) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getErrorRateColor = (rate: number) => {
    if (rate < 1) return 'text-green-600';
    if (rate < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Performance Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-600">Avg Response</span>
            </div>
            <div className={`text-lg font-semibold ${getResponseTimeColor(data.avgResponseTime)}`}>
              {data.avgResponseTime}ms
            </div>
            {data.avgResponseTime < 200 && (
              <Badge variant="outline" className="text-xs">Excellent</Badge>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-600">API Calls</span>
            </div>
            <div className="text-lg font-semibold">
              {data.apiCallsToday.toLocaleString()}
            </div>
            <span className="text-xs text-gray-500">Today</span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-600">Cache Hit</span>
            </div>
            <div className="text-lg font-semibold text-green-600">
              {data.cacheHitRate}%
            </div>
            {data.cacheHitRate > 80 && (
              <Badge variant="outline" className="text-xs bg-green-50">Optimal</Badge>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-600">Error Rate</span>
            </div>
            <div className={`text-lg font-semibold ${getErrorRateColor(data.errorRate)}`}>
              {data.errorRate}%
            </div>
            {data.errorRate < 1 && (
              <Badge variant="outline" className="text-xs">Healthy</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}



