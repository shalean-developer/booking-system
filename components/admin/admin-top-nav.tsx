'use client';

import { Button } from '@/components/ui/button';
import { LogOut, Download } from 'lucide-react';

interface AdminTopNavProps {
  onNavigate?: (tab: string) => void;
  activeTab?: string;
}

export function AdminTopNav({ onNavigate, activeTab = 'dashboard' }: AdminTopNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'bookings', label: 'Bookings' },
    { id: 'recurring', label: 'Recurring' },
    { id: 'quotes', label: 'Quotes' },
    { id: 'customers', label: 'Customers' },
    { id: 'cleaners', label: 'Cleaners' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'applications', label: 'Applications' },
  ];

  const handleLogout = async () => {
    // Handle logout
    window.location.href = '/login';
  };

  const handleExport = () => {
    // Dispatch custom event to open export dialog
    window.dispatchEvent(new CustomEvent('admin-show-export'));
  };

  return (
    <div className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">S</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">Menu</span>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-6 flex-1 justify-center">
            {tabs.map((tab, index) => (
              <div key={tab.id} className="flex items-center gap-6">
                <button
                  onClick={() => onNavigate?.(tab.id)}
                  className={`text-sm font-medium transition-colors pb-1 border-b-2 ${
                    activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
                {index < tabs.length - 1 && (
                  <div className="h-4 w-px bg-gray-300" />
                )}
              </div>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Log off
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

