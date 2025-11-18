/**
 * PWA Install Prompt Utilities
 * Handles "Add to Home Screen" functionality
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

/**
 * Listen for the beforeinstallprompt event
 * This event is fired when the browser thinks the app is installable
 */
export function setupInstallPrompt() {
  if (typeof window === 'undefined') return;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Store the event for later use
    deferredPrompt = e as BeforeInstallPromptEvent;
    
    // Dispatch custom event so components can listen
    window.dispatchEvent(new CustomEvent('pwa-installable', { detail: deferredPrompt }));
    
    console.log('[PWA] Install prompt available');
  });

  // Track if app was installed
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App was installed');
    deferredPrompt = null;
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });
}

/**
 * Show the install prompt
 * Returns true if prompt was shown, false if not available
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }

  try {
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('[PWA] User response:', outcome);
    
    // Clear the deferred prompt
    deferredPrompt = null;
    
    return outcome === 'accepted';
  } catch (error) {
    console.error('[PWA] Error showing install prompt:', error);
    return false;
  }
}

/**
 * Check if the app is already installed
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode (installed PWA)
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }
  
  // Check if running from home screen (iOS)
  if ((window.navigator as any).standalone === true) {
    return true;
  }
  
  return false;
}

/**
 * Check if install prompt is available
 */
export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null;
}

/**
 * Get install prompt instance (for advanced usage)
 */
export function getInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

