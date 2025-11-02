'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface CashFlowData {
  date: string;
  cash: number;
  incoming: number;
  outgoing: number;
}

interface CashFlowChartProps {
  data: CashFlowData[];
  currentCash: number;
  totalIncoming: number;
  totalOutgoing: number;
  startingDate: string;
  endingDate: string;
}

export function CashFlowChart({
  data,
  currentCash,
  totalIncoming,
  totalOutgoing,
  startingDate,
  endingDate,
}: CashFlowChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Ensure we have data for the chart
  const chartData = data.length > 0 ? data : [{ date: new Date().toISOString().slice(0, 10), incoming: 0, outgoing: 0, cash: 0 }];

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">Cash Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  try {
                    return format(parseISO(value), 'MMM yyyy');
                  } catch {
                    return value;
                  }
                }}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(value) => {
                  try {
                    return format(parseISO(value), 'MMM d, yyyy');
                  } catch {
                    return value;
                  }
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cash"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Cash"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-gray-600 mb-1">Cash as on {format(parseISO(startingDate), 'dd MMM yyyy')}</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(chartData[0]?.cash || 0)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Incoming</div>
              <div className="text-sm font-semibold text-green-600">
                {formatCurrency(totalIncoming)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Outgoing</div>
              <div className="text-sm font-semibold text-red-600">
                {formatCurrency(totalOutgoing)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Cash as on {format(parseISO(endingDate), 'dd MMM yyyy')}</div>
              <div className="text-sm font-semibold text-gray-900">
                {formatCurrency(currentCash)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

