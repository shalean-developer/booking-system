'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Sparkline } from './sparkline';

interface EnhancedStatCardProps {
  title: string;
  value: string | number;
  change?: number | null; // Percent change vs previous period
  sparklineData?: number[];
  icon?: React.ReactNode;
  delay?: number;
  isCurrency?: boolean;
}

export function EnhancedStatCard({
  title,
  value,
  change,
  sparklineData = [],
  icon,
  delay = 0,
  isCurrency = false,
}: EnhancedStatCardProps) {
  const hasPositiveChange = change !== null && change !== undefined && change >= 0;
  const changeColor = hasPositiveChange ? 'text-emerald-600' : 'text-rose-600';
  const changeBg = hasPositiveChange ? 'bg-emerald-50' : 'bg-rose-50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="bg-white rounded-2xl p-4 shadow-sm text-slate-800 hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {icon && <span className="text-slate-600">{icon}</span>}
              <span className="text-sm font-medium text-slate-600">{title}</span>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="text-2xl font-bold text-slate-900">
              {isCurrency && typeof value === 'string' ? value : value}
            </div>
          </div>

          {/* Sparkline */}
          {sparklineData.length > 0 && (
            <div className="h-12 mb-2 -mx-4 px-4 flex items-center">
              <Sparkline
                data={sparklineData}
                width={200}
                height={40}
                color={hasPositiveChange ? '#10b981' : '#ef4444'}
              />
            </div>
          )}

          {/* Percent Change */}
          {change !== null && change !== undefined && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${changeBg} ${changeColor}`}>
              {hasPositiveChange ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
              <span>{Math.abs(change).toFixed(1)}%</span>
              <span className="text-slate-500 ml-1">vs last period</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

