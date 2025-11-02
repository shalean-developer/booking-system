'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Users,
  UserCheck,
  Briefcase,
  CreditCard,
  Settings,
  Menu,
  X,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/admin/dashboard', 
    icon: LayoutDashboard,
    label: 'Operations'
  },
  { 
    name: 'Financial Dashboard', 
    href: '/admin/dashboard-v2', 
    icon: TrendingUp,
    label: 'Financial'
  },
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
  { name: 'Cleaners', href: '/admin/cleaners', icon: UserCheck },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Services', href: '/admin/services', icon: Briefcase },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebarV3() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Collapsed Sidebar - Always visible on mobile, toggleable on desktop */}
      <div className="fixed left-0 top-0 h-full w-16 bg-slate-800 flex flex-col items-center py-6 z-40 lg:fixed lg:w-16">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-slate-700 rounded-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
        
        {/* Icons when collapsed */}
        {!isOpen && (
          <div className="mt-8 flex flex-col gap-4 w-full px-2">
            {/* Dashboard icons */}
            {navigation.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === '/admin/dashboard' && pathname === '/admin');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  )}
                  title={item.label ? `${item.name} (${item.label})` : item.name}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
            {/* Divider */}
            <div className="my-2 border-t border-slate-700"></div>
            {/* Other navigation icons */}
            {navigation.slice(2).map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-center p-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  )}
                  title={item.name}
                >
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Expanded Sidebar - Slides in from left */}
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 z-40 lg:fixed lg:left-16 lg:shadow-xl"
          >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">S</span>
                  </div>
                  <span className="font-semibold text-slate-900">Shalean Admin</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-600 hover:bg-gray-100"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Navigation Links */}
              <nav className="p-4 space-y-2">
                {/* Dashboard Section with Labels */}
                <div className="mb-4">
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dashboards
                  </div>
                  <div className="space-y-1">
                    {navigation.slice(0, 2).map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href || (item.href === '/admin/dashboard' && pathname === '/admin');
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors relative',
                            isActive && 'bg-slate-100 text-slate-900 font-medium'
                          )}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-slate-900 rounded-r-full" />
                          )}
                          <div className={cn('flex items-center gap-3', isActive && 'ml-1')}>
                            <Icon className="h-5 w-5" />
                            <div className="flex flex-col">
                              <span className="text-sm">{item.name}</span>
                              {item.label && (
                                <span className="text-xs text-slate-500">{item.label}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Main Navigation */}
                <div>
                  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Management
                  </div>
                  <div className="space-y-1">
                    {navigation.slice(2).map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors relative',
                            isActive && 'bg-slate-100 text-slate-900 font-medium'
                          )}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-slate-900 rounded-r-full" />
                          )}
                          <div className={cn('flex items-center gap-3', isActive && 'ml-1')}>
                            <Icon className="h-5 w-5" />
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </nav>
            </motion.div>
          </>
        )}
    </>
  );
}

