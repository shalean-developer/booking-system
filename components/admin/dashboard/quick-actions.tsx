'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, FileText, Users } from 'lucide-react';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button asChild className="h-auto flex-col py-6 px-4 min-h-[100px]">
            <Link href="/admin/bookings/new" className="flex flex-col items-center justify-center gap-2">
              <Plus className="h-5 w-5" />
              <span className="text-sm font-medium text-center leading-tight">New Booking</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col py-6 px-4 min-h-[100px]">
            <Link href="/admin/bookings" className="flex flex-col items-center justify-center gap-2">
              <Calendar className="h-5 w-5" />
              <span className="text-sm font-medium text-center leading-tight">View Bookings</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col py-6 px-4 min-h-[100px]">
            <Link href="/admin/quotes" className="flex flex-col items-center justify-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium text-center leading-tight">View Quotes</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col py-6 px-4 min-h-[100px]">
            <Link href="/admin/cleaners" className="flex flex-col items-center justify-center gap-2">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium text-center leading-tight">Manage Cleaners</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
