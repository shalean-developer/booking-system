'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { MoreHorizontal, Bell, Calendar, Clock, MapPin, Mail, Phone, DollarSign, User, X, LogOut, Settings, Shield, Search, ChevronDown, Sparkles } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase-client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFilterPeriod, type FilterPeriod } from '@/context/FilterPeriodContext';

interface NotificationItem {
  id: string;
  type: 'booking' | 'quote';
  email: string;
  amount: number;
  bookingDate?: string;
  quoteDate?: string;
  createdAt: string;
}

interface BookingDetail {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_type: string;
  booking_date: string;
  booking_time: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  total_amount: number;
  status: string;
}

interface QuoteDetail {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  service_type: string;
  bedrooms: number;
  bathrooms: number;
  estimated_price: number;
  status: string;
  created_at: string;
}

export function AdminNavbarV3() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [viewedNotifications, setViewedNotifications] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [viewingBooking, setViewingBooking] = useState<BookingDetail | null>(null);
  const [viewingQuote, setViewingQuote] = useState<QuoteDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('shalean.co.za');
  const { selectedPeriod, setSelectedPeriod } = useFilterPeriod();

  useEffect(() => {
    setMounted(true);
    
    // Get user profile
    const getProfile = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser(authUser);
      }
    };

    getProfile();

    // Load viewed notifications from localStorage on mount (client-side only)
    const stored = localStorage.getItem('admin_viewed_notifications');
    if (stored) {
      try {
        const viewedIds = JSON.parse(stored);
        setViewedNotifications(new Set(viewedIds));
      } catch (e) {
        console.error('Error loading viewed notifications:', e);
      }
    }
  }, []);

  const tabGroups = [
    {
      name: 'Dashboards',
      tabs: [
        { id: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
        { id: 'financial-dashboard', label: 'Financial Dashboard', path: '/admin/dashboard-v2' },
      ],
    },
    {
      name: 'Bookings & Customers',
      tabs: [
        { id: 'bookings', label: 'Bookings', path: '/admin/bookings' },
        { id: 'customers', label: 'Customers', path: '/admin/customers' },
        { id: 'recurring', label: 'Recurring', path: '/admin/recurring-customers' },
      ],
    },
    {
      name: 'Team',
      tabs: [
        { id: 'cleaners', label: 'Cleaners', path: '/admin/cleaners' },
        { id: 'applications', label: 'Applications', path: '/admin/applications' },
      ],
    },
    {
      name: 'Business',
      tabs: [
        { id: 'services', label: 'Services', path: '/admin/services' },
        { id: 'payments', label: 'Payments', path: '/admin/payments' },
        { id: 'blog', label: 'Blog', path: '/admin/blog' },
        { id: 'settings', label: 'Settings', path: '/admin/settings' },
      ],
    },
  ];

  // Determine active tab based on current pathname
  const getActiveTab = () => {
    if (pathname?.includes('/dashboard-v2')) return 'financial-dashboard';
    if (pathname?.includes('/dashboard')) return 'dashboard';
    if (pathname?.includes('/bookings')) return 'bookings';
    if (pathname?.includes('/cleaners')) return 'cleaners';
    if (pathname?.includes('/applications')) return 'applications';
    if (pathname?.includes('/recurring-customers')) return 'recurring';
    if (pathname?.includes('/customers')) return 'customers';
    if (pathname?.includes('/services')) return 'services';
    if (pathname?.includes('/payments')) return 'payments';
    if (pathname?.includes('/settings')) return 'settings';
    if (pathname?.includes('/admin/blog')) return 'blog';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Fetch recent bookings (all statuses, sorted by created_at)
      const bookingsRes = await fetch('/api/admin/bookings?limit=15', {
        credentials: 'include',
      });
      
      // Fetch recent quotes (all statuses, sorted by created_at)
      const quotesRes = await fetch('/api/admin/quotes?limit=15', {
        credentials: 'include',
      });

      const notificationsList: NotificationItem[] = [];

      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        if (bookingsData.ok && bookingsData.bookings) {
          bookingsData.bookings.forEach((booking: any) => {
            notificationsList.push({
              id: booking.id,
              type: 'booking',
              email: booking.customer_email || 'Unknown',
              amount: booking.total_amount || 0,
              bookingDate: booking.booking_date,
              createdAt: booking.created_at,
            });
          });
        }
      }

      if (quotesRes.ok) {
        const quotesData = await quotesRes.json();
        if (quotesData.ok && quotesData.quotes) {
          quotesData.quotes.forEach((quote: any) => {
            notificationsList.push({
              id: quote.id,
              type: 'quote',
              email: quote.email || 'Unknown',
              amount: quote.estimated_price || 0,
              createdAt: quote.created_at,
            });
          });
        }
      }

      // Sort by created_at (most recent first)
      notificationsList.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Filter out already viewed notifications using current state
      setNotifications(prev => {
        const currentViewed = new Set(viewedNotifications);
        const filtered = notificationsList.filter(n => !currentViewed.has(n.id));
        return filtered.slice(0, 12);
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter out viewed notifications
  const unviewedNotifications = notifications.filter(n => !viewedNotifications.has(n.id));
  const totalNotifications = unviewedNotifications.length;

  useEffect(() => {
    // Fetch immediately
    fetchNotifications();
    
    // Refresh every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const formatAmount = (amount: number) => {
    // Convert cents to rands (consistent with API - always divide by 100)
    const randAmount = amount / 100;
    return `R${randAmount.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatNotificationDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d');
    } catch {
      return '';
    }
  };

  const fetchBookingDetail = async (bookingId: string) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/admin/bookings?id=${bookingId}`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.bookings && data.bookings.length > 0) {
          setViewingBooking(data.bookings[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching booking detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const fetchQuoteDetail = async (quoteId: string) => {
    try {
      setLoadingDetail(true);
      const res = await fetch(`/api/admin/quotes?id=${quoteId}`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.ok && data.quotes && data.quotes.length > 0) {
          setViewingQuote(data.quotes[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching quote detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    // Mark notification as viewed
    const newViewed = new Set(viewedNotifications);
    newViewed.add(notification.id);
    setViewedNotifications(newViewed);
    
    // Save to localStorage
    try {
      localStorage.setItem('admin_viewed_notifications', JSON.stringify(Array.from(newViewed)));
    } catch (e) {
      console.error('Error saving viewed notifications:', e);
    }
    
    // Remove from notifications list immediately
    setNotifications(prev => prev.filter(n => n.id !== notification.id));
    
    // Fetch and show detail popup
    if (notification.type === 'booking') {
      await fetchBookingDetail(notification.id);
    } else {
      await fetchQuoteDetail(notification.id);
    }
  };

  // Determine which group is active based on current pathname
  const getActiveGroup = () => {
    const activeTabId = getActiveTab();
    for (const group of tabGroups) {
      if (group.tabs.some(tab => tab.id === activeTabId)) {
        return group.name;
      }
    }
    return null;
  };

  const activeGroup = getActiveGroup();

  return (
    <div className="w-full">
      {/* Top Header Section - Dark Charcoal Gray */}
      <div className="bg-slate-800 border-b border-slate-700">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left Side - Branding and Domain */}
            <div className="flex items-center gap-4">
              {/* Shalean Logo */}
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-semibold text-base">Shalean</span>
              </div>
              
              {/* Vertical Separator */}
              <div className="h-6 w-px bg-slate-600"></div>
              
              {/* Domain Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 text-white hover:text-slate-200 transition-colors">
                    <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">S</span>
                    </div>
                    <span className="text-sm">{selectedDomain}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setSelectedDomain('shalean.co.za')}>
                    shalean.co.za
                  </DropdownMenuItem>
                  {/* Add more domains if needed */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Right Side - User Utilities */}
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative p-1.5 hover:bg-slate-700 rounded transition-colors">
                    <Bell className="h-5 w-5 text-slate-300" />
                    {mounted && !isLoading && totalNotifications > 0 && (
                      <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-white text-[10px] border-0 rounded-full min-w-[16px]">
                        {totalNotifications > 9 ? '9+' : totalNotifications}
                      </Badge>
                    )}
                  </button>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-2 border-b border-gray-200">
                  <span className="text-xs font-semibold text-gray-900">Notifications</span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="h-3 w-3 text-gray-500" />
                  </button>
                </div>
                
                {/* Notification List */}
                <div className="max-h-96 overflow-y-auto">
                  {isLoading ? (
                    <div className="px-3 py-6 text-center text-xs text-gray-500">
                      Loading notifications...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center text-xs text-gray-500">
                      No new notifications
                    </div>
                  ) : (
                    unviewedNotifications.map((notification, index) => (
                      <div key={notification.id}>
                        {index > 0 && <div className="border-t border-gray-100" />}
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full px-3 py-2 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-start gap-2">
                            {/* Icon */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold text-xs ${
                              notification.type === 'booking' 
                                ? 'bg-blue-500' 
                                : 'bg-orange-500'
                            }`}>
                              {notification.type === 'booking' ? 'B' : 'Q'}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-900 leading-relaxed">
                                <span className="font-medium">{notification.email}</span>
                                {' '}made a{' '}
                                <span className="font-medium">
                                  {notification.type === 'booking' ? 'New Booking' : 'Quote'}
                                </span>
                                {' '}of {formatAmount(notification.amount)}
                                {notification.bookingDate && (
                                  <> by {formatDate(notification.bookingDate)}</>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">
                                {formatNotificationDate(notification.createdAt)}
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search Icon */}
            <button className="p-1.5 hover:bg-slate-700 rounded transition-colors">
              <Search className="h-5 w-5 text-slate-300" />
            </button>

            {/* User Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                    <span className="text-primary font-semibold text-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="font-semibold">{user?.email || 'User'}</span>
                  <span className="text-xs text-gray-500 font-normal">Admin</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => router.push('/admin/dashboard')}
                  className="cursor-pointer"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => router.push('/admin/settings')}
                  className="cursor-pointer"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Bottom Header Section - Lighter Dark Gray with Navigation */}
      <div className="bg-slate-700 border-b border-slate-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-6 h-12">
            {tabGroups.map((group) => {
              const isGroupActive = activeGroup === group.name;
              const hasActiveTab = group.tabs.some(tab => tab.id === activeTab);
              
              return (
                <DropdownMenu key={group.name}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        'flex items-center gap-1 text-sm font-medium transition-colors px-2 py-1 rounded',
                        isGroupActive || hasActiveTab
                          ? 'text-white'
                          : 'text-slate-300 hover:text-white'
                      )}
                    >
                      {group.name}
                      <ChevronDown className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="start" 
                    className="w-56 z-[100]"
                    sideOffset={4}
                  >
                    {group.tabs.map((tab) => (
                      <DropdownMenuItem
                        key={tab.id}
                        onClick={() => handleNavigate(tab.path)}
                        className={cn(
                          'cursor-pointer',
                          activeTab === tab.id && 'bg-slate-100 font-medium'
                        )}
                      >
                        {tab.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
            {/* Ellipsis Menu - Filter Period */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 hover:bg-slate-600 rounded ml-auto">
                  <MoreHorizontal className="h-4 w-4 text-slate-300" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-[100]">
                <DropdownMenuLabel className="text-xs text-gray-500 font-normal px-2 py-1.5">
                  Filter Period
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {[
                  'Today',
                  '7 days',
                  'Last 10 days',
                  '30 days',
                  '90 days',
                  'Month'
                ].map((period) => (
                  <DropdownMenuItem
                    key={period}
                    onClick={() => setSelectedPeriod(period as FilterPeriod)}
                    className={cn(
                      'cursor-pointer px-2 py-1.5 text-sm',
                      selectedPeriod === period && 'bg-slate-100 font-medium'
                    )}
                  >
                    {period}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>

      {/* Booking Detail Popup */}
      <Dialog open={!!viewingBooking} onOpenChange={(open) => {
        if (!open) {
          setViewingBooking(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Booking Details</span>
              <button
                onClick={() => setViewingBooking(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : viewingBooking ? (
            <div className="space-y-4 py-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge variant={viewingBooking.status === 'pending' ? 'default' : 'secondary'}>
                  {viewingBooking.status}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="pl-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Name:</span>
                    <span>{viewingBooking.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4" />
                    <span>{viewingBooking.customer_email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4" />
                    <span>{viewingBooking.customer_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Booking Details
                </h3>
                <div className="pl-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Service:</span>
                    <span>{viewingBooking.service_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(viewingBooking.booking_date), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-4 w-4" />
                    <span>{viewingBooking.booking_time}</span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      <div>{viewingBooking.address_line1}</div>
                      {viewingBooking.address_suburb && (
                        <div>{viewingBooking.address_suburb}</div>
                      )}
                      {viewingBooking.address_city && (
                        <div>{viewingBooking.address_city}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </h3>
                <div className="pl-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-semibold text-lg">
                      {formatAmount(viewingBooking.total_amount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t">
                <button
                  onClick={() => {
                    setViewingBooking(null);
                    router.push(`/admin/bookings?id=${viewingBooking.id}`);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  View Full Details
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Quote Detail Popup */}
      <Dialog open={!!viewingQuote} onOpenChange={(open) => {
        if (!open) {
          setViewingQuote(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Quote Details</span>
              <button
                onClick={() => setViewingQuote(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogTitle>
          </DialogHeader>
          
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : viewingQuote ? (
            <div className="space-y-4 py-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <Badge variant={viewingQuote.status === 'pending' ? 'default' : 'secondary'}>
                  {viewingQuote.status}
                </Badge>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="pl-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Name:</span>
                    <span>{viewingQuote.first_name} {viewingQuote.last_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4" />
                    <span>{viewingQuote.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4" />
                    <span>{viewingQuote.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Quote Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Quote Details
                </h3>
                <div className="pl-6 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Service:</span>
                    <span>{viewingQuote.service_type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Bedrooms:</span>
                    <span>{viewingQuote.bedrooms}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Bathrooms:</span>
                    <span>{viewingQuote.bathrooms}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4" />
                    <span>Created: {format(new Date(viewingQuote.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Estimated Price
                </h3>
                <div className="pl-6 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Total:</span>
                    <span className="font-semibold text-lg">
                      {formatAmount(viewingQuote.estimated_price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t">
                <button
                  onClick={() => {
                    setViewingQuote(null);
                    router.push(`/admin/quotes?id=${viewingQuote.id}`);
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  View Full Details
                </button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}

