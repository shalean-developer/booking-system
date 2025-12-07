'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  iconColor?: string;
  gradient?: string;
  index?: number;
}

export const KPICard = memo(function KPICard({ 
  icon: Icon, 
  label, 
  value, 
  iconColor = 'text-teal-600', 
  gradient,
  index = 0 
}: KPICardProps) {
  // Check if label is "Upcoming Appointments" for special mobile handling
  const isUpcomingAppointments = label === 'Upcoming Appointments';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="lg:hover:scale-[1.02] lg:hover:-translate-y-1"
    >
      <Card className={cn(
        "overflow-hidden transition-all duration-300 lg:hover:shadow-lg",
        gradient || "bg-gradient-to-br from-white to-teal-50/30"
      )}>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium text-gray-600 mb-1 leading-tight",
                "text-xs sm:text-sm"
              )}>
                {label}
              </p>
              <motion.p 
                className={cn(
                  "font-bold text-gray-900 leading-none",
                  typeof value === 'number' && value > 99 
                    ? "text-base sm:text-lg lg:text-2xl" 
                    : "text-lg sm:text-xl lg:text-3xl"
                )}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.2 }}
              >
                {value}
              </motion.p>
            </div>
            <div className={cn(
              "rounded-lg bg-gradient-to-br from-teal-100 to-blue-100 flex-shrink-0",
              iconColor,
              "p-2 sm:p-2.5 lg:p-3"
            )}>
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
