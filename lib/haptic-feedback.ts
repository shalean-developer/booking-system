/**
 * Haptic Feedback Utilities
 * Provides tactile feedback for mobile interactions
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Trigger haptic feedback
 * Works on devices that support the Vibration API
 */
export function triggerHaptic(type: HapticType = 'medium'): void {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) {
    return;
  }

  const patterns: Record<HapticType, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 30,
    success: [20, 50, 20],
    warning: [30, 50, 30],
    error: [40, 50, 40, 50, 40],
  };

  try {
    navigator.vibrate(patterns[type]);
  } catch (error) {
    // Silently fail if vibration is not supported
    console.debug('[Haptic] Vibration not supported:', error);
  }
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return 'vibrate' in navigator;
}

