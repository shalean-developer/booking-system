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
          <Button asChild className="h-auto flex-col py-4">
            <Link href="/admin/bookings/new">
              <Plus className="h-5 w-5 mb-2" />
              <span>New Booking</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col py-4">
            <Link href="/admin/bookings">
              <Calendar className="h-5 w-5 mb-2" />
              <span>View Bookings</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col py-4">
            <Link href="/admin/quotes">
              <FileText className="h-5 w-5 mb-2" />
              <span>View Quotes</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col py-4">
            <Link href="/admin/cleaners">
              <Users className="h-5 w-5 mb-2" />
              <span>Manage Cleaners</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
