import { useState, useEffect, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number; // Distance in pixels to trigger refresh
  disabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

const DEFAULT_THRESHOLD = 80; // pixels

export function usePullToRefresh({
  onRefresh,
  threshold = DEFAULT_THRESHOLD,
  disabled = false,
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
  });

  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Check if we're at the top of the scrollable container
  const isAtTop = useCallback((element: HTMLElement): boolean => {
    return element.scrollTop === 0;
  }, []);

  // Check if device supports touch
  const isTouchDevice = useCallback((): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }, []);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || !isTouchDevice() || state.isRefreshing) return;

      // Check if we're at the top of the page
      const scrollContainer = document.documentElement;
      if (!isAtTop(scrollContainer)) return;

      startY.current = e.touches[0].clientY;
      currentY.current = startY.current;
      isDragging.current = true;
    },
    [disabled, isTouchDevice, isAtTop, state.isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current || disabled || state.isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const pullDistance = Math.max(0, currentY.current - startY.current);

      // Only allow pulling down
      if (pullDistance > 0) {
        e.preventDefault(); // Prevent default scroll behavior
        setState((prev) => ({
          ...prev,
          isPulling: true,
          pullDistance,
        }));
      }
    },
    [disabled, state.isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current || disabled) return;

    isDragging.current = false;

    if (state.pullDistance >= threshold) {
      // Trigger refresh
      setState((prev) => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
      }));

      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh error:', error);
      } finally {
        setState({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false,
        });
      }
    } else {
      // Reset if not enough pull distance
      setState({
        isPulling: false,
        pullDistance: 0,
        isRefreshing: false,
      });
    }
  }, [disabled, state.pullDistance, threshold, onRefresh]);

  useEffect(() => {
    if (disabled || !isTouchDevice()) return;

    // Use window for touch events since we need to detect scroll position
    window.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [disabled, isTouchDevice, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate pull progress (0 to 1)
  const pullProgress = Math.min(state.pullDistance / threshold, 1);

  // Determine if should show refresh indicator
  const shouldShowIndicator = state.pullDistance >= threshold;

  return {
    ...state,
    pullProgress,
    shouldShowIndicator,
    containerRef,
  };
}
