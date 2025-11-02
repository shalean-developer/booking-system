'use client';

import { Card } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  Briefcase, 
  FileText, 
  DollarSign, 
  Sparkles, 
  MessageSquare, 
  Settings 
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const sidebarItems: SidebarItem[] = [
    { label: 'Dashboard', icon: <Calendar className="h-4 w-4" />, href: '/admin' },
    { label: 'Bookings', icon: <Calendar className="h-4 w-4" />, href: '/admin#bookings' },
    { label: 'Cleaners', icon: <Briefcase className="h-4 w-4" />, href: '/admin#cleaners' },
    { label: 'Customers', icon: <Users className="h-4 w-4" />, href: '/admin#customers' },
    { label: 'Quotes', icon: <FileText className="h-4 w-4" />, href: '/admin#quotes' },
    { label: 'Revenue', icon: <DollarSign className="h-4 w-4" />, href: '/admin#revenue' },
    { label: 'Services', icon: <Sparkles className="h-4 w-4" />, href: '/admin#services' },
    { label: 'Pipeline', icon: <MessageSquare className="h-4 w-4" />, href: '/admin#pipeline' },
    { label: 'Settings', icon: <Settings className="h-4 w-4" />, href: '/admin#settings' },
  ];

  const handleNavigation = (href: string) => {
    if (href.startsWith('/admin#')) {
      const hash = href.split('#')[1];
      window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: hash }));
    } else {
      router.push(href);
    }
  };

  const isActive = (href: string) => {
    if (href === '/admin' && pathname === '/admin') return true;
    if (href.startsWith('/admin#')) return false; // Hash-based navigation
    return pathname === href;
  };

  return (
    <aside className="h-full">
      <div className="sticky top-6 space-y-3">
        {/* Company/Brand Card */}
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">Shalean</div>
              <div className="text-xs text-gray-600">Admin Dashboard</div>
            </div>
          </div>
        </Card>

        {/* Navigation Items */}
        <Card className="p-2">
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const active = isActive(item.href);
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavigation(item.href)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                    ${active 
                      ? 'bg-blue-50 text-blue-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <span className={active ? 'text-blue-600' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </Card>

        {/* Quick Stats - Optional */}
        <Card className="p-4 bg-gray-50">
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
              Quick Stats
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Today</span>
                <span className="font-medium text-gray-900">---</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">This Week</span>
                <span className="font-medium text-gray-900">---</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </aside>
  );
}

