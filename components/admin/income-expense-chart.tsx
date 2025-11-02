'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface IncomeExpenseData {
  date: string;
  income: number;
  expense: number;
}

interface IncomeExpenseChartProps {
  data: IncomeExpenseData[];
  totalIncome: number;
  totalExpenses: number;
}

export function IncomeExpenseChart({
  data,
  totalIncome,
  totalExpenses,
}: IncomeExpenseChartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Ensure we have data for the chart
  const chartData = data.length > 0 ? data : [{ date: new Date().toISOString().slice(0, 10), income: 0, expense: 0 }];

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">Income and Expense</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#ef4444" name="Expense" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-xs text-gray-600 mb-1">Total Income</div>
              <div className="text-lg font-semibold text-green-600">
                {formatCurrency(totalIncome)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Total Expenses</div>
              <div className="text-lg font-semibold text-red-600">
                {formatCurrency(totalExpenses)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

