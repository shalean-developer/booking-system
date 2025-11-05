'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Bell, Calendar, FileText } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminTopNavProps {
  onNavigate?: (tab: string) => void;
  activeTab?: string;
}

export function AdminTopNav({ onNavigate, activeTab = 'dashboard' }: AdminTopNavProps) {
  const router = useRouter();
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'customers', label: 'Customers' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'cleaners', label: 'Cleaners' },
    { id: 'payments', label: 'Payments' },
  ];

  const fetchNotificationCounts = async () => {
    try {
      setIsLoading(true);
      
      // Fetch pending bookings count
      const bookingsRes = await fetch('/api/admin/bookings?status=pending&limit=1', {
        credentials: 'include',
      });
      
      // Fetch pending quotes count
      const quotesRes = await fetch('/api/admin/quotes?status=pending&limit=1', {
        credentials: 'include',
      });

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        if (bookingsData.ok && bookingsData.pagination) {
          setPendingBookingsCount(bookingsData.pagination.total || 0);
        }
      }

      if (quotesRes.ok) {
        const quotesData = await quotesRes.json();
        if (quotesData.ok && quotesData.pagination) {
          setPendingQuotesCount(quotesData.pagination.total || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching notification counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchNotificationCounts();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotificationCounts, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const totalNotifications = pendingBookingsCount + pendingQuotesCount;

  const handleNavigateToBookings = () => {
    if (onNavigate) {
      onNavigate('bookings');
      // Also update URL with status filter
      router.push('/admin/bookings?status=pending');
    } else {
      router.push('/admin/bookings?status=pending');
    }
  };

  const handleNavigateToQuotes = () => {
    if (onNavigate) {
      onNavigate('quotes');
      // Also update URL with status filter
      router.push('/admin/quotes?status=pending');
    } else {
      router.push('/admin/quotes?status=pending');
    }
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
                onClick={() => onNavigate?.(tab.id)}
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
            {/* Notification Bell with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-1 hover:bg-gray-100 rounded transition-colors">
                  <Bell className="h-5 w-5 text-gray-600" />
                  {totalNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-rose-500 text-white text-xs border-0 rounded-full min-w-[20px]">
                      {totalNotifications > 99 ? '99+' : totalNotifications}
                    </Badge>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>New Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={handleNavigateToBookings}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>New Bookings</span>
                  </div>
                  {pendingBookingsCount > 0 && (
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                      {pendingBookingsCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={handleNavigateToQuotes}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span>New Quotes</span>
                  </div>
                  {pendingQuotesCount > 0 && (
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                      {pendingQuotesCount}
                    </Badge>
                  )}
                </DropdownMenuItem>
                
                {totalNotifications === 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-4 text-center text-sm text-gray-500">
                      No new notifications
                    </div>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Avatar */}
            <Avatar className="h-8 w-8 rounded-md">
              <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
              <AvatarFallback className="rounded-md bg-gray-200 text-gray-600">
                U
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  );
}

