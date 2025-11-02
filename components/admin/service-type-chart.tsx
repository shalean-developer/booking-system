'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ServiceTypeData {
  serviceType: string;
  bookings: number;
  revenue: number;
}

interface ServiceTypeChartProps {
  data: ServiceTypeData[];
}

export function ServiceTypeChart({ data }: ServiceTypeChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format service type labels for better readability
  const formatServiceTypeLabel = (label: string) => {
    // Replace common long patterns with shorter versions
    const replacements: Record<string, string> = {
      'Standard Home Cleaning': 'Standard',
      'Move In/Out': 'Move In/Out',
      'Deep Clean': 'Deep',
      'Deep Cleaning': 'Deep',
    };
    
    // Check for exact matches first
    if (replacements[label]) {
      return replacements[label];
    }
    
    // For other labels, truncate if too long
    if (label.length > 15) {
      return label.substring(0, 12) + '...';
    }
    
    return label;
  };

  // Sort by bookings count (descending) and ensure we have data
  const sortedData = data.length > 0 
    ? [...data].sort((a, b) => b.bookings - a.bookings)
    : [{ serviceType: 'No Data', bookings: 0, revenue: 0 }];

  return (
    <Card className="bg-white rounded-xl shadow-card border border-gray-200 hover:shadow-card-hover transition-shadow duration-300">
      <CardHeader className="pb-2 px-6 pt-4">
        <CardTitle className="text-lg font-semibold text-gray-900">Today's Service Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-4 pt-0">
        <div>
          {/* Chart */}
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={sortedData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="serviceType"
                angle={-45}
                textAnchor="end"
                height={50}
                tickFormatter={formatServiceTypeLabel}
                stroke="#6b7280"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                interval={0}
              />
              <YAxis
                yAxisId="bookings"
                orientation="left"
                stroke="#3b82f6"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                label={{ value: 'Bookings', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6b7280' } }}
              />
              <YAxis
                yAxisId="revenue"
                orientation="right"
                stroke="#10b981"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
                label={{ value: 'Revenue', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#6b7280' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'revenue') {
                    return [formatCurrency(value), 'Revenue'];
                  }
                  return [value, name === 'bookings' ? 'Bookings' : name];
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '4px' }}
              />
              <Bar 
                yAxisId="bookings"
                dataKey="bookings" 
                fill="#3b82f6" 
                name="Bookings" 
                radius={[6, 6, 0, 0]}
                opacity={0.9}
              />
              <Bar 
                yAxisId="revenue"
                dataKey="revenue" 
                fill="#10b981" 
                name="Revenue" 
                radius={[6, 6, 0, 0]}
                opacity={0.9}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

