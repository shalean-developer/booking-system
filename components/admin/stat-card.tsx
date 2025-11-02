'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { AnimatedCard } from './animated-card';

interface StatCardProps {
  title: string;
  value: string | number;
  delta?: number | null;
  hint?: string;
  delay?: number;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export function StatCard({ 
  title, 
  value, 
  delta, 
  hint, 
  delay = 0, 
  icon,
  onClick 
}: StatCardProps) {
  return (
    <AnimatedCard delay={delay} hover={!!onClick}>
      <Card 
        className={onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-2xl font-bold">{value}</div>
              {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
            </div>
            {typeof delta === 'number' && (
              <div className={`flex items-center gap-1 text-sm ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {delta >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                {Math.abs(delta)}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

