'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeGetSession } from '@/lib/logout-utils';
import { NewHeader } from '@/components/dashboard/new-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, ArrowLeft, MapPin, Clock, Plus } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { devLog } from '@/lib/dev-logger';

interface RecurringSchedule {
  id: string;
  service_type: string;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  preferred_time: string;
  address_line1: string;
  address_suburb: string;
  address_city: string;
  start_date: string;
  end_date?: string | null;
  is_active: boolean;
}

export default function PlansPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const session = await safeGetSession(supabase);
        if (!session || !session.user) {
          router.push('/login?redirect=/dashboard/plans');
          return;
        }

        setUser(session.user);

        const { data: { session: apiSession } } = await supabase.auth.getSession();
        if (!apiSession) {
          setError('Session expired');
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/dashboard/recurring-schedules', {
          headers: {
            'Authorization': `Bearer ${apiSession.access_token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.ok) {
          setSchedules(data.schedules || []);
        } else {
          setError(data.error || 'Failed to load plans');
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
        devLog.error('Error fetching plans:', err);
        setError('Failed to load plans');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [router]);

  const activePlans = schedules.filter(s => s.is_active);
  const inactivePlans = schedules.filter(s => !s.is_active);

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white">
        <NewHeader user={user} customer={customer} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white pb-32 lg:pb-0">
      <NewHeader user={user} customer={customer} />
      
      <main className="py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cleaning Plans</h1>
            </div>
            <Button asChild className="bg-gradient-to-r from-teal-500 to-green-500">
              <Link href="/booking/service/select?recurring=true">
                <Plus className="h-4 w-4 mr-2" />
                Add New Plan
              </Link>
            </Button>
          </div>

          {/* Active Plans */}
          {activePlans.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Plans</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {activePlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{plan.service_type}</CardTitle>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <RefreshCw className="h-4 w-4" />
                            <span className="capitalize">{plan.frequency.replace('-', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>{plan.preferred_time}</span>
                          </div>
                          <div className="flex items-start gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 mt-0.5" />
                            <span>{plan.address_line1}, {plan.address_suburb}, {plan.address_city}</span>
                          </div>
                          <div className="text-gray-600">
                            Started: {format(new Date(plan.start_date), 'MMM d, yyyy')}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2 border-t">
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link href={`/dashboard/plans/${plan.id}/modify`}>Modify</Link>
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" asChild>
                            <Link href={`/dashboard/plans/${plan.id}/upgrade`}>Upgrade</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Plans */}
          {inactivePlans.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Inactive Plans</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {inactivePlans.map((plan, index) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (activePlans.length + index) * 0.1 }}
                  >
                    <Card className="opacity-60">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{plan.service_type}</CardTitle>
                          <Badge variant="outline">Inactive</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4" />
                            <span className="capitalize">{plan.frequency.replace('-', ' ')}</span>
                          </div>
                          {plan.end_date && (
                            <div>
                              Ended: {format(new Date(plan.end_date), 'MMM d, yyyy')}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {schedules.length === 0 && (
            <Card className="border-2 border-dashed border-teal-300 bg-teal-50/30">
              <CardContent className="p-8 text-center">
                <RefreshCw className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No cleaning plans yet</h2>
                <p className="text-gray-600 mb-6">Set up a recurring cleaning plan for regular service!</p>
                <Button asChild className="bg-gradient-to-r from-teal-500 to-green-500">
                  <Link href="/booking/service/select?recurring=true">Create a Plan</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
