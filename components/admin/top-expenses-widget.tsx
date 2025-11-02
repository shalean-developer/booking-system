'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExpenseItem {
  category: string;
  amount: number;
}

interface TopExpensesWidgetProps {
  expenses: ExpenseItem[];
}

export function TopExpensesWidget({ expenses }: TopExpensesWidgetProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (expenses.length === 0) {
    return (
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900">Top Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 text-sm">
            No expenses recorded for this month.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">Top Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expenses.map((expense, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-xs">{index + 1}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">{expense.category}</span>
              </div>
              <span className="text-sm font-semibold text-red-600">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

