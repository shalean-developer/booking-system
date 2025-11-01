'use client';

// Banking-style admin quick grid
import {
  Plus,
  Calendar,
  Users,
  UserCheck,
  Star,
  FileText,
  Repeat,
  MessageSquare,
  UserPlus,
  DollarSign,
  PenTool,
  BarChart3,
} from 'lucide-react';

interface QuickGridProps {
  onNavigate?: (tab: string) => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  tab?: string;
  action?: string;
  url?: string;
}

export function AdminQuickGrid({ onNavigate }: QuickGridProps) {
  const actions: QuickAction[] = [
    {
      id: 'create-booking',
      label: 'Create Booking',
      icon: <Plus className="h-6 w-6" />,
      tab: 'bookings',
      action: 'admin-create-booking',
    },
    {
      id: 'my-bookings',
      label: 'My Bookings',
      icon: <Calendar className="h-6 w-6" />,
      tab: 'bookings',
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: <Users className="h-6 w-6" />,
      tab: 'customers',
    },
    {
      id: 'cleaners',
      label: 'Cleaners',
      icon: <UserCheck className="h-6 w-6" />,
      tab: 'cleaners',
    },
    {
      id: 'reviews',
      label: 'Reviews',
      icon: <Star className="h-6 w-6" />,
      tab: 'reviews',
    },
    {
      id: 'applications',
      label: 'Applications',
      icon: <FileText className="h-6 w-6" />,
      tab: 'applications',
    },
    {
      id: 'recurring',
      label: 'Recurring',
      icon: <Repeat className="h-6 w-6" />,
      tab: 'recurring',
    },
    {
      id: 'quotes',
      label: 'Quotes',
      icon: <MessageSquare className="h-6 w-6" />,
      tab: 'quotes',
    },
    {
      id: 'users',
      label: 'Users',
      icon: <UserPlus className="h-6 w-6" />,
      tab: 'users',
    },
    {
      id: 'pricing',
      label: 'Pricing',
      icon: <DollarSign className="h-6 w-6" />,
      tab: 'pricing',
    },
    {
      id: 'blog',
      label: 'Blog',
      icon: <PenTool className="h-6 w-6" />,
      tab: 'blog',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: <BarChart3 className="h-6 w-6" />,
      url: '/api/admin/stats/report?format=csv',
    },
  ];

  const handleClick = (action: QuickAction) => {
    if (action.url) {
      window.open(action.url, '_blank');
      return;
    }

    if (action.tab && onNavigate) {
      onNavigate(action.tab);
      
      if (action.action) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent(action.action!));
        }, 100);
      }
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleClick(action)}
          className="flex flex-col items-center justify-center p-6 bg-white border border-gray-200 rounded-lg hover:border-primary hover:bg-gray-50 transition-all duration-200 group"
        >
          <div className="text-gray-600 group-hover:text-primary transition-colors mb-3">
            {action.icon}
          </div>
          <span className="text-sm font-medium text-gray-900 text-center">
            {action.label}
          </span>
        </button>
      ))}
    </div>
  );
}

