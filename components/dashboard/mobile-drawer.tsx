'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeLogout } from '@/lib/logout-utils';
import { toast } from 'sonner';
import { 
  X, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Home,
  Mail,
  Calendar,
  Star,
  TrendingUp,
  CreditCard,
  RefreshCw,
  FileText,
  ChevronRight
} from 'lucide-react';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  customer: any;
  onEditProfile?: () => void;
}

export function MobileDrawer({ isOpen, onClose, user, customer, onEditProfile }: MobileDrawerProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await safeLogout(supabase, router, {
      onSuccess: () => {
        toast.success('Successfully signed out');
        onClose(); // Close drawer after logout
      },
      onError: (error) => {
        toast.warning('Logout completed with some issues, but you have been signed out.');
        onClose();
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-white z-50 lg:hidden shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile Section */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <User className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {customer?.firstName && customer?.lastName 
                      ? `${customer.firstName} ${customer.lastName}`
                      : user?.user_metadata?.first_name || 'User'}
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-1">Member Since</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(user?.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Navigation Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Navigation</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/dashboard" onClick={onClose}>
                        <Home className="mr-2 h-4 w-4" />
                        Overview
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/dashboard/bookings" onClick={onClose}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Bookings
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/dashboard/payments" onClick={onClose}>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Payments
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/dashboard/plans" onClick={onClose}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Cleaning Plans
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/dashboard/reviews" onClick={onClose}>
                        <Star className="mr-2 h-4 w-4" />
                        Reviews
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/dashboard/tickets" onClick={onClose}>
                        <FileText className="mr-2 h-4 w-4" />
                        Support Tickets
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/dashboard/analytics" onClick={onClose}>
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Analytics & Insights
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Account Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Account</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        onEditProfile?.();
                        onClose();
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Update profile
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/dashboard/settings" onClick={onClose}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/dashboard/profile" onClick={onClose}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                        <ChevronRight className="ml-auto h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Help Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Help & Support</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/faq">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        FAQ
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full justify-start" asChild>
                      <Link href="/contact">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Contact Support
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                      <Link href="/booking/service/select">
                        Book a Service
                      </Link>
                    </Button>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/booking/quote">
                        <Calendar className="mr-2 h-4 w-4" />
                        Get a quick quote
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
