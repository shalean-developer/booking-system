'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Calendar, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { AnimatedCard } from './animated-card';

interface ChartDataPoint {
  date: string;
  revenue: number;
  bookings: number;
  completed: number;
  companyEarnings: number;
}

interface BookingsChartEnhancedProps {
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

export function BookingsChartEnhanced({ data, isLoading }: BookingsChartEnhancedProps) {
  if (isLoading) {
    return (
      <AnimatedCard>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Bookings Volume
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
              <Calendar className="h-5 w-5" />
              Bookings Volume
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
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Bookings Volume
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                stroke="#d1d5db"
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#6b7280' }}
                stroke="#d1d5db"
              />
              <Tooltip
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
              <Bar 
                dataKey="bookings" 
                fill="#6366f1" 
                name="Total Bookings" 
                radius={[6, 6, 0, 0]}
              />
              <Bar 
                dataKey="completed" 
                fill="#10b981" 
                name="Completed" 
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

