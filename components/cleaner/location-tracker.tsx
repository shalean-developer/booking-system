'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LocationTracker() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateLocation = async () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Geolocation not supported');
      return;
    }

    setStatus('loading');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch('/api/cleaner/location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          });

          const data = await response.json();

          if (!data.ok) {
            throw new Error(data.error || 'Failed to update location');
          }

          setStatus('success');
          setLastUpdate(new Date());
          setErrorMessage(null);
        } catch (error) {
          console.error('Error updating location:', error);
          setStatus('error');
          setErrorMessage('Failed to update location');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setStatus('error');
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setErrorMessage('Location permission denied');
            break;
          case error.POSITION_UNAVAILABLE:
            setErrorMessage('Location unavailable');
            break;
          case error.TIMEOUT:
            setErrorMessage('Location request timeout');
            break;
          default:
            setErrorMessage('Location error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
      }
    );
  };

  useEffect(() => {
    // Initial update
    updateLocation();

    // Update every 2 minutes
    intervalRef.current = setInterval(() => {
      updateLocation();
    }, 2 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <Check className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'loading':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = () => {
    if (errorMessage) return errorMessage;
    if (status === 'loading') return 'Updating location...';
    if (status === 'success' && lastUpdate) {
      const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
      if (minutesAgo === 0) return 'Location updated just now';
      return `Updated ${minutesAgo}m ago`;
    }
    return 'GPS tracking';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
        getStatusColor()
      )}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
}

