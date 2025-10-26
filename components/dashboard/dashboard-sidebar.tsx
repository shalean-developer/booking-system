'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, Briefcase, Home } from 'lucide-react';

interface DashboardSidebarProps {
  user: any;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    totalBookings: number;
  } | null;
}

export function DashboardSidebar({ user, customer }: DashboardSidebarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="hidden lg:block space-y-6"
    >
      {/* Profile Card - Hidden on mobile */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {customer?.firstName && customer?.lastName 
                ? `${customer.firstName} ${customer.lastName}`
                : user?.user_metadata?.first_name || 'User'}
            </h3>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span>{user?.email}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-600 mb-1">Member Since</p>
            <p className="font-semibold text-gray-900">
              {new Date(user?.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          <Button variant="outline" className="w-full" disabled>
            Edit Profile
            <span className="ml-2 text-xs">(Coming Soon)</span>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Button className="w-full bg-primary hover:bg-primary/90" asChild>
              <Link href="/booking/service/select">
                <Briefcase className="mr-2 h-4 w-4" />
                Book a Service
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

