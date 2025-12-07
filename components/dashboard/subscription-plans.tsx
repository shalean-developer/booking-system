'use client';

import { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlanCard } from './plan-card';
import { SubscriptionPlansSkeleton } from './Skeleton';
import { RefreshCw, Plus, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface RecurringSchedule {
  id: string;
  service_type: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  preferred_time: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
}

interface SubscriptionPlansProps {
  schedules: RecurringSchedule[];
  isLoading?: boolean;
  onUpgrade?: (scheduleId: string) => void;
  onModify?: (scheduleId: string) => void;
}

export const SubscriptionPlans = memo(function SubscriptionPlans({
  schedules,
  isLoading = false,
  onUpgrade,
  onModify,
}: SubscriptionPlansProps) {
  const router = useRouter();

  const activeSchedules = useMemo(
    () => schedules.filter(s => s.is_active),
    [schedules]
  );

  const handleUpgrade = useCallback((scheduleId: string) => {
    if (onUpgrade) {
      onUpgrade(scheduleId);
    } else {
      router.push(`/dashboard/plans/${scheduleId}/upgrade`);
    }
  }, [onUpgrade, router]);

  const handleModify = useCallback((scheduleId: string) => {
    if (onModify) {
      onModify(scheduleId);
    } else {
      router.push(`/dashboard/plans/${scheduleId}/modify`);
    }
  }, [onModify, router]);

  if (isLoading) {
    return <SubscriptionPlansSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-gradient-to-br from-white to-teal-50/30 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg font-semibold">
          <RefreshCw className="h-5 w-5 text-teal-600" />
          Active Cleaning Plans
        </CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/plans" className="text-[10px] sm:text-xs">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeSchedules.length === 0 ? (
          <div className="text-center py-8">
            <RefreshCw className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3" />
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4">No active cleaning plans</p>
            <Button asChild className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-sm sm:text-base h-10 sm:h-11">
              <Link href="/booking/service/select?recurring=true">
                <Plus className="h-4 w-4 mr-2" />
                Add New Plan
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {activeSchedules.slice(0, 2).map((schedule) => (
              <PlanCard
                key={schedule.id}
                id={schedule.id}
                serviceType={schedule.service_type}
                frequency={schedule.frequency}
                preferredTime={schedule.preferred_time}
                address={`${schedule.address_line1}, ${schedule.address_suburb}, ${schedule.address_city}`}
                startDate={schedule.start_date}
                endDate={schedule.end_date || undefined}
                isActive={schedule.is_active}
                onUpgrade={() => handleUpgrade(schedule.id)}
                onModify={() => handleModify(schedule.id)}
              />
            ))}
            {activeSchedules.length > 2 && (
              <Button variant="outline" className="w-full h-9 sm:h-10 text-xs sm:text-sm touch-manipulation" asChild>
                <Link href="/dashboard/plans">View All Plans</Link>
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full border-dashed border-2 border-teal-300 text-teal-600 hover:bg-teal-50 h-9 sm:h-10 text-xs sm:text-sm touch-manipulation"
              asChild
            >
              <Link href="/booking/service/select?recurring=true">
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                Add New Plan
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
    </motion.div>
  );
});
