'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamic from 'next/dynamic';

const RevenueChart = dynamic(
  () => import('recharts').then((mod) => {
    const { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } = mod;
    
    return function RevenueChartComponent({ data, isLoading }: { data: any[]; isLoading?: boolean }) {
      if (isLoading || !data || data.length === 0) {
        return (
          <div className="h-[250px] flex items-center justify-center text-gray-500">
            {isLoading ? 'Loading...' : 'No data available'}
          </div>
        );
      }

      // Transform data for the chart
      const chartData = data.map((item: any) => ({
        date: item.date || item.period || item.label || '',
        revenue: item.revenue || item.total_amount || item.value || 0,
      }));

      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `R${(value / 100).toFixed(0)}`}
            />
            <Tooltip 
              formatter={(value: number) => [`R${(value / 100).toFixed(2)}`, 'Revenue']}
              labelStyle={{ color: '#000' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Revenue"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[250px] animate-pulse bg-gray-100 rounded" /> }
);

export interface RevenueChartEnhancedProps {
  data: any[];
  isLoading?: boolean;
}

export function RevenueChartEnhanced({ data, isLoading }: RevenueChartEnhancedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <RevenueChart data={data} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}

