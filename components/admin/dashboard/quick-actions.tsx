'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, FileText, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'outline';
}

function QuickActionButton({ href, icon, label, variant = 'outline' }: QuickActionButtonProps) {
  const baseClasses = "flex flex-col items-center justify-center gap-2.5 h-full min-h-[120px] w-full rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] hover:scale-[1.02] p-4";
  
  const variantClasses = variant === 'primary' 
    ? "bg-primary text-primary-foreground hover:bg-primary/90"
    : "border border-input bg-background hover:bg-accent hover:text-accent-foreground";

  return (
    <Link
      href={href}
      className={cn(baseClasses, variantClasses)}
      style={{
        touchAction: 'manipulation',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div className="flex-shrink-0 flex items-center justify-center">{icon}</div>
      <span 
        className="text-sm font-medium text-center leading-snug px-1 break-words whitespace-normal"
        style={{ 
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
          hyphens: 'auto'
        }}
      >
        {label}
      </span>
    </Link>
  );
}

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="min-w-0">
            <QuickActionButton
              href="/admin/bookings/new"
              icon={<Plus className="h-5 w-5" />}
              label="New Booking"
              variant="primary"
            />
          </div>
          <div className="min-w-0">
            <QuickActionButton
              href="/admin/bookings"
              icon={<Calendar className="h-5 w-5" />}
              label="View Bookings"
              variant="outline"
            />
          </div>
          <div className="min-w-0">
            <QuickActionButton
              href="/admin/quotes"
              icon={<FileText className="h-5 w-5" />}
              label="View Quotes"
              variant="outline"
            />
          </div>
          <div className="min-w-0">
            <QuickActionButton
              href="/admin/cleaners"
              icon={<Users className="h-5 w-5" />}
              label="Manage Cleaners"
              variant="outline"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
