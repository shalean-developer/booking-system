'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
import { safeLogout } from '@/lib/logout-utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface SessionTimeoutWarningProps {
  warningMinutes?: number; // Minutes before expiry to show warning (default: 5)
  checkInterval?: number; // Check interval in seconds (default: 30)
}

export function SessionTimeoutWarning({ 
  warningMinutes = 5,
  checkInterval = 30 
}: SessionTimeoutWarningProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExtending, setIsExtending] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  const checkSessionExpiry = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return;
      }

      // Get session expiry time (in seconds since epoch)
      const expiresAt = session.expires_at;
      if (!expiresAt) {
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresIn = expiresAt - now; // seconds until expiry
      const expiresInMinutes = expiresIn / 60;

      // If session expires in less than warningMinutes, show warning
      if (expiresInMinutes <= warningMinutes && expiresInMinutes > 0) {
        setIsOpen(true);
        setTimeRemaining(Math.floor(expiresInMinutes));
        setCountdown(Math.floor(expiresIn));
      } else if (expiresIn <= 0) {
        // Session already expired, logout immediately
        handleLogout();
      }
    } catch (error) {
      devLog.error('Error checking session expiry:', error);
    }
  }, [warningMinutes]);

  const handleExtendSession = async () => {
    setIsExtending(true);
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      if (session) {
        toast.success('Session extended successfully');
        setIsOpen(false);
        setTimeRemaining(0);
        setCountdown(0);
      }
    } catch (error) {
      devLog.error('Error extending session:', error);
      toast.error('Failed to extend session. Please save your work.');
      // Still close the modal, but session might expire soon
      setIsOpen(false);
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await safeLogout(supabase, router, {
      timeout: 5000,
      onSuccess: () => {
        toast.info('Your session has expired. Please log in again.');
      },
      onError: (error) => {
        devLog.error('Logout error:', error);
      },
    });
  };

  // Check session expiry periodically
  useEffect(() => {
    checkSessionExpiry();
    const interval = setInterval(checkSessionExpiry, checkInterval * 1000);
    return () => clearInterval(interval);
  }, [checkSessionExpiry, checkInterval]);

  // Update countdown every second when warning is open
  useEffect(() => {
    if (!isOpen || countdown <= 0) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        const newCountdown = prev - 1;
        if (newCountdown <= 0) {
          handleLogout();
          return 0;
        }
        setTimeRemaining(Math.floor(newCountdown / 60));
        return newCountdown;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [isOpen, countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            Session Expiring Soon
          </DialogTitle>
          <DialogDescription className="pt-2">
            Your session will expire in{' '}
            <span className="font-semibold text-amber-600">
              {timeRemaining} {timeRemaining === 1 ? 'minute' : 'minutes'}
            </span>
            {' '}({formatTime(countdown)}).
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-3">
          <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Extend your session to continue working
              </p>
              <p className="text-xs text-gray-600 mt-1">
                You'll be automatically logged out if you don't extend your session.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isExtending}
            aria-label="Log out now"
          >
            Log Out Now
          </Button>
          <Button
            onClick={handleExtendSession}
            disabled={isExtending}
            className="bg-gradient-to-r from-teal-500 to-blue-500"
            aria-label="Extend session"
            aria-busy={isExtending}
          >
            {isExtending ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Extending...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Extend Session
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
