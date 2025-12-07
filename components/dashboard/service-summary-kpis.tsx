'use client';

import { memo, useMemo } from 'react';
import { KPICard } from './kpi-card';
import { KPISkeleton } from './Skeleton';
import { Calendar, CalendarCheck, CheckCircle, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

interface ServiceSummaryKPIsProps {
  upcomingAppointments: number;
  activeCleaningPlans: number;
  lastCleaningCompleted: string | null;
  balanceDue: number;
  isLoading?: boolean;
}

export const ServiceSummaryKPIs = memo(function ServiceSummaryKPIs({
  upcomingAppointments,
  activeCleaningPlans,
  lastCleaningCompleted,
  balanceDue,
  isLoading = false,
}: ServiceSummaryKPIsProps) {
  const formatLastCleaning = (date: string | null) => {
    if (!date) return 'Never';
    const lastDate = new Date(date);
    const daysAgo = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    return format(lastDate, 'MMM d');
  };

  const lastCleaningFormatted = useMemo(
    () => formatLastCleaning(lastCleaningCompleted),
    [lastCleaningCompleted]
  );

  const balanceFormatted = useMemo(
    () => balanceDue > 0 ? `R${(balanceDue / 100).toFixed(2)}` : 'R0.00',
    [balanceDue]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
        {[...Array(4)].map((_, i) => (
          <KPISkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
      <KPICard
        icon={Calendar}
        label="Upcoming Appointments"
        value={upcomingAppointments}
        iconColor="text-teal-600"
        gradient="bg-gradient-to-br from-white to-teal-50/30"
        index={0}
      />
      <KPICard
        icon={CalendarCheck}
        label="Active Cleaning Plans"
        value={activeCleaningPlans}
        iconColor="text-blue-600"
        gradient="bg-gradient-to-br from-white to-blue-50/30"
        index={1}
      />
      <KPICard
        icon={CheckCircle}
        label="Last Cleaning Completed"
        value={lastCleaningFormatted}
        iconColor="text-blue-600"
        gradient="bg-gradient-to-br from-white to-blue-50/30"
        index={2}
      />
      <KPICard
        icon={CreditCard}
        label="Balance Due"
        value={balanceFormatted}
        iconColor={balanceDue > 0 ? "text-red-600" : "text-gray-600"}
        gradient={balanceDue > 0 ? "bg-gradient-to-br from-white to-red-50/30" : "bg-gradient-to-br from-white to-gray-50/30"}
        index={3}
      />
    </div>
  );
});
