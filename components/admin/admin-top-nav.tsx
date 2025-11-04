'use client';

import { MoreHorizontal, Bell } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AdminTopNavProps {
  onNavigate?: (tab: string) => void;
  activeTab?: string;
}

export function AdminTopNav({ onNavigate, activeTab = 'dashboard' }: AdminTopNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'customers', label: 'Customers' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'cleaners', label: 'Cleaners' },
    { id: 'payments', label: 'Payments' },
  ];

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
                U
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  );
}

