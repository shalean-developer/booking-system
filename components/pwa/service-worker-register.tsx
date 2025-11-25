'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Skip Service Worker registration in development
    if (process.env.NODE_ENV === 'development') {
      // Unregister any existing service workers in development
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
            console.log('[Service Worker] Unregistered in development mode');
          });
        });
      }
      return;
    }

    if (typeof window === 'undefined' || 'serviceWorker' in navigator === false) {
      return;
    }

    // Register service worker (production only)
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('[Service Worker] Registered:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available, prompt user to refresh
                console.log('[Service Worker] New version available');
                // You can show a toast notification here
              }
            });
          }
        });
      } catch (error) {
        console.error('[Service Worker] Registration failed:', error);
      }
    };

    // Wait for page load
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }
  }, []);

  return null;
}

