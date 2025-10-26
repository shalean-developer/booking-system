'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DayAvailabilityDisplay } from '@/components/admin/day-availability-display';
import { CleanerReviews } from '@/components/cleaner/cleaner-reviews';
import {
  Calendar,
  LogOut,
  User,
  MapPin,
  Loader2,
} from 'lucide-react';

interface CleanerSession {
  id: string;
  name: string;
  phone: string;
  photo_url: string | null;
  rating: number;
  areas: string[];
  is_available: boolean;
  available_monday?: boolean;
  available_tuesday?: boolean;
  available_wednesday?: boolean;
  available_thursday?: boolean;
  available_friday?: boolean;
  available_saturday?: boolean;
  available_sunday?: boolean;
}

interface MoreClientProps {
  cleaner: CleanerSession;
}

export function MoreClient({ cleaner }: MoreClientProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/cleaner/auth/logout', { method: 'POST' });
      router.push('/cleaner/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  const initials = cleaner.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            More
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage your profile, view reviews, and settings
          </p>
        </div>

        {/* Profile Section */}
        <Card className="mb-6 border-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              {cleaner.photo_url ? (
                <img
                  src={cleaner.photo_url}
                  alt={cleaner.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-900">{cleaner.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-600">Rating: {cleaner.rating.toFixed(1)} ⭐</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{cleaner.phone}</p>
              </div>
            </div>

            {/* Service Areas */}
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Service Areas
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                {cleaner.areas.map((area) => (
                  <Badge key={area} variant="outline" className="text-xs">
                    {area}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedule Section */}
        <Card className="mb-6 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Schedule
              </h3>
              <Badge variant="outline" className="text-xs">
                {Object.entries(cleaner).filter(([key, val]) => 
                  key.startsWith('available_') && val === true
                ).length} days/week
              </Badge>
            </div>
            <DayAvailabilityDisplay 
              schedule={cleaner} 
              compact={false}
            />
            <p className="text-sm text-gray-500 mt-3">
              Your schedule is set by your manager. Contact admin to request changes.
            </p>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <div className="mb-6">
          <Card className="border-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
              <CleanerReviews />
            </CardContent>
          </Card>
        </div>

        {/* Logout Section */}
        <Card className="border-2 border-red-100">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Account</h3>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Mobile Bottom Navigation Spacer */}
      <div className="h-20 sm:h-0" />
    </div>
  );
}

