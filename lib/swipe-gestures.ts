/**
 * Swipe Gesture Utilities
 * Detects swipe gestures for mobile interactions
 */

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isSwiping: boolean;
}

const SWIPE_THRESHOLD = 50; // Minimum distance in pixels to trigger swipe
const SWIPE_VELOCITY_THRESHOLD = 0.3; // Minimum velocity to trigger swipe

/**
 * Setup swipe gesture detection on an element
 */
export function setupSwipeGesture(
  element: HTMLElement,
  handlers: SwipeHandlers
): () => void {
  let state: SwipeState = {
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false,
  };

  let startTime = 0;

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0];
    state = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: true,
    };
    startTime = Date.now();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!state.isSwiping) return;
    
    const touch = e.touches[0];
    state.currentX = touch.clientX;
    state.currentY = touch.clientY;
  };

  const handleTouchEnd = () => {
    if (!state.isSwiping) return;

    const deltaX = state.currentX - state.startX;
    const deltaY = state.currentY - state.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - startTime;
    const velocity = distance / duration;

    // Determine swipe direction
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && velocity > SWIPE_VELOCITY_THRESHOLD) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > SWIPE_THRESHOLD && velocity > SWIPE_VELOCITY_THRESHOLD) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }
    }

    // Reset state
    state.isSwiping = false;
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: true });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  // Cleanup function
  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * React hook for swipe gestures
 */
export function useSwipeGesture(handlers: SwipeHandlers) {
  if (typeof window === 'undefined') {
    return (element: HTMLElement | null) => {};
  }

  return (element: HTMLElement | null) => {
    if (!element) return;

    return setupSwipeGesture(element, handlers);
  };
}

