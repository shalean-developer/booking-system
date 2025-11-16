'use client';

import { CleanerMobileBottomNav } from '@/components/cleaner/cleaner-mobile-bottom-nav';
import { Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface CleanerSession {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  rating: number;
  areas: string[];
  is_available: boolean;
}

interface PasswordClientProps {
  cleaner: CleanerSession;
}

export function PasswordClient({ cleaner }: PasswordClientProps) {

  return (
    <div className="min-h-screen bg-white">
      {/* Blue Header */}
      <header className="bg-[#3b82f6] text-white py-4 px-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Link href="/cleaner/dashboard/profile" className="p-1">
            <ArrowLeft className="h-6 w-6" strokeWidth={2} />
          </Link>
          <h1 className="text-lg font-semibold">Password</h1>
          <Lock className="h-6 w-6" strokeWidth={2} />
        </div>
      </header>

      {/* Main Content */}
      <main className="bg-white pb-24">
        <div className="max-w-md mx-auto px-4 py-12">
          {/* Coming Soon Message */}
          <div className="text-center">
            <div className="mb-6 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[#dbeafe] border-2 border-[#3b82f6] flex items-center justify-center">
                <Lock className="h-10 w-10 text-[#3b82f6]" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Coming Soon</h2>
            <p className="text-gray-600 text-base mb-6">
              Password management is under development. You'll be able to change your password here soon.
            </p>
            <Link
              href="/cleaner/dashboard/profile"
              className="inline-block px-6 py-3 bg-[#3b82f6] text-white rounded-md hover:bg-[#2563eb] transition-colors font-medium"
            >
              Back to Profile
            </Link>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <CleanerMobileBottomNav />

      {/* Bottom Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

