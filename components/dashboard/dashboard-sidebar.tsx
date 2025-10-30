'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Mail, Briefcase, Home, Calendar, MapPin, CreditCard, DollarSign, Ticket, Share2 } from 'lucide-react';

interface DashboardSidebarProps {
  user: any;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    totalBookings: number;
  } | null;
  isLoading?: boolean;
}

export function DashboardSidebar({ user, customer, isLoading }: DashboardSidebarProps) {
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
              {isLoading ? (
                <span className="inline-block h-6 w-40 bg-gray-200 rounded animate-pulse" />
              ) : customer?.firstName && customer?.lastName 
                ? `${customer.firstName} ${customer.lastName}`
                : user?.user_metadata?.first_name || 'User'}
            </h3>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              {isLoading ? (
                <span className="inline-block h-4 w-48 bg-gray-200 rounded animate-pulse" />
              ) : (
                <span>{user?.email}</span>
              )}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-600 mb-1">Member Since</p>
            <p className="font-semibold text-gray-900">
              {isLoading ? (
                <span className="inline-block h-5 w-28 bg-gray-200 rounded animate-pulse" />
              ) : (
                new Date(user?.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
              )}
            </p>
          </div>

          <Button variant="outline" className="w-full" disabled>
            Edit Profile
            <span className="ml-2 text-xs">(Coming Soon)</span>
          </Button>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Menu</h3>
          <nav className="space-y-1 text-sm">
            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <button className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-400 cursor-not-allowed" disabled>
              <User className="h-4 w-4" />
              <span>Profile</span>
              <span className="ml-auto text-[10px]">Coming soon</span>
            </button>
            <Link href="/dashboard/bookings" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50">
              <Calendar className="h-4 w-4" />
              <span>Bookings</span>
            </Link>
            <button className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-400 cursor-not-allowed" disabled>
              <User className="h-4 w-4" />
              <span>Cleaners</span>
              <span className="ml-auto text-[10px]">Coming soon</span>
            </button>
            <button className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-400 cursor-not-allowed" disabled>
              <MapPin className="h-4 w-4" />
              <span>Locations</span>
              <span className="ml-auto text-[10px]">Coming soon</span>
            </button>
            <button className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-400 cursor-not-allowed" disabled>
              <CreditCard className="h-4 w-4" />
              <span>Payments</span>
              <span className="ml-auto text-[10px]">Coming soon</span>
            </button>
            <button className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-400 cursor-not-allowed" disabled>
              <DollarSign className="h-4 w-4" />
              <span>Credits</span>
              <span className="ml-auto text-[10px]">Coming soon</span>
            </button>
            <button className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-400 cursor-not-allowed" disabled>
              <Ticket className="h-4 w-4" />
              <span>Vouchers</span>
              <span className="ml-auto text-[10px]">Coming soon</span>
            </button>
            <button className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-400 cursor-not-allowed" disabled>
              <Share2 className="h-4 w-4" />
              <span>Refer & Earn</span>
              <span className="ml-auto text-[10px]">Coming soon</span>
            </button>
          </nav>
        </CardContent>
      </Card>

      {/* Profile completion indicator */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Profile</h3>
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
            </div>
          ) : (
            <div>
              {(!customer?.firstName || !customer?.lastName) ? (
                <div>
                  <p className="text-sm text-gray-700 mb-2">Complete your profile to personalize your experience.</p>
                  <div className="h-2 w-full bg-gray-100 rounded">
                    <div className="h-2 bg-primary rounded" style={{ width: '60%' }} />
                  </div>
                  <Button className="mt-3 w-full" variant="secondary" disabled>
                    Update profile
                    <span className="ml-2 text-xs">(Coming Soon)</span>
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Your profile looks good.</p>
              )}
            </div>
          )}
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

