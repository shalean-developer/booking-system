'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface ConversionsCardProps {
  bookings?: number;
  quotes?: number;
}

export function ConversionsCard({
  bookings = 19,
  quotes = 58,
}: ConversionsCardProps) {
  const total = bookings + quotes;
  const bookedPercentage = total > 0 ? Math.round((bookings / total) * 100) : 0;

  const data = [
    { name: 'Booked', value: bookings, color: '#10b981' },
    { name: 'Quotes', value: quotes, color: '#9ca3af' },
  ];

  return (
    <Card className="bg-white rounded-lg shadow-sm border-0">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-gray-900">Conversions</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 sm:gap-3">
            <span>Today</span>
            <Button variant="ghost" size="icon" className="h-5 w-5">
              <MoreVertical className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
          {/* Donut Chart */}
          <div className="relative flex-shrink-0" style={{ width: '140px', height: '140px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl font-semibold text-green-600">{bookedPercentage}%</div>
                <div className="text-xs text-gray-500">Booked</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="w-full space-y-2.5 sm:flex-1">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm text-gray-700">{bookings} Bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
              <span className="text-sm text-gray-700">{quotes} Quotes</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-700">{total} Total</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

