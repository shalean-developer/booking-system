'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CheckCircle2, ShieldCheck, CalendarCheck, MessageCircle } from 'lucide-react';

type TaskVariant = 'default' | 'outline' | 'ghost';

export interface QuickStartTask {
  id: string;
  title: string;
  description: string;
  cta: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: TaskVariant;
  onClick?: () => void;
  completed?: boolean;
}

interface QuickStartTasksProps {
  badgeText?: string;
  title?: string;
  subtitle?: string;
  tasks?: QuickStartTask[];
  onStartProfile?: () => void;
  hasProfileDetails?: boolean;
  hasBookings?: boolean;
}

const buildDefaultTasks = (
  hasProfileDetails?: boolean,
  hasBookings?: boolean,
  onStartProfile?: () => void
): QuickStartTask[] => [
  {
    id: 'profile',
    title: 'Add your details',
    description: 'Store your contact info so we can reach you quickly.',
    cta: hasProfileDetails ? 'View details' : 'Add details',
    icon: ShieldCheck,
    variant: 'outline',
    onClick: onStartProfile,
    completed: Boolean(hasProfileDetails),
  },
  {
    id: 'book',
    title: 'Book your first clean',
    description: 'Pick a service, date, and we’ll match you with a pro.',
    cta: hasBookings ? 'Book again' : 'Book now',
    icon: CalendarCheck,
    href: '/booking/service/select',
    variant: 'default',
    completed: Boolean(hasBookings),
  },
  {
    id: 'support',
    title: 'Ask us anything',
    description: 'Need help deciding? Chat with our friendly support team.',
    cta: 'Contact support',
    icon: MessageCircle,
    href: '/contact',
    variant: 'ghost',
    completed: false,
  },
];

export function QuickStartTasks({
  badgeText = 'Getting Started',
  title = 'Make the most of your dashboard',
  subtitle = 'Follow these quick steps to personalise your account and schedule your first clean.',
  tasks,
  onStartProfile,
  hasProfileDetails,
  hasBookings,
}: QuickStartTasksProps) {
  const items =
    tasks && tasks.length > 0
      ? tasks
      : buildDefaultTasks(hasProfileDetails, hasBookings, onStartProfile);

  return (
    <Card className="border border-primary/10 bg-gradient-to-br from-white via-white to-primary/5 shadow-sm">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-primary font-semibold">{badgeText}</p>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mt-1">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {items.map((task) => {
            const Icon = task.icon;
            const isDone = Boolean(task.completed);
            const buttonContent = isDone && task.id === 'profile' ? 'View details' : task.cta;

            const handleClick = () => {
              if (task.onClick) {
                task.onClick();
              } else if (task.id === 'profile' && onStartProfile) {
                onStartProfile();
              }
            };

            return (
              <div
                key={task.id}
                className={cn(
                  'rounded-xl border bg-white p-4 transition-all hover:shadow-sm focus-within:ring-2 focus-within:ring-primary/40',
                  isDone && 'border-green-200 bg-green-50/60'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10',
                      isDone && 'bg-green-100'
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Icon className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{task.description}</p>
                    </div>
                    {task.href ? (
                      <Button
                        asChild
                        variant={task.variant ?? 'default'}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        <Link href={task.href}>{buttonContent}</Link>
                      </Button>
                    ) : (
                      <Button
                        variant={task.variant ?? 'default'}
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={handleClick}
                      >
                        {buttonContent}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

