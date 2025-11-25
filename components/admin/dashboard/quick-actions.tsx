'use client';

import { memo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, FileText, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  variant?: 'primary' | 'outline';
  'aria-label'?: string;
}

const QuickActionButton = memo(function QuickActionButton({ 
  href, 
  icon, 
  label, 
  sublabel,
  variant = 'outline',
  'aria-label': ariaLabel 
}: QuickActionButtonProps) {
  const baseClasses = "flex flex-col items-center justify-center gap-3 h-full min-h-[110px] w-full rounded-lg transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.97] hover:scale-[1.01] p-4 cursor-pointer";
  
  const variantClasses = variant === 'primary' 
    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md"
    : "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20";

  return (
    <Link
      href={href}
      className={cn(baseClasses, variantClasses)}
      aria-label={ariaLabel || `${label}${sublabel ? ` - ${sublabel}` : ''}`}
      style={{
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Icon container - fixed size, centered */}
      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10">
        {icon}
      </div>
      
      {/* Label container - centered text, two-line layout */}
      <div className="flex flex-col items-center justify-center gap-0.5 w-full">
        <span className="text-sm font-medium leading-tight text-center block">
        {label}
      </span>
        {sublabel && (
          <span className={cn(
            "text-xs leading-tight text-center block",
            variant === 'primary' ? 'opacity-90' : 'opacity-80'
          )}>
            {sublabel}
          </span>
        )}
      </div>
    </Link>
  );
});

export const QuickActions = memo(function QuickActions() {
  const actions = [
    {
      href: '/admin/bookings/new',
      icon: <Plus className="h-5 w-5" />,
      label: 'New',
      sublabel: 'Booking',
      variant: 'primary' as const,
      ariaLabel: 'Create new booking',
    },
    {
      href: '/admin/bookings',
      icon: <Calendar className="h-5 w-5" />,
      label: 'View',
      sublabel: 'Bookings',
      variant: 'outline' as const,
      ariaLabel: 'View all bookings',
    },
    {
      href: '/admin/quotes',
      icon: <FileText className="h-5 w-5" />,
      label: 'View',
      sublabel: 'Quotes',
      variant: 'outline' as const,
      ariaLabel: 'View all quotes',
    },
    {
      href: '/admin/cleaners',
      icon: <Users className="h-5 w-5" />,
      label: 'Manage',
      sublabel: 'Cleaners',
      variant: 'outline' as const,
      ariaLabel: 'Manage cleaners',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {actions.map((action) => (
          <QuickActionButton
              key={action.href}
              href={action.href}
              icon={action.icon}
              label={action.label}
              sublabel={action.sublabel}
              variant={action.variant}
              aria-label={action.ariaLabel}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
