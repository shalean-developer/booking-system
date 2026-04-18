'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Calendar,
  CalendarCheck,
  DollarSign,
  Settings,
  FileText,
  MessageSquare,
  Briefcase,
  Menu,
  X,
  LayoutDashboard,
  Repeat,
  FileEdit,
  Package,
  Tag,
  Clock,
  BookOpen,
  Server,
  Ticket,
  PieChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Operations',
    items: [
  { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
      { name: 'Schedule', href: '/admin/schedule', icon: Clock },
      { name: 'Scheduling', href: '/admin/scheduling', icon: CalendarCheck },
      { name: 'Recurring Schedules', href: '/admin/recurring-schedules', icon: Repeat },
    ],
  },
  {
    title: 'People',
    items: [
      { name: 'Customers', href: '/admin/customers', icon: Users },
      { name: 'Recurring Customers', href: '/admin/recurring-customers', icon: Repeat },
  { name: 'Cleaners', href: '/admin/cleaners', icon: Users },
    ],
  },
  {
    title: 'Financial',
    items: [
  { name: 'Profit', href: '/admin/profit', icon: PieChart },
  { name: 'Payments', href: '/admin/payments', icon: DollarSign },
      { name: 'Invoices', href: '/admin/invoices', icon: FileText },
      { name: 'Pricing', href: '/admin/pricing', icon: Tag },
      { name: 'Discount Codes', href: '/admin/discount-codes', icon: Ticket },
    ],
  },
  {
    title: 'Content',
    items: [
      { name: 'Blog', href: '/admin/blog', icon: BookOpen },
      { name: 'SEO Dashboard', href: '/admin/seo', icon: FileText },
      { name: 'Cron Logs', href: '/admin/cron-logs', icon: FileText },
      { name: 'CMS', href: '/admin/cms', icon: FileEdit },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageSquare },
    ],
  },
  {
    title: 'Business',
    items: [
  { name: 'Quotes', href: '/admin/quotes', icon: FileText },
  { name: 'Applications', href: '/admin/applications', icon: Briefcase },
      { name: 'Services', href: '/admin/services', icon: Package },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Check Services', href: '/admin/check-services', icon: Server },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 bg-white border-r border-gray-200 fixed left-0 top-16 bottom-0 z-30 transition-transform duration-300 overflow-y-auto',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{ height: 'calc(100vh - 4rem)' }}
      >
        <nav className="p-4 space-y-6">
          {navigationSections.map((section) => (
            <div key={section.title}>
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        active
                    ? 'bg-[#3b82f6] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}
