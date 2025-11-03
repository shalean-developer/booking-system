'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChevronDown, MoreVertical, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface BookingData {
  date: string;
  moveInMoveOut: number;
  standardCleaning: number;
  deepCleaning: number;
}

interface NewBookingsCardProps {
  data?: BookingData[];
  total?: number;
  moveInMoveOut?: number;
  standardCleaning?: number;
  deepCleaning?: number;
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

const formatDate = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return format(date, 'MMM d');
  } catch {
    return dateStr;
  }
};

export function NewBookingsCard({
  data = [],
  total = 32494,
  moveInMoveOut = 10679,
  standardCleaning = 11134,
  deepCleaning = 9223,
}: NewBookingsCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 10;

  // Generate sample data if none provided
  const chartData: BookingData[] = data.length > 0 
    ? data 
    : Array.from({ length: 10 }, (_, i) => {
        const date = new Date(2024, 0, 2 + i);
        return {
          date: date.toISOString().split('T')[0],
          moveInMoveOut: Math.floor(Math.random() * 1500) + 500,
          standardCleaning: Math.floor(Math.random() * 1500) + 500,
          deepCleaning: Math.floor(Math.random() * 1200) + 400,
        };
      });

  const displayedData = chartData.slice(currentIndex, currentIndex + itemsPerPage);
  const canGoLeft = currentIndex > 0;
  const canGoRight = currentIndex + itemsPerPage < chartData.length;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0]; // Show only the hovered entry
      return (
        <div className="bg-gray-800 text-white p-2 rounded text-xs border border-white">
          <div className="flex items-center gap-2">
            <span className="font-medium">{entry.name} • {formatNumber(entry.value)}</span>
          </div>
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
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-medium text-gray-900">New Bookings</h3>
            <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Last 10 days</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="space-y-3 pb-2">
          <div className="text-3xl font-semibold text-gray-900">{formatNumber(total)} Total</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">{formatNumber(moveInMoveOut)} Move In/ Move Out</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-600">{formatNumber(standardCleaning)} Standard Cleaning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-gray-600">{formatNumber(deepCleaning)} Deep Cleaning</span>
            </div>
          </div>
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
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                iconType="circle"
              />
              <Bar dataKey="moveInMoveOut" fill="#3b82f6" name="Move In/ Move Out" radius={[4, 4, 0, 0]} />
              <Bar dataKey="standardCleaning" fill="#eab308" name="Standard Cleaning" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deepCleaning" fill="#ef4444" name="Deep Cleaning" radius={[4, 4, 0, 0]} />
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

