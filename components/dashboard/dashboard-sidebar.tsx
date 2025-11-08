'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  User,
  Mail,
  Briefcase,
  Home,
  Calendar,
  Phone,
  MapPin,
  Sparkles,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';

interface DashboardSidebarProps {
  user: any;
  customer: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    addressLine1?: string | null;
    addressSuburb?: string | null;
    addressCity?: string | null;
    totalBookings: number;
  } | null;
  isLoading?: boolean;
  onEditProfile?: () => void;
}

const primaryNav = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/dashboard/bookings', label: 'Bookings', icon: Calendar },
];

const upcomingNav = [
  { label: 'Profile', icon: ShieldCheck },
  { label: 'Preferred cleaners', icon: User },
  { label: 'Saved locations', icon: MapPin },
  { label: 'Support chat', icon: MessageCircle },
];

export function DashboardSidebar({ user, customer, isLoading, onEditProfile }: DashboardSidebarProps) {
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
    : '';

  const hasProfileDetails = Boolean(customer?.phone && customer?.addressLine1 && customer?.addressCity);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="hidden lg:block space-y-6"
    >
      <Card className="border border-primary/10 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <User className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">
              {isLoading ? (
                <span className="inline-block h-6 w-40 bg-gray-200 rounded animate-pulse" />
              ) : customer?.firstName || customer?.lastName ? (
                [customer?.firstName, customer?.lastName].filter(Boolean).join(' ')
              ) : (
                user?.user_metadata?.first_name || user?.email || 'Your account'
              )}
            </h3>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              {isLoading ? (
                <span className="inline-block h-4 w-40 bg-gray-200 rounded animate-pulse" />
              ) : (
                <span className="truncate max-w-[180px]">{user?.email}</span>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Member since {memberSince || '—'}</span>
            </div>
            {customer?.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{customer.phone}</span>
              </div>
            )}
            {customer?.addressSuburb && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-sm text-gray-600 leading-tight">
                  {customer.addressSuburb}
                  {customer.addressCity ? `, ${customer.addressCity}` : ''}
                </span>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={onEditProfile}
          >
            Update profile
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
          <nav className="space-y-1 text-sm">
            {primaryNav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-gray-900 text-sm">In the works</span>
            </div>
            <p className="text-xs text-gray-600">
              We’re rolling out more tools to manage your home in one place.
            </p>
            <ul className="space-y-1.5">
              {upcomingNav.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-gray-600">
                  <item.icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-100 shadow-sm">
        <CardContent className="p-6 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Quick actions</h3>
          {!hasProfileDetails && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
              <p className="font-medium">Finish your profile</p>
              <p>Add your phone and address so your cleaner knows where to go.</p>
              <Button size="sm" className="w-full" onClick={onEditProfile}>
                Add details
              </Button>
            </div>
          )}
          <Button className="w-full" asChild>
            <Link href="/booking/service/select">
              <Briefcase className="mr-2 h-4 w-4" />
              Book a service
            </Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/contact">
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with support
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}