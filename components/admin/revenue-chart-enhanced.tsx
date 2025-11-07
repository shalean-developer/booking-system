'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DollarSign, Loader2, Download, ZoomIn } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AnimatedCard } from './animated-card';
import { useFilterPeriod } from '@/context/FilterPeriodContext';

interface ChartDataPoint {
  date: string;
  revenue: number;
  bookings: number;
  completed: number;
  companyEarnings: number;
}

interface RevenueChartEnhancedProps {
  data: ChartDataPoint[];
  isLoading?: boolean;
}

const formatDate = (dateStr: string) => {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(date, 'MMM dd');
  } catch {
    return dateStr;
  }
};

const formatCurrency = (value: number) => {
  return `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export function RevenueChartEnhanced({ data, isLoading }: RevenueChartEnhancedProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
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

  const handleExport = () => {
    const headers = ['Date', 'Revenue', 'Company Earnings'];
    const rows = data.map(d => [
      d.date,
      d.revenue.toFixed(2),
      d.companyEarnings.toFixed(2),
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleChartClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      setSelectedDate(data.activePayload[0].payload.date);
    }
  };

  const handleResetZoom = () => {
    setSelectedDate(null);
  };

  // Filter data if date selected (drill-down)
  const displayData = selectedDate 
    ? data.filter(d => d.date === selectedDate)
    : data;

  if (isLoading) {
    return (
      <AnimatedCard>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Trend
              <span className="text-xs text-gray-500 font-normal">({periodLabel})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </AnimatedCard>
    );
  }

  if (!data || data.length === 0) {
    return (
      <AnimatedCard>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Revenue Trend
              <span className="text-xs text-gray-500 font-normal">({periodLabel})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No data available</p>
            </div>
          </CardContent>
        </Card>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Revenue Trend
              <span className="text-xs text-gray-500 font-normal">({periodLabel})</span>
              {selectedDate && (
                <span className="text-xs text-gray-500 font-normal">
                  ({format(parseISO(selectedDate), 'MMM dd, yyyy')})
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedDate && (
                <Button variant="outline" size="sm" onClick={handleResetZoom}>
                  <ZoomIn className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart 
              data={displayData} 
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              onClick={handleChartClick}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                stroke="#d1d5db"
              />
              <YAxis 
                tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                stroke="#d1d5db"
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => {
                  try {
                    return format(typeof label === 'string' ? parseISO(label) : new Date(label), 'MMM dd, yyyy');
                  } catch {
                    return label;
                  }
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={2.5}
                name="Total Revenue"
                dot={false}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="companyEarnings"
                stroke="#10b981"
                strokeWidth={2.5}
                name="Company Earnings"
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

