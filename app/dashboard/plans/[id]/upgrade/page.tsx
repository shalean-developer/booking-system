'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { NewHeader } from '@/components/dashboard/new-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { devLog } from '@/lib/dev-logger';

export default function UpgradePlanPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push(`/login?redirect=/dashboard/plans/${id}/upgrade`);
          return;
        }

        setUser(session.user);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired');
          setIsLoading(false);
          return;
        }

        // Fetch customer data
        const customerResponse = await fetch('/api/dashboard/bookings?limit=1', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });
        const customerData = await customerResponse.json();
        if (customerResponse.ok && customerData.ok && customerData.customer) {
          setCustomer(customerData.customer);
        }
      } catch (err) {
        devLog.error('Error:', err);
        setError('Failed to load page');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white pb-32 lg:pb-0">
      <NewHeader user={user} customer={customer} />
      
      <main className="py-6 sm:py-8">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/plans')} className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Back to Plans
            </Button>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Upgrade Plan</h1>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Upgrade Plan</h2>
              <p className="text-gray-600 mb-6">
                To upgrade your cleaning plan (add more bedrooms, bathrooms, or extras), please create a new plan with your preferred options. You can then pause or cancel your current plan.
              </p>
              <div className="space-y-3">
                <Button asChild className="w-full bg-gradient-to-r from-teal-500 to-green-500">
                  <Link href="/booking/service/select?recurring=true">Create New Plan</Link>
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/plans')}>
                  Back to Plans
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/contact">Contact Support</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
