'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BankAccount {
  name: string;
  balance: number;
  accountType: 'income' | 'expense' | 'savings' | 'payment';
  uncategorized?: number;
}

interface BankAccountsWidgetProps {
  accounts: BankAccount[];
}

export function BankAccountsWidget({ accounts }: BankAccountsWidgetProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'bg-green-100 text-green-800';
      case 'expense':
        return 'bg-red-100 text-red-800';
      case 'savings':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">Bank and Credit Cards</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map((account, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{account.name}</span>
                  <Badge variant="outline" className={getAccountTypeColor(account.accountType)}>
                    {account.accountType}
                  </Badge>
                </div>
                {account.uncategorized !== undefined && account.uncategorized > 0 && (
                  <span className="text-xs text-amber-600">
                    {account.uncategorized} uncategorized transactions
                  </span>
                )}
              </div>
              <span
                className={`text-sm font-semibold ${
                  account.balance >= 0 ? 'text-gray-900' : 'text-red-600'
                }`}
              >
                {formatCurrency(account.balance)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

