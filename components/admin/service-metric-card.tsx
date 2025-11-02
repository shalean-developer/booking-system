'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from 'lucide-react';

interface ServiceMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  badge?: {
    label: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function ServiceMetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  badge,
  onClick,
  href,
  className,
}: ServiceMetricCardProps) {
  const router = useRouter();
  
  // Get badge styling based on variant
  const getBadgeClassName = (variant?: string) => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'secondary':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'outline':
        return 'border border-gray-300 text-gray-700 hover:bg-gray-50';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
  };

  const isClickable = onClick || href;

  const cardContent = (
    <Card 
      className={cn(
        'bg-white rounded-xl shadow-card border border-gray-200 transition-all duration-300',
        isClickable && 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      onClick={handleClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <span className="text-gray-500 h-4 w-4">{icon}</span>}
            <span>{title}</span>
          </div>
          {badge && (
            <Badge 
              variant={badge.variant || 'default'}
              className={`${getBadgeClassName(badge.variant)} text-xs font-medium px-2 py-0.5 whitespace-nowrap`}
            >
              {badge.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <motion.div 
            className="text-3xl font-bold text-gray-900 tracking-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            {value}
          </motion.div>
          {subtitle && (
            <div className="text-sm text-gray-600 font-normal">{subtitle}</div>
          )}
          {trend && (
            <motion.div 
              className={cn(
                'text-xs font-medium flex items-center gap-1',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{Math.abs(trend.value)}% {trend.label}</span>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return cardContent;
}

