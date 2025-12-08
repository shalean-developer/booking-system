/**
 * Performance monitoring utilities
 * Tracks Core Web Vitals, API response times, and user interactions
 */

// Type definitions for PerformanceObserver entries
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface ApiPerformanceMetric {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  timestamp: number;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private apiMetrics: ApiPerformanceMetric[] = [];
  private readonly maxMetrics = 100; // Keep last 100 metrics

  /**
   * Initialize Core Web Vitals tracking
   */
  init() {
    if (typeof window === 'undefined') return;

    // Track Largest Contentful Paint (LCP)
    this.trackLCP();

    // Track First Input Delay (FID)
    this.trackFID();

    // Track Cumulative Layout Shift (CLS)
    this.trackCLS();

    // Track API performance
    this.interceptFetch();
  }

  /**
   * Track Largest Contentful Paint (LCP)
   * Target: < 2.5s (good), 2.5s-4s (needs improvement), > 4s (poor)
   */
  private trackLCP() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
        };

        const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
        const rating = lcp < 2500 ? 'good' : lcp < 4000 ? 'needs-improvement' : 'poor';

        this.recordMetric({
          name: 'LCP',
          value: lcp,
          rating,
          timestamp: Date.now(),
          metadata: {
            element: lastEntry.name,
            url: window.location.pathname,
          },
        });
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('Failed to track LCP:', error);
    }
  }

  /**
   * Track First Input Delay (FID)
   * Target: < 100ms (good), 100ms-300ms (needs improvement), > 300ms (poor)
   */
  private trackFID() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime;
          const rating = fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor';

          this.recordMetric({
            name: 'FID',
            value: fid,
            rating,
            timestamp: Date.now(),
            metadata: {
              eventType: entry.name,
              url: window.location.pathname,
            },
          });
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('Failed to track FID:', error);
    }
  }

  /**
   * Track Cumulative Layout Shift (CLS)
   * Target: < 0.1 (good), 0.1-0.25 (needs improvement), > 0.25 (poor)
   */
  private trackCLS() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

    try {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as LayoutShift[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });

        const rating = clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor';

        this.recordMetric({
          name: 'CLS',
          value: clsValue,
          rating,
          timestamp: Date.now(),
          metadata: {
            url: window.location.pathname,
          },
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Failed to track CLS:', error);
    }
  }

  /**
   * Intercept fetch calls to track API performance
   */
  private interceptFetch() {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;
    const self = this;

    window.fetch = async function (...args) {
      const startTime = performance.now();
      let url: string;
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (args[0] instanceof URL) {
        url = args[0].toString();
      } else {
        url = (args[0] as Request).url;
      }
      const method = (args[1]?.method || 'GET').toUpperCase();

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        self.recordApiMetric({
          endpoint: url,
          method,
          duration,
          status: response.status,
          timestamp: Date.now(),
        });

        return response;
      } catch (error) {
        const duration = performance.now() - startTime;

        self.recordApiMetric({
          endpoint: url,
          method,
          duration,
          status: 0,
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        throw error;
      }
    };
  }

  /**
   * Record a performance metric
   */
  private recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Log poor performance metrics
    if (metric.rating === 'poor') {
      console.warn(`[Performance] ${metric.name} is poor: ${metric.value}ms`, metric.metadata);
    }

    // Send to error tracking if configured
    if (typeof window !== 'undefined' && (window as any).__SENTRY__) {
      // Could send to Sentry for monitoring
    }
  }

  /**
   * Record an API performance metric
   */
  private recordApiMetric(metric: ApiPerformanceMetric) {
    this.apiMetrics.push(metric);
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics.shift();
    }

    // Log slow API calls (> 2 seconds)
    if (metric.duration > 2000) {
      console.warn(`[Performance] Slow API call: ${metric.method} ${metric.endpoint} took ${metric.duration.toFixed(0)}ms`);
    }
  }

  /**
   * Get all performance metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get all API performance metrics
   */
  getApiMetrics(): ApiPerformanceMetric[] {
    return [...this.apiMetrics];
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const lcp = this.metrics.filter((m) => m.name === 'LCP').slice(-1)[0];
    const fid = this.metrics.filter((m) => m.name === 'FID').slice(-1)[0];
    const cls = this.metrics.filter((m) => m.name === 'CLS').slice(-1)[0];

    const recentApiMetrics = this.apiMetrics.slice(-20);
    const avgApiTime =
      recentApiMetrics.length > 0
        ? recentApiMetrics.reduce((sum, m) => sum + m.duration, 0) / recentApiMetrics.length
        : 0;

    return {
      lcp: lcp ? { value: lcp.value, rating: lcp.rating } : null,
      fid: fid ? { value: fid.value, rating: fid.rating } : null,
      cls: cls ? { value: cls.value, rating: cls.rating } : null,
      avgApiTime: Math.round(avgApiTime),
      totalApiCalls: this.apiMetrics.length,
      slowApiCalls: this.apiMetrics.filter((m) => m.duration > 2000).length,
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = [];
    this.apiMetrics = [];
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize automatically in browser (only on client side)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Wait for page load
  if (document.readyState === 'complete') {
    performanceMonitor.init();
  } else {
    window.addEventListener('load', () => {
      performanceMonitor.init();
    });
  }
}
