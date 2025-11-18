'use client';

import Link from 'next/link';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-yellow-100 p-6">
            <WifiOff className="h-16 w-16 text-yellow-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">You're Offline</h1>
          <p className="text-gray-600">
            It looks like you're not connected to the internet. Please check your connection and try again.
          </p>
        </div>

        <div className="space-y-3 pt-4">
          <Button
            onClick={() => window.location.reload()}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
            size="lg"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          
          <Link href="/cleaner/dashboard">
            <Button
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="h-5 w-5 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Some features may be available offline. Check your cached bookings in the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

