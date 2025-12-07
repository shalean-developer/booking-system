/**
 * Error tracking utilities
 * Provides a unified interface for error tracking services (Sentry, LogRocket, etc.)
 */

interface ErrorTrackingConfig {
  enabled: boolean;
  service?: 'sentry' | 'logrocket' | 'console';
  dsn?: string;
  environment?: string;
}

let config: ErrorTrackingConfig = {
  enabled: false,
  service: 'console',
  environment: process.env.NODE_ENV || 'development',
};

/**
 * Initialize error tracking service
 */
export function initErrorTracking(serviceConfig: Partial<ErrorTrackingConfig> = {}) {
  config = { ...config, ...serviceConfig };

  if (!config.enabled) {
    return;
  }

  // Initialize Sentry if configured
  if (config.service === 'sentry' && config.dsn && typeof window !== 'undefined') {
    try {
      // Dynamic import to avoid bundling Sentry in production if not needed
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
          dsn: config.dsn,
          environment: config.environment,
          tracesSampleRate: 1.0,
          beforeSend(event, hint) {
            // Filter out development errors
            if (config.environment === 'development') {
              console.log('[Sentry] Would send error:', event);
              return null; // Don't send in development
            }
            return event;
          },
        });
      });
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }

  // Initialize LogRocket if configured
  if (config.service === 'logrocket' && typeof window !== 'undefined') {
    try {
      // LogRocket would be initialized here
      // import LogRocket from 'logrocket';
      // LogRocket.init(config.dsn);
      console.log('[Error Tracking] LogRocket not yet configured');
    } catch (error) {
      console.warn('Failed to initialize LogRocket:', error);
    }
  }
}

/**
 * Capture an exception/error
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (!config.enabled) {
    console.error('[Error Tracking] Error captured:', error, context);
    return;
  }

  if (config.service === 'sentry' && typeof window !== 'undefined') {
    try {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, {
          contexts: {
            custom: context || {},
          },
        });
      });
    } catch (err) {
      console.error('Failed to capture exception:', err);
    }
  } else {
    console.error('[Error Tracking]', error, context);
  }
}

/**
 * Capture a message (non-error)
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, unknown>) {
  if (!config.enabled) {
    console.log(`[Error Tracking] ${level.toUpperCase()}:`, message, context);
    return;
  }

  if (config.service === 'sentry' && typeof window !== 'undefined') {
    try {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureMessage(message, {
          level: level === 'info' ? 'info' : level === 'warning' ? 'warning' : 'error',
          contexts: {
            custom: context || {},
          },
        });
      });
    } catch (err) {
      console.error('Failed to capture message:', err);
    }
  } else {
    console.log(`[Error Tracking] ${level.toUpperCase()}:`, message, context);
  }
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, metadata?: Record<string, unknown>) {
  if (!config.enabled) return;

  if (config.service === 'sentry' && typeof window !== 'undefined') {
    try {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.setUser({
          id: userId,
          email,
          ...metadata,
        });
      });
    } catch (err) {
      console.error('Failed to set user context:', err);
    }
  }
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
  if (!config.enabled) return;

  if (config.service === 'sentry' && typeof window !== 'undefined') {
    try {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.setUser(null);
      });
    } catch (err) {
      console.error('Failed to clear user context:', err);
    }
  }
}

// Initialize with environment variables if available
if (typeof window !== 'undefined') {
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (sentryDsn) {
    initErrorTracking({
      enabled: true,
      service: 'sentry',
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
    });
  }
}
