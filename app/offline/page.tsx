'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Redirect to dashboard after coming back online
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleRetry = () => {
    if (navigator.onLine) {
      router.push('/dashboard');
    } else {
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/30 via-white to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="border-2 border-dashed border-teal-300">
          <CardContent className="p-8 text-center">
            <motion.div
              animate={{ 
                scale: isOnline ? [1, 1.1, 1] : 1,
                rotate: isOnline ? [0, 10, -10, 0] : 0,
              }}
              transition={{ 
                duration: 0.5,
                repeat: isOnline ? Infinity : 0,
                repeatDelay: 2,
              }}
              className="mb-6"
            >
              <WifiOff className="h-20 w-20 text-teal-600 mx-auto" />
            </motion.div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isOnline ? 'Connection Restored!' : "You're Offline"}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {isOnline
                ? 'Redirecting you back to the dashboard...'
                : 'It looks like you\'ve lost your internet connection. Don\'t worry, you can still view cached content.'}
            </p>

            {isOnline ? (
              <div className="flex items-center justify-center gap-2 text-teal-600">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Reconnecting...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <Button onClick={handleRetry} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push('/')}
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            )}

            {!isOnline && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-gray-500">
                  💡 Tip: Some features may still work offline using cached data.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
