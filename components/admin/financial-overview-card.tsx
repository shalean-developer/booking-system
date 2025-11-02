'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FinancialOverviewCardProps {
  title: string;
  total: number;
  current: number;
  overdue: number;
  icon?: React.ReactNode;
  type: 'receivables' | 'payables';
}

export function FinancialOverviewCard({
  title,
  total,
  current,
  overdue,
  icon,
  type,
}: FinancialOverviewCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const currentPercent = total > 0 ? (current / total) * 100 : 0;
  const overduePercent = total > 0 ? (overdue / total) * 100 : 0;

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          {icon && <span className="text-gray-500">{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {formatCurrency(total)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">CURRENT</span>
              <span className="font-medium text-gray-900">{formatCurrency(current)}</span>
            </div>
            <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${currentPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">OVERDUE</span>
              <span className="font-medium text-red-600">{formatCurrency(overdue)}</span>
            </div>
            <div className="relative h-2 bg-red-100 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-red-500 rounded-full transition-all"
                style={{ width: `${overduePercent}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

