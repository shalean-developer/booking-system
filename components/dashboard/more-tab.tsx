'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, Settings, HelpCircle, LogOut, Home } from 'lucide-react';

export function MoreTab() {
  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Profile & Settings</h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" disabled>
              <User className="mr-2 h-4 w-4" />
              Edit Profile
              <span className="ml-auto text-xs text-gray-500">(Coming Soon)</span>
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled>
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
              <span className="ml-auto text-xs text-gray-500">(Coming Soon)</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Help & Support</h2>
          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/faq">
                <HelpCircle className="mr-2 h-4 w-4" />
                FAQ
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/contact">
                <HelpCircle className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button className="w-full bg-primary hover:bg-primary/90" asChild>
              <Link href="/booking/service/select">
                Book a Service
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
