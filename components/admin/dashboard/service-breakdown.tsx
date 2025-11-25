'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { ServiceBreakdownItem } from '@/types/admin-dashboard';

interface ServiceBreakdownProps {
  data: ServiceBreakdownItem[] | null;
  isLoading?: boolean;
}

// Optimized color palette - distinct, accessible colors
const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export function ServiceBreakdown({ data, isLoading = false }: ServiceBreakdownProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Breakdown</CardTitle>
          <CardDescription>Distribution of bookings by service type</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Optimize data: combine small segments (< 2%) into "Other"
  const optimizedData = useMemo((): ServiceBreakdownItem[] => {
    if (!data || data.length === 0) return [];

    const total = data.reduce((sum, item) => sum + item.value, 0);
    const threshold = total * 0.02; // 2% threshold

    const mainItems: ServiceBreakdownItem[] = [];
    const otherItems: ServiceBreakdownItem[] = [];
    let otherTotal = 0;

    data.forEach((item) => {
      if (item.value >= threshold) {
        mainItems.push(item);
      } else {
        otherItems.push(item);
        otherTotal += item.value;
      }
    });

    // Add "Other" category if there are small segments
    if (otherTotal > 0) {
      mainItems.push({
        name: 'Other',
        value: otherTotal,
      });
    }

    return mainItems;
  }, [data]);

  // Calculate total for percentage calculations
  const total = useMemo(() => {
    return optimizedData.reduce((sum, item) => sum + item.value, 0);
  }, [optimizedData]);

  if (!data || data.length === 0 || optimizedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Breakdown</CardTitle>
          <CardDescription>Distribution of bookings by service type</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Custom label function - only show labels for slices > 5%
  const renderLabel = (entry: any) => {
    const percent = entry.percent * 100;
    if (percent < 5) return ''; // Don't show labels for very small slices
    return `${percent.toFixed(0)}%`;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-600">
            {data.value.toLocaleString()} bookings ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Breakdown</CardTitle>
        <CardDescription>Distribution of bookings by service type</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={optimizedData}
              cx="50%"
              cy="50%"
              label={renderLabel}
              labelLine={false}
              outerRadius={90}
              innerRadius={40}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {optimizedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value, entry: any) => {
                const percent = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : '0';
                return `${value} (${percent}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
