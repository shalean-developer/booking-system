'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, FileText, Users, Calendar, MessageSquare } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      title: 'New Booking',
      description: 'Create a manual booking',
      href: '/admin/bookings?action=new',
      icon: Plus,
      variant: 'default' as const,
    },
    {
      title: 'View Quotes',
      description: 'Review pending quotes',
      href: '/admin/quotes',
      icon: FileText,
      variant: 'outline' as const,
    },
    {
      title: 'Applications',
      description: 'Review cleaner applications',
      href: '/admin/applications',
      icon: Users,
      variant: 'outline' as const,
    },
    {
      title: 'Schedule',
      description: 'View calendar schedule',
      href: '/admin/schedule',
      icon: Calendar,
      variant: 'outline' as const,
    },
    {
      title: 'Reviews',
      description: 'Manage reviews',
      href: '/admin/reviews',
      icon: MessageSquare,
      variant: 'outline' as const,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                asChild
                variant={action.variant}
                className="justify-start h-auto py-3 px-4"
              >
                <Link href={action.href}>
                  <Icon className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-70">{action.description}</div>
                  </div>
                </Link>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


