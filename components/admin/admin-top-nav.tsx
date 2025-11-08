'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, FileText, Rocket, Search, Menu, ChevronDown } from 'lucide-react';
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
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'customers', label: 'Customers' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'blog', label: 'Blog' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'cleaners', label: 'Cleaners' },
    { id: 'payments', label: 'Payments' },
  ];

  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [pendingQuotesCount, setPendingQuotesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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
    <div className="w-full border-b border-slate-800 bg-slate-900 text-white shadow-sm sm:border-gray-200 sm:bg-white sm:text-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile Navigation */}
        <div className="flex h-14 items-center justify-between sm:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm transition-colors hover:bg-emerald-400"
              aria-label="Go to dashboard"
            >
              <Rocket className="h-5 w-5" />
            </button>
            <span className="h-6 w-px bg-white/20" aria-hidden="true" />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#5f7cff] text-white shadow-sm transition-colors hover:bg-[#718aff]"
              aria-label="Workspace menu"
            >
              <span className="text-base font-semibold">S</span>
            </button>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10"
              aria-label="Switch workspace"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10">
                  <Bell className="h-5 w-5" />
                  {totalNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-0 bg-rose-500 p-0 text-xs text-white">
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
                  className="flex cursor-pointer items-center justify-between"
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
                  className="flex cursor-pointer items-center justify-between"
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
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10" aria-label="Search">
              <Search className="h-5 w-5" />
            </button>
            <Avatar className="h-9 w-9 border border-white/20 bg-white text-slate-900 shadow-sm">
              <AvatarImage src="/placeholder-avatar.jpg" alt="User" />
              <AvatarFallback className="bg-white text-slate-900">D</AvatarFallback>
            </Avatar>
            <button className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden h-16 items-center justify-between sm:flex">
          {/* Logo Icon */}
          <div className="flex items-center">
            <div className="h-8 w-8 rounded bg-gray-300"></div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-1 items-center justify-center gap-6 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onNavigate?.(tab.id)}
                className={`flex-shrink-0 whitespace-nowrap border-b-2 pb-1 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Notification Bell with Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative rounded p-1 transition-colors hover:bg-gray-100">
                  <Bell className="h-5 w-5 text-gray-600" />
                  {totalNotifications > 0 && (
                    <Badge className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-0 bg-rose-500 p-0 text-xs text-white">
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

