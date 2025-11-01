'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Download,
  Users,
  FileText,
  Calendar,
  UserCheck,
  Mail,
  Settings,
  TrendingUp,
} from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'default' | 'primary' | 'secondary';
  priority?: 'primary' | 'secondary';
}

interface QuickActionsProps {
  onNavigate?: (tab: string) => void;
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  const primaryActions: QuickAction[] = [
    {
      id: 'create-booking',
      label: 'Create Booking',
      icon: <Plus className="h-5 w-5" />,
      onClick: () => {
        if (onNavigate) {
          onNavigate('bookings');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('admin-create-booking'));
          }, 100);
        } else {
          window.location.hash = 'bookings';
        }
      },
      color: 'primary',
      priority: 'primary',
    },
    {
      id: 'add-cleaner',
      label: 'Add Cleaner',
      icon: <UserCheck className="h-5 w-5" />,
      onClick: () => {
        if (onNavigate) {
          onNavigate('cleaners');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('admin-add-cleaner'));
          }, 100);
        } else {
          window.location.hash = 'cleaners';
        }
      },
      priority: 'primary',
    },
    {
      id: 'review-applications',
      label: 'Review Applications',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => {
        if (onNavigate) {
          onNavigate('applications');
        } else {
          window.location.hash = 'applications';
        }
      },
      priority: 'primary',
    },
    {
      id: 'view-calendar',
      label: 'View Calendar',
      icon: <Calendar className="h-5 w-5" />,
      onClick: () => {
        if (onNavigate) {
          onNavigate('bookings');
        } else {
          window.location.hash = 'bookings';
        }
      },
      priority: 'primary',
    },
    {
      id: 'manage-customers',
      label: 'Manage Customers',
      icon: <Users className="h-5 w-5" />,
      onClick: () => {
        if (onNavigate) {
          onNavigate('customers');
        } else {
          window.location.hash = 'customers';
        }
      },
      priority: 'primary',
    },
    {
      id: 'revenue-report',
      label: 'Revenue Report',
      icon: <TrendingUp className="h-5 w-5" />,
      onClick: () => {
        window.open('/api/admin/stats/report?format=csv', '_blank');
      },
      priority: 'primary',
    },
  ];

  const secondaryActions: QuickAction[] = [
    {
      id: 'export-data',
      label: 'Export Data',
      icon: <Download className="h-5 w-5" />,
      onClick: () => {
        window.dispatchEvent(new CustomEvent('admin-show-export'));
      },
      priority: 'secondary',
    },
    {
      id: 'send-bulk-email',
      label: 'Bulk Email',
      icon: <Mail className="h-5 w-5" />,
      onClick: () => {
        if (onNavigate) {
          onNavigate('customers');
        } else {
          window.location.hash = 'customers';
        }
      },
      priority: 'secondary',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Actions */}
        <div className="pb-4 border-b border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Primary Actions</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
            {primaryActions.map((action) => (
              <Button
                key={action.id}
                variant={action.color === 'primary' ? 'default' : 'outline'}
                className="flex flex-col items-center justify-center h-20 md:h-24 gap-2 btn-refined text-xs md:text-sm border-gray-200"
                onClick={action.onClick}
              >
                <div className={action.color === 'primary' ? 'text-primary-foreground' : ''}>
                  {action.icon}
                </div>
                <span className="text-xs font-medium text-center">{action.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Secondary Actions */}
        {secondaryActions.length > 0 && (
          <div className="pt-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Additional Tools</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
              {secondaryActions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  className="flex flex-col items-center justify-center h-20 md:h-20 gap-2 btn-refined text-xs border-gray-200 opacity-75 hover:opacity-100"
                  onClick={action.onClick}
                >
                  <div className="text-muted-foreground">
                    {action.icon}
                  </div>
                  <span className="text-xs font-medium text-center text-muted-foreground">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
