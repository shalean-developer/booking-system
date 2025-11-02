'use client';

import { ReactNode } from 'react';
import { DashboardSidebar } from './dashboard-sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-2">
            <DashboardSidebar />
          </div>

          {/* Main Content */}
          <main className="lg:col-span-10 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

