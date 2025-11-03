'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MoreVertical, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
// Format currency with $ for this card to match image
const formatCurrency = (value: number, showDecimals: boolean = true) => {
  if (isNaN(value) || !isFinite(value)) return showDecimals ? '$0.00' : '$0';
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(value);
  return `$${formatted}`;
};

interface RevenueData {
  date: string;
  revenue: number;
}

interface RevenueCardProps {
  data?: RevenueData[];
  total?: number;
  periodStart?: string;
  periodEnd?: string;
}

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return format(date, 'MMM d');
  } catch {
    return dateStr;
  }
};

export function RevenueCard({
  data = [],
  total = 32490,
  periodStart = 'Jan 2',
  periodEnd = 'Jan 21',
}: RevenueCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 10;

  // Generate sample data if none provided
  const chartData: RevenueData[] = data.length > 0 
    ? data 
    : Array.from({ length: 10 }, (_, i) => {
        const date = new Date(2024, 0, 2 + i);
        return {
          date: date.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 1800) + 200,
        };
      });

  const displayedData = chartData.slice(currentIndex, currentIndex + itemsPerPage);
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex + itemsPerPage < chartData.length;

  // Fixed domain as per image: $0 to $2000
  const maxRevenue = 2000;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 text-white p-2 rounded text-xs border border-white">
          <div className="font-medium">{formatCurrency(payload[0].value)}</div>
          <div className="text-gray-300">{formatDate(label)}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border-0">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900">Revenue</h3>
            <span className="text-xs text-gray-500">Last 10 days</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="text-2xl font-semibold text-gray-900 pb-2">
          {formatCurrency(total)} Period {periodStart} - {periodEnd}
        </div>

        {/* Chart */}
        <div className="relative h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={displayedData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 2000]}
                ticks={[0, 500, 1000, 1500, 2000]}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={(value) => formatCurrency(value, false)}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {displayedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#10b981" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Navigation Arrows */}
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - itemsPerPage))}
            disabled={!canGoLeft}
            className={`absolute left-0 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
              canGoLeft ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'
            }`}
            aria-label="Previous"
          >
            <ArrowLeft className="h-4 w-4 text-gray-400" />
          </button>
          <button
            onClick={() => setCurrentIndex(Math.min(chartData.length - itemsPerPage, currentIndex + itemsPerPage))}
            disabled={!canGoRight}
            className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded transition-colors ${
              canGoRight ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'
            }`}
            aria-label="Next"
          >
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

