'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Award,
  AlertCircle,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils/formatting';

interface CleanerPerformance {
  id: string;
  name: string;
  photo_url?: string;
  rating: number;
  total_bookings: number;
  completed_bookings: number;
  completion_rate: number;
  avg_rating: number;
  total_earnings: number;
  recent_bookings: number;
  recent_earnings: number;
  performance_change?: number;
}

interface CleanerPerformanceWidgetProps {
  limit?: number;
}

export function CleanerPerformanceWidget({ limit = 5 }: CleanerPerformanceWidgetProps) {
  const { data, error, isLoading, mutate } = useSWR<{
    ok: boolean;
    cleaners?: CleanerPerformance[];
  }>(
    '/api/admin/cleaners/performance',
    async (url) => {
      const response = await fetch(url, { credentials: 'include' });
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || 'Failed to fetch cleaner performance');
      return result;
    },
    {
      revalidateOnFocus: true,
      refreshInterval: 60000,
    }
  );

  const cleaners = data?.cleaners?.slice(0, limit) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-blue-600" />
            Top Cleaner Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-blue-600" />
            Top Cleaner Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-red-600">
            Failed to load cleaner performance
          </div>
        </CardContent>
      </Card>
    );
  }

  if (cleaners.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-blue-600" />
            Top Cleaner Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm text-gray-500">
            No cleaner performance data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPerformanceBadge = (cleaner: CleanerPerformance) => {
    if (cleaner.avg_rating >= 4.8 && cleaner.completion_rate >= 95) {
      return { text: 'Top Performer', color: 'bg-green-100 text-green-800 border-green-300', icon: <Award className="h-3 w-3" /> };
    } else if (cleaner.completion_rate < 80 || cleaner.avg_rating < 3.5) {
      return { text: 'Needs Support', color: 'bg-red-100 text-red-800 border-red-300', icon: <AlertCircle className="h-3 w-3" /> };
    } else if (cleaner.performance_change && cleaner.performance_change > 10) {
      return { text: 'Improving', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: <TrendingUp className="h-3 w-3" /> };
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-blue-600" />
              Top Cleaner Performance
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'cleaners' }))}
              className="text-xs"
            >
              View All
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cleaners.map((cleaner, index) => {
              const badge = getPerformanceBadge(cleaner);
              
              return (
                <motion.div
                  key={cleaner.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: 'cleaners' }))}
                >
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-700">{index + 1}</span>
                    </div>

                    {/* Cleaner Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900 truncate">
                            {cleaner.name}
                          </span>
                          {badge && (
                            <Badge variant="outline" className={`${badge.color} flex items-center gap-1 text-xs px-1.5 py-0`}>
                              {badge.icon}
                              {badge.text}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            {cleaner.avg_rating.toFixed(1)}
                          </span>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-2">
                        <div>
                          <span className="font-medium">{cleaner.total_bookings}</span> bookings
                        </div>
                        <div>
                          <span className="font-medium">{formatCurrency(cleaner.total_earnings)}</span> earned
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{cleaner.completion_rate}%</span>
                          <span className="text-gray-400">complete</span>
                        </div>
                      </div>

                      {/* Completion Rate Progress */}
                      <Progress 
                        value={cleaner.completion_rate} 
                        className="h-1.5"
                      />

                      {/* Recent Performance */}
                      {cleaner.recent_bookings > 0 && (
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-gray-500">
                            {cleaner.recent_bookings} recent booking{cleaner.recent_bookings !== 1 ? 's' : ''}
                          </span>
                          {cleaner.performance_change && cleaner.performance_change !== 0 && (
                            <div className={`flex items-center gap-1 font-medium ${
                              cleaner.performance_change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {cleaner.performance_change > 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              {Math.abs(cleaner.performance_change).toFixed(0)}%
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

