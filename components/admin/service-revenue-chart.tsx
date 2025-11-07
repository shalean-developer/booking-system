'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { motion } from 'framer-motion';
import { useFilterPeriod } from '@/context/FilterPeriodContext';

interface ServiceRevenueData {
  service_type: string;
  revenue: number;
  bookings: number;
  avgValue: number;
  change?: number; // percentage change vs previous period
}

interface ServiceRevenueChartProps {
  data?: ServiceRevenueData[];
  isLoading?: boolean;
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // orange
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export function ServiceRevenueChart({ data, isLoading }: ServiceRevenueChartProps) {
  const { selectedPeriod } = useFilterPeriod();

  // Helper function to get display label for selected period
  const getPeriodLabel = (): string => {
    switch (selectedPeriod) {
      case 'Today':
        return 'Today';
      case '7 days':
        return 'Last 7 days';
      case 'Last 10 days':
        return 'Last 10 days';
      case '30 days':
        return 'Last 30 days';
      case '90 days':
        return 'Last 90 days';
      case 'Month':
        return 'This Month';
      default:
        return 'Last 30 days';
    }
  };

  const periodLabel = getPeriodLabel();
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Revenue by Service Type
            <span className="text-xs text-gray-500 font-normal ml-2">({periodLabel})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse space-y-3 w-full max-w-xs">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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
          <CardTitle className="text-base">
            Revenue by Service Type
            <span className="text-xs text-gray-500 font-normal ml-2">({periodLabel})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-sm text-gray-500">
            No service data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalBookings = data.reduce((sum, item) => sum + item.bookings, 0);

  // Calculate percentages for the chart
  const chartData = data.map((item) => ({
    name: item.service_type,
    value: item.revenue,
    percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
  }));

  // Sort by revenue descending
  const sortedData = [...data].sort((a, b) => b.revenue - a.revenue);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            Revenue: <span className="font-semibold">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-xs text-gray-500">
            {data.percentage.toFixed(1)}% of total
          </p>
        </div>
      );
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
            <CardTitle className="text-base">
            Revenue by Service Type
            <span className="text-xs text-gray-500 font-normal ml-2">({periodLabel})</span>
          </CardTitle>
            <Badge variant="outline" className="text-xs">
              {totalBookings} bookings
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false} 
                    label={(props: any) => {
                      const percentage = props.percent * 100;
                      return percentage > 10 ? `${props.name} ${percentage.toFixed(0)}%` : '';
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Service Details List */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500 mb-3">
                Ranked by revenue
              </div>
              {sortedData.map((service, index) => {
                const percentage = (service.revenue / totalRevenue) * 100;
                const changeIcon = service.change && service.change > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : service.change && service.change < 0 ? (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                ) : null;

                return (
                  <div key={service.service_type} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-gray-900">
                          {service.service_type}
                        </span>
                        {changeIcon && service.change && (
                          <div className="flex items-center gap-1 text-xs">
                            {changeIcon}
                            <span className={service.change > 0 ? 'text-green-600' : 'text-red-600'}>
                              {Math.abs(service.change).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{formatCurrency(service.revenue)}</span>
                        <span className="text-gray-500">
                          {service.bookings} booking{service.bookings !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Avg: {formatCurrency(service.avgValue)}</span>
                          <span>{percentage.toFixed(1)}% of total</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="h-1.5 rounded-full transition-all"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

