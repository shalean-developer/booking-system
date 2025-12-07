/**
 * Development-only logger utility
 * Logs are automatically removed in production builds
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const devLog = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  // Error logging should always work (even in production) for debugging
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
