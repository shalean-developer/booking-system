'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { safeGetSession, handleRefreshTokenError } from '@/lib/logout-utils';
import { setUserContext } from '@/lib/utils/error-tracking';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { NewHeader } from '@/components/dashboard/new-header';
import { CustomerDashboard } from '@/components/dashboard/customer-dashboard-ui';

function metadataString(meta: Record<string, unknown> | undefined, key: string): string | null {
  const v = meta?.[key];
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const verifySession = useCallback(async () => {
    try {
      setError(null);
      const session = await safeGetSession(supabase);

      if (!session?.user) {
        setUser(null);
        setError('UNAUTHENTICATED');
        return;
      }

      const authUser = session.user;
      setUser(authUser);

      if (authUser.id) {
        setUserContext(authUser.id, authUser.email, {
          email: authUser.email,
        });
      }

      try {
        const { data, error: sessErr } = await supabase.auth.getSession();
        if (sessErr) {
          if (handleRefreshTokenError(sessErr)) {
            setUser(null);
            setError('UNAUTHENTICATED');
            return;
          }
          throw sessErr;
        }
        if (!data.session) {
          setUser(null);
          setError('UNAUTHENTICATED');
          return;
        }
      } catch (e: unknown) {
        if (handleRefreshTokenError(e)) {
          setUser(null);
          setError('UNAUTHENTICATED');
          return;
        }
        throw e;
      }
    } catch {
      setError('Failed to verify your session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  if (error) {
    if (error === 'UNAUTHENTICATED') {
      return (
        <div className="min-h-screen bg-white">
          <NewHeader user={user} customer={null} />
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md mx-4">
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Please Log In</h2>
                <p className="text-gray-600 mb-6">You need to be logged in to view your dashboard.</p>
                <div className="space-y-3">
                  <Button onClick={() => router.push('/login')} className="w-full">
                    Log In
                  </Button>
                  <Button onClick={() => router.push('/signup')} variant="outline" className="w-full">
                    Create Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white">
        <NewHeader user={user} customer={null} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/')}>Go Home</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const meta = user?.user_metadata;

  return (
    <main id="main-content" className="min-w-0" role="main">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh] px-4">
          <div className="text-slate-500 text-sm font-medium">Loading your dashboard...</div>
        </div>
      ) : (
        <CustomerDashboard
          userEmail={user?.email ?? null}
          firstName={metadataString(meta, 'first_name') ?? metadataString(meta, 'firstName')}
          lastName={metadataString(meta, 'last_name') ?? metadataString(meta, 'lastName')}
          addressLine={null}
        />
      )}
    </main>
  );
}
