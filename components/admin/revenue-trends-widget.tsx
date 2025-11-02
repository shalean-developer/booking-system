'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Download, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface TrendDataPoint {
  date: string;
  revenue: number;
  previousPeriod?: number;
  projected?: number;
}

interface RevenueTrendsWidgetProps {
  data?: TrendDataPoint[];
  isLoading?: boolean;
  period?: 'day' | 'week' | 'month' | 'quarter';
}

const formatDate = (dateStr: string, period: string) => {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    switch (period) {
      case 'day':
        return format(date, 'MMM dd');
      case 'week':
        return format(date, 'MMM dd');
      case 'month':
        return format(date, 'MMM yyyy');
      case 'quarter':
        return format(date, 'QQQ yyyy');
      default:
        return format(date, 'MMM dd');
    }
  } catch {
    return dateStr;
  }
};

export function RevenueTrendsWidget({ data, isLoading, period = 'day' }: RevenueTrendsWidgetProps) {
  const [view, setView] = useState<'line' | 'area'>('area');
  const [showProjection, setShowProjection] = useState(true);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Revenue Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse space-y-3 w-full">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Revenue Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-sm text-gray-500">
            No revenue data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals and growth
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const previousTotal = data.reduce((sum, d) => sum + (d.previousPeriod || 0), 0);
  const growthPercent = previousTotal > 0 
    ? ((totalRevenue - previousTotal) / previousTotal) * 100 
    : 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-2">
            {payload[0].payload.date ? formatDate(payload[0].payload.date, period) : ''}
          </p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{formatCurrency(entry.value)}</span>
            </p>
          ))}
          {payload[0].payload.previousPeriod !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              Previous: {formatCurrency(payload[0].payload.previousPeriod)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['Date', 'Revenue', 'Previous Period', 'Projected'];
    const rows = data.map(d => [
      d.date,
      d.revenue.toFixed(2),
      d.previousPeriod?.toFixed(2) || '',
      d.projected?.toFixed(2) || '',
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-trends-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Revenue Trends
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setView(view === 'line' ? 'area' : 'line')}
                className="h-8"
              >
                {view === 'line' ? 'Area' : 'Line'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            {growthPercent !== 0 && (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                growthPercent > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {growthPercent > 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(growthPercent).toFixed(1)}% vs previous</span>
              </div>
            )}
            <div className="text-sm text-gray-600">
              Total: <span className="font-semibold text-gray-900">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {view === 'area' ? (
              <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrevious" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => formatDate(date, period)}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#d1d5db"
                />
                <YAxis 
                  tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#d1d5db"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {data[0]?.previousPeriod !== undefined && (
                  <Area
                    type="monotone"
                    dataKey="previousPeriod"
                    name="Previous Period"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    fill="url(#colorPrevious)"
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Current Revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
                {showProjection && data[0]?.projected !== undefined && (
                  <Area
                    type="monotone"
                    dataKey="projected"
                    name="Projected"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="url(#colorProjected)"
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(date) => formatDate(date, period)}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#d1d5db"
                />
                <YAxis 
                  tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  stroke="#d1d5db"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {data[0]?.previousPeriod !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="previousPeriod"
                    name="Previous Period"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="Current Revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                {showProjection && data[0]?.projected !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="projected"
                    name="Projected"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

