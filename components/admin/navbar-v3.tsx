'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { MoreHorizontal, Bell } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase-client';

export function AdminNavbarV3() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user profile
    const getProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser(authUser);
      }
    };

    getProfile();
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
    { id: 'bookings', label: 'Bookings', path: '/admin/bookings' },
    { id: 'customers', label: 'Customers', path: '/admin/customers' },
    { id: 'quotes', label: 'Quotes', path: '/admin/quotes' },
    { id: 'schedule', label: 'Schedule', path: '/admin/schedule' },
    { id: 'cleaners', label: 'Cleaners', path: '/admin/cleaners' },
    { id: 'payments', label: 'Payments', path: '/admin/payments' },
  ];

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname?.includes('/dashboard')) return 'dashboard';
    if (pathname?.includes('/bookings')) return 'bookings';
    if (pathname?.includes('/customers')) return 'customers';
    if (pathname?.includes('/quotes')) return 'quotes';
    if (pathname?.includes('/schedule')) return 'schedule';
    if (pathname?.includes('/cleaners')) return 'cleaners';
    if (pathname?.includes('/payments')) return 'payments';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Icon */}
          <div className="flex items-center">
            <div className="h-8 w-8 rounded bg-gray-300"></div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-8 flex-1 justify-center">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleNavigate(tab.path)}
                className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-400 border-transparent hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
            {/* Ellipsis Menu */}
            <button className="p-1 hover:bg-gray-100 rounded">
              <MoreHorizontal className="h-5 w-5 text-gray-600" />
            </button>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Notification Badge */}
            <div className="relative">
              <button className="p-1 hover:bg-gray-100 rounded">
                <Bell className="h-5 w-5 text-gray-600" />
              </button>
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-rose-500 text-white text-xs border-0 rounded">
                12
              </Badge>
            </div>

            {/* User Avatar */}
            <Avatar className="h-8 w-8 rounded-md">
              <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
              <AvatarFallback className="rounded-md bg-gray-200 text-gray-600">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  );
}

