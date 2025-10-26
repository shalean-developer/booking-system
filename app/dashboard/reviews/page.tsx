'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { supabase } from '@/lib/supabase-client';
import { safeLogout, safeGetSession } from '@/lib/logout-utils';
import { toast } from 'sonner';
import { 
  User, 
  Loader2,
  Briefcase,
  Home,
  Mail,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';
import { MobileBottomNav } from '@/components/dashboard/mobile-bottom-nav';
import { ReviewsTab } from '@/components/dashboard/reviews-tab';

interface CustomerData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  totalBookings: number;
}

export default function ReviewsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const session = await safeGetSession(supabase);
        
        if (!session || !session.user) {
          console.log('Not authenticated - redirecting to login');
          router.push('/login');
          return;
        }
        
        const authUser = session.user;
        setUser(authUser);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          throw new Error('No active session');
        }

        const response = await fetch('/api/dashboard/bookings', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Failed to fetch customer data');
        }

        setCustomer(data.customer);
        setIsLoading(false);

      } catch (err) {
        console.error('Reviews page error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load reviews');
        setIsLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pb-20 lg:pb-0">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Loading your reviews...</p>
          </div>
        </div>
        <MobileBottomNav activeTab="reviews" onTabChange={() => {}} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pb-20 lg:pb-0">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Reviews</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
        <MobileBottomNav activeTab="reviews" onTabChange={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-white pb-20 lg:pb-0">
      <Header />

      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Mobile Header */}
          <div className="lg:hidden mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Reviews & Ratings</h1>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews & Ratings</h1>
            <p className="text-gray-600">View your reviews and ratings</p>
          </div>

          {/* Reviews Content */}
          <ReviewsTab />
        </div>
      </section>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activeTab="reviews" onTabChange={() => {}} />
    </div>
  );
}
